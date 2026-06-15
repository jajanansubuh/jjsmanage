import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");

export async function POST() {
  try {
    const session = await getSession();
    if (!session || session.user?.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat sync produk" },
        { status: 403 }
      );
    }

    // Get all unique products from ConsignmentReport items
    const reports = await prisma.consignmentReport.findMany({
      select: { items: true, supplierId: true },
    });

    const productsToSync = new Map<string, { name: string; supplierId: string }>();

    for (const report of reports) {
      if (!Array.isArray(report.items)) continue;
      for (const item of report.items as any[]) {
        if (!item) continue;
        const itemName = String(item.name || "").trim();
        if (!itemName) continue;
        const normalizedName = normalizeProductName(itemName);
        const key = `${normalizedName}|${report.supplierId}`;
        if (!productsToSync.has(key)) {
          productsToSync.set(key, { name: normalizedName, supplierId: report.supplierId });
        }
      }
    }

    // Create missing products in Master
    let syncedCount = 0;
    for (const { name, supplierId } of productsToSync.values()) {
      const exists = await prisma.product.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          supplierId,
        },
      });

      if (!exists) {
        await prisma.product.create({
          data: {
            name,
            supplierId,
          },
        });
        syncedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${syncedCount} produk baru ditambahkan ke Master`,
      totalUniqueProducts: productsToSync.size,
      syncedCount,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Gagal sync produk" },
      { status: 500 }
    );
  }
}
