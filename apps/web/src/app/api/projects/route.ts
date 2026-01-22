import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const projects = await db.project.findMany({
            include: {
                category: true,
                answers: true,
                recordings: true,
                adminReviews: {
                    include: { reviewer: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(projects);
    } catch (error) {
        console.error("GET_PROJECTS_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        console.log("POST /api/projects - Starting creation (v_cache_bust_1)");
        const body = await req.json();
        const { name, categoryId, answers } = body;

        // 1. Ensure Admin User Exists (Fail-safe)
        let adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            adminUser = await db.user.findFirst();

            if (!adminUser) {
                console.log("No users found. Creating backup admin for project submission.");
                adminUser = await db.user.create({
                    data: {
                        email: 'admin@finley.com',
                        firstName: 'Admin',
                        lastName: 'User',
                        role: 'ADMIN'
                    }
                });
            }
        }

        // 2. Ensure Default Client Exists (Fail-safe)
        let defaultClient = await db.client.findFirst({
            where: { companyName: 'Acme Corp' }
        });

        if (!defaultClient) {
            defaultClient = await db.client.create({
                data: {
                    companyName: 'Acme Corp',
                    primaryContactName: 'Default Contact',
                    email: 'contact@acme.com'
                }
            });
        }

        // Prepare answer processing
        let processedAnswers = Object.entries(answers || {});

        // Fetch category for Date Mapping
        if (categoryId) {
            const category = await db.category.findUnique({
                where: { id: categoryId },
                include: { questionSets: { include: { questions: true } } }
            });
            const activeSet = category?.questionSets.find(qs => qs.active);

            if (activeSet) {
                // Resolve Fallback Date ID
                const fallbackDateEntry = processedAnswers.find(([key]) => key.startsWith('q_date_fallback'));
                if (fallbackDateEntry) {
                    const realDateQuestion = activeSet.questions.find(q => q.type === 'DATE' || q.prompt === 'Target Delivery Date');
                    if (realDateQuestion) {
                        processedAnswers = processedAnswers.map(([k, v]) =>
                            k.startsWith('q_date_fallback') ? [realDateQuestion.id, v] : [k, v]
                        );
                    }
                }
            }
        }

        // Filter out invalid keys 
        const validAnswers = processedAnswers.filter(([qId]) => qId && !qId.startsWith('q_'));

        const project = await db.project.create({
            data: {
                name: name,
                // REMOVED: assignedType - field doesn't exist in schema
                createdById: adminUser.id,
                categoryId: categoryId,
                status: "SUBMITTED",
                clientId: defaultClient.id,
                assignedType: "INDIVIDUAL", // Required by DB constraint
                description: name, // Fallback for required field
                timeline: "",      // Fallback for required field

                answers: {
                    create: validAnswers.map(([qId, val]) => {
                        const valString = typeof val === 'string' ? val : (val ? JSON.stringify(val) : null);
                        const valJson = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : null;
                        return {
                            questionId: qId,
                            valueText: valString,
                            valueJson: valJson
                        };
                    })
                }
            }
        });

        // 3. Create Notification for Admin
        try {
            await db.notification.create({
                data: {
                    userId: adminUser.id,
                    type: 'PROJECT_SUBMITTED',
                    title: 'New Project Received',
                    message: `Project "${name}" has been submitted.`,
                    metadata: JSON.stringify({ projectId: project.id })
                }
            });
        } catch (notifError) {
            console.error("Failed to create notification:", notifError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("CREATE_PROJECT_ERROR", error);
        return NextResponse.json({ message: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
