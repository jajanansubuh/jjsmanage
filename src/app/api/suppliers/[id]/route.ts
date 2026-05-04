import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, ownerName, bankName, accountNumber } = await req.json();
    if (!name) return NextResponse.json({ error: "Nama UMKM is required" }, { status: 400 });

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, ownerName, bankName, accountNumber },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Delete all reports related to the supplier first to avoid foreign key constraints
    await prisma.consignmentReport.deleteMany({
      where: { supplierId: id },
    });
    await prisma.supplier.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
