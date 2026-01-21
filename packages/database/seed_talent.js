const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Teams and Talent...');

    const team1 = await prisma.team.create({
        data: {
            name: 'Visionary Media Group',
            description: 'Full-service production team specializing in corporate storytelling.',
            email: 'prod@visionary.com',
        },
    });

    const team2 = await prisma.team.create({
        data: {
            name: 'Elite Cinematics',
            description: 'High-end cinematography and post-production collective.',
            email: 'hello@elitecinema.com',
        },
    });

    await prisma.talent.createMany({
        data: [
            {
                name: 'Jordan Smith',
                email: 'jordan@visionary.com',
                specialty: 'Director of Photography',
                teamId: team1.id,
            },
            {
                name: 'Sarah Chen',
                email: 'sarah@visionary.com',
                specialty: 'Lead Editor',
                teamId: team1.id,
            },
            {
                name: 'Marcus Thorne',
                email: 'marcus@elitecinema.com',
                specialty: 'VFX Supervisor',
                teamId: team2.id,
            },
            {
                name: 'Elena Rodriguez',
                email: 'elena@independent.com',
                specialty: 'Production Designer',
            },
        ],
    });

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
