import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    console.log("Checking for admin user...");
    let systemAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
    console.log("systemAdmin:", systemAdmin);
    
    if (!systemAdmin) {
        try {
            console.log("Creating system admin...");
            systemAdmin = await db.user.create({
                data: {
                    email: "finley@talentearth.com",
                    firstName: "Finley",
                    lastName: "System",
                    role: "ADMIN",
                    status: "APPROVED"
                }
            });
            console.log("Created successfully");
        } catch (e) {
            console.error("Failed to create admin:", e);
        }
    }
}

main().catch(console.error).finally(() => db.$disconnect());
