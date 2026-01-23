const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Project Status Counts...');
    const counts = await prisma.project.groupBy({
        by: ['status'],
        _count: {
            id: true
        }
    });
    console.log(counts);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
