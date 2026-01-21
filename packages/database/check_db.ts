import { db } from './index'

async function main() {
    const categories = await db.category.findMany()
    console.log('Categories:', JSON.stringify(categories, null, 2))

    const clients = await db.client.findMany()
    console.log('Clients:', JSON.stringify(clients, null, 2))

    const users = await db.user.findMany()
    console.log('Users:', JSON.stringify(users, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
