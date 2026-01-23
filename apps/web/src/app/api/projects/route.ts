import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

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
        let clientNameFromAnswers: string | null = null;
        let projectNameFromAnswers: string | null = null;

        // Fetch category for Date Mapping
        if (categoryId) {
            const category = await db.category.findUnique({
                where: { id: categoryId },
                include: { questionSets: { include: { questions: true } } }
            });
            const activeSet = category?.questionSets.find(qs => qs.active);

            if (activeSet) {
                // Dynamic Prompt Mapping
                // Maps hardcoded mobile keys (e.g. 'q_budget') to real DB Question IDs by matching their Prompts
                const promptMap: Record<string, string | string[]> = {
                    'q_budget': 'Budget Range',
                    'q_timeline': 'Timeline',
                    'q_description': ['Project Description', 'Creative Brief', 'Concept Description', 'Description & Specs'],
                    'q_date': ['Target Delivery Date', 'Event Date', 'Delivery Deadline', 'Target Shoot Date'],
                    'q_date_fallback': ['Target Delivery Date', 'Event Date', 'Delivery Deadline', 'Target Shoot Date'],
                    'q_client': ['Client Name', 'Company Name', 'Company', 'Brand Name'],
                    'q_project_name': ['Project Name', 'Campaign Title']
                };

                processedAnswers = processedAnswers.map(([key, val]) => {
                    if (promptMap[key]) {
                        const targetPrompts = Array.isArray(promptMap[key]) ? promptMap[key] : [promptMap[key]];
                        const realQuestion = activeSet.questions.find(q => targetPrompts.includes(q.prompt));

                        if (realQuestion) {
                            console.log(`Mapping ${key} -> ${realQuestion.id} (${realQuestion.prompt})`);

                            // Capture special values for Logic
                            if (targetPrompts.includes('Client Name') || targetPrompts.includes('Company Name') || targetPrompts.includes('Company')) {
                                clientNameFromAnswers = val as string;
                            }
                            if (targetPrompts.includes('Project Name') || targetPrompts.includes('Campaign Title')) {
                                projectNameFromAnswers = val as string;
                            }

                            return [realQuestion.id, val];
                        }
                    }

                    // Fallback: If key matches a UUID format, check if it's Client Name question
                    if (activeSet.questions.some(q => q.id === key && (q.prompt === 'Client Name' || q.prompt === 'Company Name'))) {
                        clientNameFromAnswers = val as string;
                    }
                    if (activeSet.questions.some(q => q.id === key && (q.prompt === 'Project Name'))) {
                        projectNameFromAnswers = val as string;
                    }

                    return [key, val];
                });
            }
        }

        // Resolve Client Logic
        let targetClientId = defaultClient.id;
        if (clientNameFromAnswers) {
            console.log(`Found Client Name in answers: ${clientNameFromAnswers}`);
            const existingClient = await db.client.findFirst({
                where: { companyName: { equals: clientNameFromAnswers, mode: 'insensitive' } }
            });

            if (existingClient) {
                targetClientId = existingClient.id;
            } else {
                const newClient = await db.client.create({
                    data: {
                        companyName: clientNameFromAnswers,
                        primaryContactName: 'Pending Contact' // Placeholder
                    }
                });
                targetClientId = newClient.id;
            }
        }

        // Resolve Project Name Logic
        // If the top-level name is generic (e.g. "Project 10/24...") and we have a specific answer, use the answer
        let finalName = name;
        if (projectNameFromAnswers && (!name || name.startsWith('Project '))) {
            finalName = projectNameFromAnswers;
        }

        // Filter to only valid UID question IDs (foreign key constraint requires real DB IDs)
        // Mock IDs like 'q1', 'q2' or 'q_date_fallback' must be excluded.
        // DB uses CUIDs (start with 'c') or UUIDs.
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const cuidRegex = /^c[a-z0-9]{20,}$/i;

        const validAnswers = processedAnswers.filter(([qId]) => {
            if (!qId) return false;
            return uuidRegex.test(qId) || cuidRegex.test(qId);
        });

        const project = await db.project.create({
            data: {
                name: finalName,
                // REMOVED: assignedType - field doesn't exist in schema
                createdById: adminUser.id,
                categoryId: categoryId,
                status: "SUBMITTED",
                clientId: targetClientId,
                assignedType: "INDIVIDUAL", // Required by DB constraint
                description: finalName, // Fallback for required field
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
