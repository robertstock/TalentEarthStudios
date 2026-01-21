import { type Session } from "next-auth";

export function isAdmin(session: Session | null) {
    return session?.user?.role === "ADMIN";
}

export function isTalent(session: Session | null) {
    return session?.user?.role === "TALENT";
}
