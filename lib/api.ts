import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAtLeast, type Role } from "@/lib/constants";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Require an authenticated session; returns the session user or a 401 response. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) return { user: null, res: error("Authentication required.", 401) };
  return { user: session.user, res: null };
}

/** Require at least a given role; returns user or an error response. */
export async function requireRole(min: Role) {
  const { user, res } = await requireUser();
  if (res) return { user: null, res };
  if (!hasAtLeast(user!.role, min)) {
    return { user: null, res: error("You don't have permission to do that.", 403) };
  }
  return { user, res: null };
}
