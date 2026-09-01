import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import SecurityForm from "./SecurityForm";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin?callbackUrl=/app/security");
    }

    return (
        <main className="container mx-auto min-h-screen max-w-2xl px-6 pb-16 pt-32 text-white">
            <Link href={session.user.role === "ADMIN" ? "/admin" : "/app"} className="text-sm text-gray-400 transition hover:text-white">
                &larr; Back to Dashboard
            </Link>
            <div className="mt-7">
                <h1 className="text-3xl font-bold">Account Security</h1>
                <p className="mt-2 text-sm text-gray-400">Change the password for {session.user.email}.</p>
            </div>
            <SecurityForm />
        </main>
    );
}
