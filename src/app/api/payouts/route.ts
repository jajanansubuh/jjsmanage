import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let supplierId = searchParams.get("supplierId");

    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();

    if (session?.user?.role === "SUPPLIER") {
      supplierId = session.user.supplierId;
    }

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
    }

    const payouts = await prisma.supplierPayout.findMany({
      where: { supplierId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(payouts);
  } catch (error) {
    console.error("GET /api/payouts error:", error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { supplierId, amount, notes, date } = await request.json();

    if (!supplierId || !amount) {
      return NextResponse.json({ error: "Supplier ID and amount are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payout record
      const payout = await tx.supplierPayout.create({
        data: {
          supplierId,
          amount: parseFloat(amount),
          notes,
          date: date ? new Date(date) : new Date(),
        },
      });

      // 2. Decrease supplier balance
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          balance: { decrement: parseFloat(amount) },
        },
      });

      return payout;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/payouts error:", error);
    return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
  }
}
