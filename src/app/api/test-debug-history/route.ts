import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const allHistory = await prisma.labelPrintHistory.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      take: 150
    });

    const queueToday = await prisma.labelPrint.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      allHistory,
      queueToday
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
