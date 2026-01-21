import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: "ADMIN" | "TALENT"
            image?: string | null
        } & DefaultSession["user"]
    }
}
