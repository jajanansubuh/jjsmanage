import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        // @ts-ignore
        supplierId: true,
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
