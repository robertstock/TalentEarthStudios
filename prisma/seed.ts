import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = 'finley@talentearth.com'
    const password = await hash('password123', 10)

    // Upsert Admin
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: password,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            status: 'APPROVED'
        }
    })

    console.log({ admin })

    // Create dummy talent
    const talentEmail = 'talent@example.com'
    const talent = await prisma.user.upsert({
        where: { email: talentEmail },
        update: {},
        create: {
            email: talentEmail,
            passwordHash: password,
            firstName: 'Jane',
            lastName: 'Doe',
            role: 'TALENT',
            status: 'APPROVED',
            profile: {
                create: {
                    publicSlug: 'jane-d',
                    headline: 'Senior Videographer',
                    primaryDiscipline: 'Videography',
                    skills: ['Director', 'Editor', 'Colorist'],
                    location: 'Los Angeles, CA'
                }
            }
        }
    })

    console.log({ talent })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
