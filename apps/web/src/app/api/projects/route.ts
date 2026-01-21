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
        const body = await req.json();
        const { name, categoryId, answers } = body;

        // Find default admin user to assign as creator (since mobile is unauthed)
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            return NextResponse.json({ message: "No admin user found to assign project to" }, { status: 500 });
        }

        // Find default client (Acme Corp)
        const defaultClient = await db.client.findFirst({
            where: { companyName: 'Acme Corp' }
        });

        // Parse answers to find Description, Budget, Timeline if needed
        // We need to look up the question definitions to know which ID corresponds to which field
        // But for now, let's rely on the answer values being passed.
        // The mobile app sends answers keyed by question ID.
        // We can try to find the "LONG_TEXT" answer for description.

        let description = "Mobile Project Submission";
        let budget = null;
        let timeline = "Standard";
        let clientName = null;

        // Fetch question types for this category to map answers correctly
        if (categoryId) {
            const category = await db.category.findUnique({
                where: { id: categoryId },
                include: { questionSets: { include: { questions: true } } }
            });
            const activeSet = category?.questionSets.find(qs => qs.active);
            if (activeSet) {
                for (const q of activeSet.questions) {
                    if (answers[q.id]) {
                        if (q.type === 'LONG_TEXT') description = answers[q.id];
                        if (q.prompt === 'Budget Range') budget = answers[q.id];
                        if (q.prompt === 'Timeline') timeline = answers[q.id];
                        if (q.prompt === 'Client Name') clientName = answers[q.id];
                    }
                }
            }
        }

        // Determine Client
        let clientIdToAssign = defaultClient?.id;

        if (clientName) {
            // Check if client exists by name
            const existingClient = await db.client.findFirst({
                where: { companyName: { equals: clientName, mode: 'insensitive' } }
            });

            if (existingClient) {
                clientIdToAssign = existingClient.id;
            } else {
                // Create new client
                const newClient = await db.client.create({
                    data: {
                        companyName: clientName,
                        primaryContactName: 'Unknown', // Placeholder
                    }
                });
                clientIdToAssign = newClient.id;
            }
        }

        const project = await db.project.create({
            data: {
                title: name,
                description: description,
                timeline: timeline || "Standard",
                budgetRange: budget,
                assignedType: "INDIVIDUAL",
                createdByAdminId: adminUser.id,
                categoryId: categoryId,
                status: "DRAFT",
                clientId: clientIdToAssign,

                // Create answers
                answers: {
                    create: Object.entries(answers || {}).map(([qId, val]) => ({
                        questionId: qId,
                        valueText: typeof val === 'string' ? val : JSON.stringify(val),
                        valueJson: typeof val === 'object' ? JSON.stringify(val) : null
                    }))
                }
            }
        });

        return NextResponse.json(project);
    } catch (error) {
        console.error("CREATE_PROJECT_ERROR", error);
        return NextResponse.json({ message: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
