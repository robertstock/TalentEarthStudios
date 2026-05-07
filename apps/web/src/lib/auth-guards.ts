import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

import { authOptions } from "@/lib/auth";
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

  if (!isAdmin(result.session)) {
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

  if (!isTalent(result.session) && !isAdmin(result.session)) {
    return {
      session: result.session,
      error: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}

export function canAccessAdmin(session: Session | null) {
  return isAdmin(session);
}
