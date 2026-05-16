import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    
    const where: { status: string; supplierId?: string } = { status };
    
    if (session.user.role === "SUPPLIER") {
      where.supplierId = session.user.supplierId || "INVALID";
    }

    const items = await prisma.labelPrint.findMany({
      where,
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error("GET /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to fetch print queue" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await req.json(); // Array of { name, code, qty, supplierId? }
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const supplierId = session.user.supplierId;
    
    // Use transaction to save all items
    const result = await prisma.$transaction(
      items.map((item: { name: string; code?: string; qty: number; supplierId?: string }) => {
        const finalSupplierId = supplierId || item.supplierId;
        if (!finalSupplierId) {
          throw new Error(`Produk "${item.name}" tidak memiliki data suplier.`);
        }
        return prisma.labelPrint.create({
          data: {
            name: item.name,
            code: item.code || null,
            qty: item.qty || 1,
            supplierId: finalSupplierId,
          }
        });
      })
    );

    return NextResponse.json({ message: "Saved to queue", count: result.length });
  } catch (error: any) {
    console.error("POST /api/print-queue error:", error);
    return NextResponse.json({ 
      error: "Gagal menyimpan antrean", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, qty } = await req.json();
    
    const updated = await prisma.labelPrint.update({
      where: { id },
      data: { 
        ...(status && { status }),
        ...(qty !== undefined && { qty: parseInt(qty) })
      }
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { getSession } = await import("@/lib/auth-utils");
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, all } = await req.json();
    
    if (all) {
      const where: { status: string; supplierId?: string } = { status: "PENDING" };
      if (session.user.role === "SUPPLIER") {
        where.supplierId = session.user.supplierId || "INVALID";
      }
      await prisma.labelPrint.deleteMany({ where });
    } else {
      await prisma.labelPrint.delete({ where: { id } });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/print-queue error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
