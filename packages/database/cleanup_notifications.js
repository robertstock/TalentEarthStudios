const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        const result = await prisma.notification.deleteMany({});
        console.log(`Successfully deleted ${result.count} notifications.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
