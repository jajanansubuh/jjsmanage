import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export async function requireAdmin() {
  const session = await getSession();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN") {
    return {
      session,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}
