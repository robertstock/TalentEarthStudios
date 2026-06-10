import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
    const projects = await db.project.findMany({
        where: {
            status: { in: ["SOW_DRAFT", "APPROVED_FOR_SOW"] }
        }
    });
    console.log(`Found ${projects.length} incoming projects`);
    console.log(projects.map(p => ({ id: p.id, name: p.name, status: p.status })));
}

main().catch(console.error).finally(() => db.$disconnect());
