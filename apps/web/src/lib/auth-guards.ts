import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin, isTalent } from "@/lib/rbac";

export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, error: null };
}

export async function requireAdmin() {
  const result = await requireSession();

  if (result.error) {
    return result;
  }

  if (!(await canAccessAdmin(result.session))) {
    return {
      session: result.session,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function requireTalentOrAdmin() {
  const result = await requireSession();

  if (result.error) {
    return result;
  }

  const activeAdministrator = isAdmin(result.session) && (await canAccessAdmin(result.session));

  if (!isTalent(result.session) && !activeAdministrator) {
    return {
      session: result.session,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export async function canAccessAdmin(session: Session | null) {
  if (!isAdmin(session) || !session?.user?.id) {
    return false;
  }

  const administrator = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });

  return administrator?.role === "ADMIN" && administrator.status === "APPROVED";
}
