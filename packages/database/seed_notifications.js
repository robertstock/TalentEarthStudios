const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        const user = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!user) {
            console.log('No admin user found to seed notifications for.');
            return;
        }

        console.log(`Seeding 50 notifications for user: ${user.email}`);

        const notifications = [];
        for (let i = 1; i <= 50; i++) {
            notifications.push({
                userId: user.id,
                type: i % 3 === 0 ? 'PROJECT_UPDATE' : 'SYSTEM',
                title: `Test Notification ${i}`,
                message: `This is the message for test notification number ${i}. It is used to test volume handling in the mobile app.`,
                isRead: i > 10,
                createdAt: new Date(Date.now() - (i * 3600000)), // Spread over 50 hours
            });
        }

        await prisma.notification.createMany({
            data: notifications
        });

        console.log('Successfully seeded 50 notifications.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
