import { PrismaClient, QuestionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Beginning database seed...')

    // 1. Create Demo User
    const user = await prisma.user.upsert({
        where: { email: 'rpm@finley.com' },
        update: {},
        create: {
            email: 'rpm@finley.com',
            name: 'Demo RPM',
            role: 'RPM'
        }
    })

    // 1b. Create Admin User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@finley.com' },
        update: {},
        create: {
            email: 'admin@finley.com',
            name: 'Admin User',
            role: 'ADMIN'
        }
    })

    // 2. Create Demo Client
    const existingClient = await prisma.client.findFirst({ where: { email: 'contact@acme.com' } })
    const client = existingClient || await prisma.client.create({
        data: {
            companyName: 'Acme Corp',
            email: 'contact@acme.com',
        },
    })

    // 2. Create Core Categories
    const catEvent = await prisma.category.create({
        data: {
            name: 'Event Coverage',
            description: 'Photography and video coverage for corporate or social events',
        },
    })

    const catPromo = await prisma.category.create({
        data: {
            name: 'Promotional Video',
            description: 'Marketing video for product or service',
        },
    })

    const catPrint = await prisma.category.create({
        data: {
            name: 'Visual Print Media',
            description: 'Brochures, posters, magazines, and print collateral',
        },
    })

    const catFilm = await prisma.category.create({
        data: {
            name: 'Film | Video',
            description: 'Production, editing, animation, and post-production',
        },
    })

    const catAudio = await prisma.category.create({
        data: {
            name: 'Audio | Score',
            description: 'Music, sound effects, voiceovers, and podcasts',
        },
    })

    const catExperiential = await prisma.category.create({
        data: {
            name: 'Experiential Marketing',
            description: 'Events, activations, exhibitions, and live experiences',
        },
    })

    // 2. Create Question Set for Event Coverage
    const qsEvent = await prisma.questionSet.create({
        data: {
            categoryId: catEvent.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    {
                        ordering: 1,
                        type: QuestionType.SHORT_TEXT,
                        prompt: 'Event Name',
                        required: true,
                    },
                    {
                        ordering: 2,
                        type: QuestionType.DATE,
                        prompt: 'Event Date',
                        required: true,
                    },
                    {
                        ordering: 3,
                        type: QuestionType.SINGLE_SELECT,
                        prompt: 'Event Type',
                        required: true,
                        optionsJson: JSON.stringify(['Corporate', 'Wedding', 'Social', 'Non-profit']),
                    },
                    {
                        ordering: 4,
                        type: QuestionType.LONG_TEXT,
                        prompt: 'Describe the key moments to capture',
                        required: false,
                        helpText: 'Speeches, awards, cake cutting, etc.',
                    },
                ],
            },
        },
    })

    // 3. Create Question Set for Promotional Video
    const qsPromo = await prisma.questionSet.create({
        data: {
            categoryId: catPromo.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    { ordering: 1, type: QuestionType.SHORT_TEXT, prompt: 'Project Name', required: true },
                    { ordering: 2, type: QuestionType.SINGLE_SELECT, prompt: 'Budget Range', required: true, optionsJson: JSON.stringify(['$5k - $10k', '$10k - $25k', '$25k+']) },
                    { ordering: 3, type: QuestionType.SINGLE_SELECT, prompt: 'Timeline', required: true, optionsJson: JSON.stringify(['Rush (<2 weeks)', 'Standard (3-4 weeks)', 'Flexible']) },
                    { ordering: 4, type: QuestionType.DATE, prompt: 'Target Delivery Date', required: true, helpText: 'When do you need the final video?' },
                    { ordering: 5, type: QuestionType.LONG_TEXT, prompt: 'Project Description', required: false, helpText: 'Describe your vision for the video' },
                ],
            },
        },
    })

    // 4. Create Question Set for Visual Print Media
    const qsPrint = await prisma.questionSet.create({
        data: {
            categoryId: catPrint.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    { ordering: 1, type: QuestionType.SHORT_TEXT, prompt: 'Project Name', required: true },
                    { ordering: 2, type: QuestionType.SINGLE_SELECT, prompt: 'Print Type', required: true, optionsJson: JSON.stringify(['Brochure', 'Poster', 'Magazine', 'Flyer', 'Other']) },
                    { ordering: 3, type: QuestionType.DATE, prompt: 'Delivery Deadline', required: true },
                    { ordering: 4, type: QuestionType.LONG_TEXT, prompt: 'Description & Specs', required: true, helpText: 'Size, materials, quantities, etc.' },
                ],
            },
        },
    })

    // 5. Create Question Set for Film | Video
    const qsFilm = await prisma.questionSet.create({
        data: {
            categoryId: catFilm.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    { ordering: 1, type: QuestionType.SHORT_TEXT, prompt: 'Project Name', required: true },
                    { ordering: 2, type: QuestionType.SINGLE_SELECT, prompt: 'Video Style', required: true, optionsJson: JSON.stringify(['Documentary', 'Narrative', 'Animation', 'Commercial']) },
                    { ordering: 3, type: QuestionType.DATE, prompt: 'Target Shoot Date', required: true },
                    { ordering: 4, type: QuestionType.LONG_TEXT, prompt: 'Creative Brief', required: false },
                ],
            },
        },
    })

    // 6. Create Question Set for Audio | Score
    const qsAudio = await prisma.questionSet.create({
        data: {
            categoryId: catAudio.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    { ordering: 1, type: QuestionType.SHORT_TEXT, prompt: 'Project Name', required: true },
                    { ordering: 2, type: QuestionType.SINGLE_SELECT, prompt: 'Audio Type', required: true, optionsJson: JSON.stringify(['Original Score', 'Sound EFX', 'Voiceover', 'Pre-mixed']) },
                    { ordering: 3, type: QuestionType.DATE, prompt: 'Delivery Deadline', required: true },
                    { ordering: 4, type: QuestionType.LONG_TEXT, prompt: 'Mood / Tone', required: true, helpText: 'Describe the emotion or style needed.' },
                ],
            },
        },
    })

    // 7. Create Question Set for Experiential Marketing
    const qsExperiential = await prisma.questionSet.create({
        data: {
            categoryId: catExperiential.id,
            version: 1,
            active: true,
            questions: {
                create: [
                    { ordering: 1, type: QuestionType.SHORT_TEXT, prompt: 'Campaign Name', required: true },
                    { ordering: 2, type: QuestionType.DATE, prompt: 'Event Date', required: true },
                    { ordering: 3, type: QuestionType.SHORT_TEXT, prompt: 'Location', required: true },
                    { ordering: 4, type: QuestionType.LONG_TEXT, prompt: 'Concept Description', required: true, helpText: 'Describe the activation or experience.' },
                ],
            },
        },
    })

    console.log({ catEvent, catPromo, qsEvent, qsPromo })
    console.log('Seeding completed.')
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
