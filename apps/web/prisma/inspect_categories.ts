import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const cats = await prisma.category.findMany();
    console.log("Categories in DB:");
    cats.forEach(c => {
        console.log(`[${c.name}] - ID: ${c.id}`);
    });
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
