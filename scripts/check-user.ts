
import { db } from "../src/lib/db";

async function main() {
    const email = "robert@talentearth.com";
    const user = await db.user.findUnique({
        where: { email },
    });
    console.log("User found:", user);
}

main().catch(console.error);
