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
    // --- DATA FROM WEBSITE (src/lib/mock-data.ts) ---
    const MOCK_TALENTS = [
        {
            id: "mock-1",
            firstName: "Sarah",
            lastName: "Jenkins",
            email: "sarah.jenkins@example.com",
            headline: "Creative Director",
            primaryDiscipline: "Creative Direction",
            skills: ["Creative Direction", "Branding", "Campaign Strategy", "Team Leadership"],
            location: "New York, NY"
        },
        {
            id: "mock-2",
            firstName: "Emily",
            lastName: "Chen",
            email: "emily.chen@example.com",
            headline: "Art Director",
            primaryDiscipline: "Art Direction",
            skills: ["Art Direction", "UI/UX", "Editorial Design", "Typography"],
            location: "San Francisco, CA"
        },
        {
            id: "mock-3",
            firstName: "Michelle",
            lastName: "Ross",
            email: "michelle.ross@example.com",
            headline: "Senior Producer",
            primaryDiscipline: "Production",
            skills: ["Production Management", "Budgeting", "Client Relations", "Agile Workflow"],
            location: "London, UK"
        },
        {
            id: "mock-4",
            firstName: "David",
            lastName: "Okonjo",
            email: "david.okonjo@example.com",
            headline: "Sound Designer",
            primaryDiscipline: "Sound Design",
            skills: ["Sound Design", "Audio Mixing", "Foley", "Composition"],
            location: "Berlin, Germany"
        },
        {
            id: "mock-6",
            firstName: "Marcus",
            lastName: "Thorne",
            email: "marcus.thorne@example.com",
            headline: "Film Editor",
            primaryDiscipline: "Editing",
            skills: ["Video Editing", "Color Grading", "Narrative Structure", "After Effects"],
            location: "Los Angeles, CA"
        },
        {
            id: "mock-7",
            firstName: "Elena",
            lastName: "Rodriguez",
            email: "elena.rodriguez@example.com",
            headline: "Motion Graphics Artist",
            primaryDiscipline: "Motion Graphics",
            skills: ["Motion Graphics", "3D Animation", "Cinema 4D", "Illustration"],
            location: "Remote"
        },
        {
            id: "mock-8",
            firstName: "James",
            lastName: "Miller",
            email: "james.miller@example.com",
            headline: "VFX Supervisor",
            primaryDiscipline: "Visual Effects",
            skills: ["VFX Supervision", "Compositing", "Nuke", "On-set Supervision"],
            location: "Vancouver, BC"
        },
        {
            id: "mock-9",
            firstName: "Priya",
            lastName: "Patel",
            email: "priya.patel@example.com",
            headline: "Product Designer",
            primaryDiscipline: "Product Design",
            skills: ["Product Design", "User Research", "Prototyping", "Design Systems"],
            location: "Austin, TX"
        },
        {
            id: "mock-10",
            firstName: "Sofia",
            lastName: "Wagner",
            email: "sofia.wagner@example.com",
            headline: "Set Designer",
            primaryDiscipline: "Set Design",
            skills: ["Set Design", "Drafting", "Concept Art", "Prop Styling"],
            location: "Vienna, Austria"
        },
        {
            id: "jane-simpson",
            firstName: "Jane",
            lastName: "Simpson",
            email: "jane.simpson@example.com",
            headline: "Director",
            primaryDiscipline: "Directing",
            skills: ["Directing", "Screenwriting", "Visual Storytelling"],
            location: "Los Angeles, CA"
        }
    ];

    // Seed Talents
    for (const t of MOCK_TALENTS) {
        await prisma.user.upsert({
            where: { email: t.email },
            update: {},
            create: {
                id: (t.id && t.id.startsWith('mock-')) ? undefined : t.id, // Only use mapped ID if needed, else auto-gen
                email: t.email,
                passwordHash: password,
                firstName: t.firstName,
                lastName: t.lastName,
                role: 'TALENT',
                status: 'APPROVED',
                profile: {
                    create: {
                        publicSlug: `${t.firstName.toLowerCase()}-${t.lastName.toLowerCase().charAt(0)}`,
                        headline: t.headline,
                        primaryDiscipline: t.primaryDiscipline,
                        skills: t.skills,
                        location: t.location
                    }
                }
            }
        });
        console.log(`Synced talent: ${t.firstName} ${t.lastName}`);
    }

    // Define Teams (referencing emails to connect to created users)
    const MOCK_TEAMS = [
        {
            slug: "motionworks",
            name: "MotionWorks",
            memberEmails: ["sarah.jenkins@example.com", "jane.simpson@example.com", "michelle.ross@example.com"],
            type: "Film Production",
            description: "Film and motion production."
        },
        {
            slug: "blackline-fabrication",
            name: "Blackline Fabrication",
            memberEmails: ["priya.patel@example.com", "sofia.wagner@example.com"],
            type: "Prop Design / Fabrication",
            description: "Prop design, fabrication, and physical builds."
        },
        {
            slug: "environment-studio",
            name: "Environment Studio",
            memberEmails: ["sofia.wagner@example.com", "priya.patel@example.com"],
            type: "Set Design",
            description: "Set design and spatial environments."
        },
        {
            slug: "waveform-studio",
            name: "Waveform Studio",
            memberEmails: ["david.okonjo@example.com"],
            type: "Audio / Score",
            description: "Audio, sound design, and music scoring."
        },
        {
            slug: "visual-effects-studio",
            name: "Visual Effects Studio",
            memberEmails: ["james.miller@example.com", "elena.rodriguez@example.com"],
            type: "VFX / Post",
            description: "High-end visual effects and compositing."
        },
        {
            slug: "continuity",
            name: "Continuity",
            memberEmails: ["marcus.thorne@example.com", "emily.chen@example.com"],
            type: "Post Production",
            description: "Editorial, color grading, and finishing."
        }
    ];

    // Seed Teams
    for (const team of MOCK_TEAMS) {
        // Find users for this team
        const members = await prisma.user.findMany({
            where: { email: { in: team.memberEmails } }
        });

        if (members.length === 0) {
            console.log(`Skipping team ${team.name} - no members found`);
            continue;
        }

        const leaderId = members[0].id;

        // Upsert Team
        const createdTeam = await prisma.team.upsert({
            where: { slug: team.slug },
            update: {
                leaderUserId: leaderId
            },
            create: {
                name: team.name,
                slug: team.slug,
                description: team.description,
                leaderUserId: leaderId,
                members: {
                    create: members.map(m => ({
                        userId: m.id,
                        roleInTeam: m.id === leaderId ? 'LEADER' : 'MEMBER',
                        status: 'ACTIVE'
                    }))
                }
            }
        });
        console.log(`Synced team: ${team.name}`);
    }



    // Categories
    const categories = [
        { name: 'Film Production', desc: 'Full-service video production for commercials, branded content, and narrative films.' },
        { name: 'Visual Print Media', desc: 'Large format physical displays, signage, environmental graphics, and wide format style.' },
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

    // Seed Projects if none exist
    const projectCount = await prisma.project.count();
    if (projectCount === 0) {
        // Get Admin User
        const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        // Get a Category
        const category = await prisma.category.findFirst();
        // Get a Client
        const clientAcme = await prisma.client.findFirst({ where: { companyName: 'Acme Corp' } });

        if (adminUser && category && clientAcme) {
            const projectsData = [
                {
                    title: 'Summer Campaign 2025',
                    status: 'SUBMITTED',
                    clientId: clientAcme.id,
                    categoryId: category.id,
                    createdById: adminUser.id, // Creator
                    budgetRange: '$10k - $25k',
                    brief: 'A high energy summer campaign video.',
                    startDate: new Date(),
                    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
                },
                {
                    title: 'Corporate Rebrand',
                    status: 'APPROVED_FOR_SOW',
                    clientId: clientAcme.id,
                    categoryId: category.id,
                    createdById: adminUser.id,
                    budgetRange: '$25k+',
                    brief: 'Complete overhaul of corporate identity.',
                    startDate: new Date(),
                    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
                },
                {
                    title: 'Social Media Shorts',
                    status: 'SOW_DRAFT',
                    clientId: clientAcme.id,
                    categoryId: category.id,
                    createdById: adminUser.id,
                    budgetRange: '$5k - $10k',
                    brief: 'Series of 15s shorts for Instagram.',
                    startDate: new Date(),
                    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                }
            ];

            for (const p of projectsData) {
                await prisma.project.create({
                    data: {
                        name: p.title,
                        status: p.status as any,
                        clientId: p.clientId,
                        categoryId: p.categoryId,
                        createdById: p.createdById,
                        budgetRange: p.budgetRange,
                        description: p.brief,
                        // timeline: 'Standard (3-4 weeks)',
                    }
                });
            }
        }
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
