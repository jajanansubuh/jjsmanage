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
    const { username, password } = await req.json();

    // 1. Validate credentials
    const user = await prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 401 });
    }

    const isPasswordValid = await import("bcryptjs").then(bcrypt => bcrypt.compare(password, user.password));
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // 2. Start transaction for safe deletion
    await prisma.$transaction(async (tx) => {
      // Delete all reports related to the supplier first to avoid foreign key constraints
      await tx.consignmentReport.deleteMany({
        where: { supplierId: id },
      });
      
      // Also delete any users associated with this supplier
      await tx.user.deleteMany({
        where: { supplierId: id }
      });

      // Finally delete the supplier
      await tx.supplier.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
