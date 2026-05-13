import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role,
      supplierId: session.user.supplierId,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
