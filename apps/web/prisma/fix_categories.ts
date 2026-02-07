import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Find all 'Film Production' categories
    const filmCats = await prisma.category.findMany({
        where: { name: 'Film Production' },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${filmCats.length} 'Film Production' categories.`);

    if (filmCats.length < 2) {
        console.log("Not enough duplicates found to rename one. Checking if 'Visual Print Media' exists...");
        const vpm = await prisma.category.findFirst({ where: { name: 'Visual Print Media' } });
        if (vpm) {
            console.log("Visual Print Media already exists.");
            return;
        }
        console.log("Creating Visual Print Media category...");
        // Fallback: Create it if it doesn't exist and we didn't find a duplicate to rename
        await prisma.category.create({
            data: {
                name: 'Visual Print Media',
                description: 'Large format physical displays, signage, and environmental graphics.',
                questionSets: {
                    create: {
                        version: 1,
                        active: true,
                        questions: {
                            create: [
                                { type: 'SHORT_TEXT', prompt: 'Client Name', required: true, ordering: 1 },
                                { type: 'SHORT_TEXT', prompt: 'Project Name', required: true, ordering: 2 },
                                { type: 'DATE', prompt: 'Target Delivery Date', required: false, ordering: 3 },
                                { type: 'LONG_TEXT', prompt: 'Project Description', required: false, ordering: 4 }
                            ]
                        }
                    }
                }
            }
        });
        return;
    }

    // 2. Rename the second one (or the one created later)
    const catToRename = filmCats[1];
    console.log(`Renaming category with ID ${catToRename.id} to 'Visual Print Media'...`);

    await prisma.category.update({
        where: { id: catToRename.id },
        data: {
            name: 'Visual Print Media',
            description: 'Large format physical displays, signage, and environmental graphics.'
        }
    });

    console.log("Successfully renamed category.");
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
