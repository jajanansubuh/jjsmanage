import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        users: {
          select: {
            id: true,
            isCredentialsChanged: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
    });
    
    return NextResponse.json(suppliers);
  } catch (error: any) {
    console.error("GET /api/suppliers error:", error);
    // Jika gagal dengan include, coba ambil data dasar saja
    try {
      const basicSuppliers = await prisma.supplier.findMany({
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(basicSuppliers);
    } catch (innerError) {
      return NextResponse.json([], { status: 500 });
    }
  }
}

export async function POST(req: Request) {
  try {
    const { name, ownerName, bankName, accountNumber } = await req.json();
    if (!name) return NextResponse.json({ error: "Nama UMKM is required" }, { status: 400 });

    const supplier = await prisma.supplier.create({
      data: { 
        name, 
        ownerName, 
        bankName,
        accountNumber,
        balance: 0
      },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
