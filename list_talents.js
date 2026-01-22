const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const talents = await prisma.user.findMany({
            where: { role: 'TALENT' },
            select: { id: true, firstName: true, lastName: true, email: true }
        });
        console.log('Talents in DB:', JSON.stringify(talents, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
