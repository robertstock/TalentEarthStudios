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

    console.log({ talent })

    // Categories
    const categories = [
        { name: 'Film Production', desc: 'Full-service video production for commercials, branded content, and narrative films.' },
        { name: 'Prop Design / Fabrication', desc: 'Custom prop design and fabrication for film, theater, and events.' },
        { name: 'Set Design', desc: 'Conceptualization and construction of physical sets and environments.' },
        { name: 'Audio / Score', desc: 'Sound design, foley art, and original music scoring.' },
        { name: 'VFX / Post', desc: 'Visual effects, color grading, and post-production compositing.' },
        { name: 'Post Production', desc: 'Editing, sound mixing, and final deliverables.' },
    ]

    for (const cat of categories) {
        const existing = await prisma.category.findFirst({ where: { name: cat.name }, include: { questionSets: true } })

        if (!existing) {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    description: cat.desc,
                    questionSets: {
                        create: {
                            version: 1,
                            active: true,
                            questions: {
                                create: [
                                    { type: 'SHORT_TEXT', prompt: 'Client Name', required: true, ordering: 1 },
                                    { type: 'SHORT_TEXT', prompt: 'Project Name', required: true, ordering: 2 },
                                    { type: 'SINGLE_SELECT', prompt: 'Budget Range', required: true, ordering: 3, optionsJson: JSON.stringify(['$5k - $10k', '$10k - $25k', '$25k+']) },
                                    { type: 'SINGLE_SELECT', prompt: 'Timeline', required: true, ordering: 4, optionsJson: JSON.stringify(['Rush (<2 weeks)', 'Standard (3-4 weeks)', 'Flexible']) },
                                    { type: 'DATE', prompt: 'Target Delivery Date', required: false, ordering: 5 },
                                    { type: 'LONG_TEXT', prompt: 'Project Description', required: false, ordering: 6, helpText: 'Describe your project requirements, scope, and objectives...' }
                                ]
                            }
                        }
                    }
                }
            })
            console.log(`Created category: ${cat.name}`)
        } else {
            // If category exists, we should update the questions to ensure DATE is present
            // Simplest way is to find the active question set and add the question if missing, or just recreate questions.
            // For seed simplicity, we'll assuming we want to force update the definition.
            const activeSet = await prisma.questionSet.findFirst({ where: { categoryId: existing.id, active: true } });
            if (activeSet) {
                // Check if Client Name question exists
                const hasClientName = await prisma.question.findFirst({ where: { questionSetId: activeSet.id, prompt: 'Client Name' } });

                if (!hasClientName) {
                    await prisma.question.create({
                        data: {
                            questionSetId: activeSet.id,
                            type: 'SHORT_TEXT',
                            prompt: 'Client Name',
                            required: true,
                            ordering: 1
                        }
                    });

                    // Reorder other questions
                    await prisma.question.updateMany({ where: { questionSetId: activeSet.id, prompt: 'Project Name' }, data: { ordering: 2 } });
                    await prisma.question.updateMany({ where: { questionSetId: activeSet.id, prompt: 'Budget Range' }, data: { ordering: 3 } });
                    await prisma.question.updateMany({ where: { questionSetId: activeSet.id, prompt: 'Timeline' }, data: { ordering: 4 } });
                    await prisma.question.updateMany({ where: { questionSetId: activeSet.id, prompt: 'Target Delivery Date' }, data: { ordering: 5 } });
                    await prisma.question.updateMany({ where: { questionSetId: activeSet.id, prompt: 'Project Description' }, data: { ordering: 6 } });

                    console.log(`Updated category ${cat.name} with Client Name field`);
                }

                // Check if DATE question exists
                const hasDate = await prisma.question.findFirst({ where: { questionSetId: activeSet.id, type: 'DATE', prompt: 'Target Delivery Date' } });
                if (!hasDate) {
                    await prisma.question.create({
                        data: {
                            questionSetId: activeSet.id,
                            type: 'DATE',
                            prompt: 'Target Delivery Date',
                            required: false,
                            ordering: 5
                        }
                    });
                    console.log(`Updated category ${cat.name} with Date Picker`);
                }
            }
            console.log(`Category exists (checked updates): ${cat.name}`)
        }
    }

    // Create a Client
    // Create a Client
    const client = await prisma.client.upsert({
        where: { id: 'default-client' }, // We don't have a unique constraint on companyName, but for seed we can use a fixed ID or findFirst check.
        // Actually, schema shows Client has no unique fields other than ID.
        // Let's use findFirst then create.
        update: {},
        create: {
            companyName: 'Acme Corp',
            primaryContactName: 'John Smith',
            email: 'john@acme.com'
        }
    })

    // Better approach for Client since we can't upsert without unique:
    const existingClient = await prisma.client.findFirst({ where: { companyName: 'Acme Corp' } });
    if (!existingClient) {
        await prisma.client.create({
            data: {
                companyName: 'Acme Corp',
                primaryContactName: 'John Smith',
                email: 'john@acme.com'
            }
        });
        console.log('Created Client: Acme Corp');
    } else {
        console.log('Client Acme Corp already exists');
    }
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
