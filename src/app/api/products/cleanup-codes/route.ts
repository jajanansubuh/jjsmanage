import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Memulai pembersihan kode barang via API...");
    
    const products = await prisma.product.findMany({
      where: {
        code: { not: null },
      },
    });

    let updatedCount = 0;
    const updates = [];

    for (const product of products) {
      if (!product.code) continue;

      // Hapus huruf di bagian belakang
      const originalCode = product.code;
      const cleanedCode = originalCode.replace(/[A-Z]+$/i, "");

      if (originalCode !== cleanedCode) {
        updates.push(
          prisma.product.update({
            where: { id: product.id },
            data: { code: cleanedCode },
          })
        );
        updatedCount++;
      }
    }

    // Jalankan semua update
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil membersihkan ${updatedCount} kode barang.`,
      count: updatedCount 
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
