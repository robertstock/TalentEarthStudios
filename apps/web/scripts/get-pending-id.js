const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: {
            status: {
                in: ['SUBMITTED', 'SENT']
            }
        },
        select: { id: true, name: true, status: true }
    });
    console.log(JSON.stringify(project));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
