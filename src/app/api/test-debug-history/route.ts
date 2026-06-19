import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ":******@");
    
    const allQueue = await prisma.labelPrint.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    
    const allHistory = await prisma.labelPrintHistory.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { completedAt: "desc" }
    });

    const suppliers = await prisma.supplier.findMany({
      select: { id: true, name: true }
    });

    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, supplierId: true }
    });

    return NextResponse.json({ 
      databaseUrl: maskedDbUrl,
      allQueue, 
      allHistory,
      suppliers,
      users
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
