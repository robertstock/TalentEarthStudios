import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const email = formData.get("email") as string;
        const location = formData.get("location") as string;
        const headline = formData.get("headline") as string;
        const bio = formData.get("bio") as string || "";
        
        const instagram = formData.get("instagram") as string || "";
        const youtube = formData.get("youtube") as string || "";
        const behance = formData.get("behance") as string || "";
        const soundcloud = formData.get("soundcloud") as string || "";
        const website = formData.get("website") as string || "";

        // Verify required fields
        if (!firstName || !lastName || !email || !location || !headline) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "A profile with this email already exists" }, { status: 400 });
        }

        // Create the user in PENDING_REVIEW status
        const user = await db.user.create({
            data: {
                firstName,
                lastName,
                email,
                role: "TALENT",
                status: "PENDING_REVIEW",
            }
        });

        // Ensure directories exist
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (dirErr) {
            console.warn("Failed to create upload directory, will fallback to Base64:", dirErr);
        }

        // Save profile image if uploaded
        const profileImageFile = formData.get("profileImage") as File | null;
        let profileImagePath = "";
        if (profileImageFile && profileImageFile.size > 0) {
            const ext = path.extname(profileImageFile.name) || ".png";
            const filename = `profile-${user.id}${ext}`;
            const buffer = Buffer.from(await profileImageFile.arrayBuffer());
            const mime = profileImageFile.type || "image/png";
            try {
                await writeFile(path.join(uploadDir, filename), buffer);
                profileImagePath = `/uploads/profiles/${filename}`;
            } catch (fsErr) {
                console.warn("Filesystem write failed for profile image, falling back to Base64:", fsErr);
                profileImagePath = `data:${mime};base64,${buffer.toString("base64")}`;
            }
        }

        // Save socials JSON
        const socials = {
            instagram,
            youtube,
            behance,
            soundcloud,
            website
        };

        // Create TalentProfile
        const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString();
        const publicSlug = `${baseSlug}-${randomSuffix}`;

        await db.talentProfile.create({
            data: {
                userId: user.id,
                publicSlug,
                profileImage: profileImagePath || null,
                headline,
                bio,
                location,
                primaryDiscipline: headline,
                socialsInternal: socials as any,
                skills: [headline]
            }
        });

        // Save portfolio files and create PortfolioItems
        const portfolioFiles = formData.getAll("portfolioFiles") as File[];
        const portfolioItemsData = [];
        
        for (let i = 0; i < portfolioFiles.length; i++) {
            const file = portfolioFiles[i];
            if (file && file.size > 0) {
                const ext = path.extname(file.name);
                const safeName = file.name.replace(/[^a-zA-Z0-9.]+/g, "_");
                const filename = `portfolio-${user.id}-${i}-${safeName}`;
                const buffer = Buffer.from(await file.arrayBuffer());
                let assetUrl = "";

                // Determine file type
                let type: "IMAGE" | "VIDEO" | "LINK" = "LINK";
                const mime = file.type || "";
                if (mime.startsWith("image/")) {
                    type = "IMAGE";
                } else if (mime.startsWith("video/")) {
                    type = "VIDEO";
                }

                try {
                    await writeFile(path.join(uploadDir, filename), buffer);
                    assetUrl = `/uploads/profiles/${filename}`;
                } catch (fsErr) {
                    console.warn(`Filesystem write failed for portfolio file ${file.name}, falling back to Base64:`, fsErr);
                    assetUrl = `data:${mime};base64,${buffer.toString("base64")}`;
                }

                const portfolioItem = await db.portfolioItem.create({
                    data: {
                        userId: user.id,
                        type,
                        title: file.name,
                        description: `Uploaded during onboarding`,
                        assetUrl,
                        isPublic: true,
                        sortOrder: i
                    }
                });
                portfolioItemsData.push(portfolioItem);
            }
        }

        // Send Email via Resend
        const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const adminReviewUrl = `${appUrl}/admin/talent`;

        let emailSent = false;
        try {
            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #030508; color: #94A3B8;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00AEEF; margin: 0;">TalentEarth</h2>
                        <p style="color: #7AC943; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 5px 0 0 0;">Curation Alert</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #1E2530; margin: 20px 0;" />
                    <p style="color: #E2E8F0;">A new creative has completed their onboarding profile on TalentEarth and is awaiting curation approval.</p>
                    
                    <h3 style="color: #E2E8F0; margin-top: 20px; border-left: 3px solid #00AEEF; padding-left: 8px;">Creative Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748B; width: 100px;"><strong>Name:</strong></td>
                            <td style="padding: 6px 0; color: #E2E8F0;">${firstName} ${lastName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748B;"><strong>Email:</strong></td>
                            <td style="padding: 6px 0; color: #E2E8F0;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748B;"><strong>Discipline:</strong></td>
                            <td style="padding: 6px 0; color: #E2E8F0;">${headline}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748B;"><strong>Location:</strong></td>
                            <td style="padding: 6px 0; color: #E2E8F0;">${location}</td>
                        </tr>
                    </table>
                    
                    ${bio ? `
                    <h3 style="color: #E2E8F0; margin-top: 20px; border-left: 3px solid #00AEEF; padding-left: 8px;">Biography</h3>
                    <p style="background-color: #0B0F15; padding: 12px; border-radius: 6px; font-style: italic; font-size: 14px; margin: 10px 0; line-height: 1.5;">"${bio}"</p>
                    ` : ""}
                    
                    <h3 style="color: #E2E8F0; margin-top: 20px; border-left: 3px solid #00AEEF; padding-left: 8px;">Creative & Social Links</h3>
                    <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6;">
                        ${instagram ? `<li><strong>Instagram:</strong> <a href="${instagram}" style="color: #00AEEF; text-decoration: none;">${instagram}</a></li>` : ""}
                        ${youtube ? `<li><strong>YouTube/Vimeo:</strong> <a href="${youtube}" style="color: #00AEEF; text-decoration: none;">${youtube}</a></li>` : ""}
                        ${behance ? `<li><strong>Behance/Dribbble:</strong> <a href="${behance}" style="color: #00AEEF; text-decoration: none;">${behance}</a></li>` : ""}
                        ${soundcloud ? `<li><strong>SoundCloud:</strong> <a href="${soundcloud}" style="color: #00AEEF; text-decoration: none;">${soundcloud}</a></li>` : ""}
                        ${website ? `<li><strong>Personal Website:</strong> <a href="${website}" style="color: #00AEEF; text-decoration: none;">${website}</a></li>` : ""}
                    </ul>

                    <h3 style="color: #E2E8F0; margin-top: 20px; border-left: 3px solid #00AEEF; padding-left: 8px;">Uploaded Media</h3>
                    <ul style="padding-left: 20px; font-size: 14px; line-height: 1.6;">
                        ${profileImagePath ? `<li><strong>Profile Photo:</strong> <a href="${appUrl}${profileImagePath}" style="color: #00AEEF; text-decoration: none;">View Profile Image</a></li>` : "<li>No profile photo uploaded.</li>"}
                        ${portfolioItemsData.length > 0 
                            ? portfolioItemsData.map(item => `
                                <li><strong>Portfolio Asset (${item.type}):</strong> <a href="${appUrl}${item.assetUrl}" style="color: #00AEEF; text-decoration: none;">${item.title}</a></li>
                              `).join("")
                            : "<li>No portfolio files uploaded.</li>"
                        }
                    </ul>

                    <div style="margin-top: 30px; text-align: center; border-top: 1px solid #1E2530; padding-top: 20px;">
                        <a href="${adminReviewUrl}" style="background-color: #7AC943; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
                            Go to Admin Talent Review &rarr;
                        </a>
                    </div>
                </div>
            `;

            console.log("========================================");
            console.log("📧 EMAIL NOTIFICATION: Talent Onboarding");
            console.log("To: admin@talentearth.com");
            console.log(`Review Link: ${adminReviewUrl}`);
            console.log(`Candidate: ${firstName} ${lastName} (${email})`);
            console.log("========================================");

            if (process.env.RESEND_API_KEY) {
                await resend.emails.send({
                    from: 'TalentEarth <onboarding@resend.dev>',
                    to: 'admin@talentearth.com',
                    subject: `New Talent Awaiting Approval: ${firstName} ${lastName}`,
                    html: emailHtml
                });
                emailSent = true;
            } else {
                console.warn("RESEND_API_KEY is missing, skipping email send (logged details to console).");
            }
        } catch (emailErr) {
            console.error("Failed to send Resend email:", emailErr);
        }

        return NextResponse.json({ success: true, userId: user.id, emailSent });
    } catch (err) {
        console.error("Onboarding endpoint error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
