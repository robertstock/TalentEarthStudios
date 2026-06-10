import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    console.log("Looking for Finley admin...");
    const systemAdmin = await db.user.upsert({
        where: { email: "finley@talentearth.com" },
        update: { role: "ADMIN" },
        create: {
            email: "finley@talentearth.com",
            firstName: "Finley",
            lastName: "System",
            role: "ADMIN",
            status: "APPROVED"
        }
    });

    console.log("Looking for Client...");
    let client = await db.client.findFirst({ where: { email: "robertstock@me.com" } });
    if (!client) {
        client = await db.client.create({
            data: {
                companyName: "Personal Project",
                primaryContactName: "Robert Stock",
                email: "robertstock@me.com",
            }
        });
    }

    console.log("Creating Test Project...");
    const project = await db.project.create({
        data: {
            name: "Test Fake Project - Trade Show Booth",
            description: "A custom 10x10 booth with screens and LED.",
            budgetRange: "$25,000 to $40,000",
            timeline: "8 weeks",
            clientId: client.id,
            createdById: systemAdmin.id,
            status: "SOW_DRAFT",
            aiConfidenceScore: 92,
            urgencyScore: 80,
            complexityScore: 75,
            isAutoRouted: true,
            requiresRpmReview: false,
            exceptionReason: null,
            sows: {
                create: {
                    versionNumber: 1,
                    status: "DRAFT",
                    bodyRichText: "## SOW Summary\nThis is a test SOW created to verify the dashboard.",
                    createdById: systemAdmin.id
                }
            }
        }
    });

    console.log("Created project:", project.id);
}

main().catch(console.error).finally(() => db.$disconnect());
