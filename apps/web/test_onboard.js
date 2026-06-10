const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
    console.log("--- STARTING DATABASE VALIDATION ---");
    
    // 1. Check for any existing pending talents
    const pendingCountBefore = await db.user.count({
        where: { role: "TALENT", status: "PENDING_REVIEW" }
    });
    console.log(`Pending talents count BEFORE test: ${pendingCountBefore}`);

    // 2. Simulate onboarding by inserting a test user
    console.log("Simulating onboarding submission...");
    const testEmail = `test.creative.${Date.now()}@example.com`;
    const testUser = await db.user.create({
        data: {
            firstName: "Alex",
            lastName: "VFX",
            email: testEmail,
            role: "TALENT",
            status: "PENDING_REVIEW",
            profile: {
                create: {
                    publicSlug: `alex-vfx-${Math.floor(Math.random() * 1000)}`,
                    headline: "VR Environment Artist",
                    bio: "An artist pushing the boundaries of virtual architecture and LED stage backgrounds.",
                    location: "Denver, CO",
                    primaryDiscipline: "VR Environment Artist",
                    socialsInternal: {
                        instagram: "https://instagram.com/alexvfx",
                        youtube: "https://youtube.com/c/alexvfx_portfolio",
                        website: "https://alexvfx.com"
                    },
                    skills: ["VR Environment Artist", "Unreal Engine", "3D Modeling"]
                }
            },
            portfolio: {
                create: [
                    {
                        type: "IMAGE",
                        title: "Cyberpunk Alleyway Render",
                        description: "Rendered in Unreal Engine 5.4",
                        assetUrl: "/uploads/profiles/test-image.jpg"
                    },
                    {
                        type: "LINK",
                        title: "Creative Resume.pdf",
                        description: "PDF Portfolio resume",
                        assetUrl: "/uploads/profiles/test-resume.pdf"
                    }
                ]
            }
        },
        include: {
            profile: true,
            portfolio: true
        }
    });

    console.log("Created test onboarding user:");
    console.log(`- ID: ${testUser.id}`);
    console.log(`- Email: ${testUser.email}`);
    console.log(`- Status: ${testUser.status}`);
    console.log(`- Profile Location: ${testUser.profile?.location}`);
    console.log(`- Portfolio Items Count: ${testUser.portfolio.length}`);

    // 3. Verify count has increased
    const pendingCountAfter = await db.user.count({
        where: { role: "TALENT", status: "PENDING_REVIEW" }
    });
    console.log(`Pending talents count AFTER test: ${pendingCountAfter}`);

    // 4. Test approval admin flow (simulate API call outcome)
    console.log("Approving test user...");
    const approvedUser = await db.user.update({
        where: { id: testUser.id },
        data: { status: "APPROVED" }
    });
    console.log(`Approved user status: ${approvedUser.status}`);

    // 5. Clean up test user
    console.log("Cleaning up test user...");
    await db.user.delete({ where: { id: testUser.id } });
    console.log("Cleaned up successfully.");
    console.log("--- DATABASE VALIDATION COMPLETE ---");
}

main().catch(console.error).finally(() => db.$disconnect());
