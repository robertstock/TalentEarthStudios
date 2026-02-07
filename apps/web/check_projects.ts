
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const projectCount = await prisma.project.count()
        console.log(`Project count: ${projectCount}`)

        if (projectCount > 0) {
            const projects = await prisma.project.findMany({
                take: 2,
                include: { client: true }
            })
            console.log('Sample projects:', JSON.stringify(projects, null, 2))
        }
    } catch (error) {
        console.error('Error connecting to DB:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
