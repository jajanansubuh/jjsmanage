import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cashiers = await prisma.cashier.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(cashiers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cashiers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, code } = await req.json();
    if (!name || !code) return NextResponse.json({ error: "Name and code are required" }, { status: 400 });

    const cashier = await prisma.cashier.create({
      data: { name, code },
    });
    return NextResponse.json(cashier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create cashier" }, { status: 500 });
  }
}
