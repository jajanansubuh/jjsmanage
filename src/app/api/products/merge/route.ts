import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");

/**
 * Merge/consolidate products from one supplier to another
 * POST body:
 * {
 *   "nameToMerge": "COOKIES KNC",      // Product name to consolidate
 *   "fromSupplierId": "KN",             // Supplier to merge FROM (will be deleted)
 *   "toSupplierId": "KNC"               // Supplier to merge TO (destination)
 * }
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user?.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat merge produk" },
        { status: 403 }
      );
    }

    const { nameToMerge, fromSupplierId, toSupplierId } = await req.json();

    if (!nameToMerge || !fromSupplierId || !toSupplierId) {
      return NextResponse.json(
        { error: "nameToMerge, fromSupplierId, dan toSupplierId harus diisi" },
        { status: 400 }
      );
    }

    const normalizedName = normalizeProductName(nameToMerge);

    // Transaction to handle merge atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find products from both suppliers
      const fromProduct = await tx.product.findFirst({
        where: {
          name: { equals: normalizedName, mode: "insensitive" },
          supplierId: fromSupplierId,
        },
      });

      const toProduct = await tx.product.findFirst({
        where: {
          name: { equals: normalizedName, mode: "insensitive" },
          supplierId: toSupplierId,
        },
      });

      if (!fromProduct) {
        return {
          success: false,
          error: `Produk "${nameToMerge}" dengan supplier ${fromSupplierId} tidak ditemukan`,
        };
      }

      if (!toProduct) {
        return {
          success: false,
          error: `Produk "${nameToMerge}" dengan supplier ${toSupplierId} tidak ditemukan`,
        };
      }

      // 2. Find all reports from the "from" supplier
      const reports = await tx.consignmentReport.findMany({
        where: {
          supplierId: fromSupplierId,
        },
        select: { id: true, items: true, supplierId: true },
      });

      // 3. Filter reports that have items matching the product name
      const reportsToUpdate = reports.filter((report) => {
        if (!Array.isArray(report.items)) return false;
        return report.items.some((item: any) => {
          const itemName = String(item.name || "").trim();
          return normalizeProductName(itemName) === normalizedName;
        });
      });

      // 4. Update report items - change item name to normalized form
      let itemsUpdated = 0;
      for (const report of reportsToUpdate) {
        if (!Array.isArray(report.items)) continue;

        const updatedItems = report.items.map((item: any) => {
          const itemName = String(item.name || "").trim();
          if (normalizeProductName(itemName) === normalizedName) {
            itemsUpdated++;
            return { ...item, name: normalizedName };
          }
          return item;
        });

        await tx.consignmentReport.update({
          where: { id: report.id },
          data: { items: updatedItems },
        });
      }

      // 5. Delete the "from" product
      await tx.product.delete({
        where: { id: fromProduct.id },
      });

      return {
        success: true,
        message: `Berhasil merge ${nameToMerge} dari supplier ${fromSupplierId} ke ${toSupplierId}`,
        details: {
          productName: normalizedName,
          fromSupplierId,
          toSupplierId,
          itemsUpdated,
          reportsModified: reports.length,
        },
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("POST /api/products/merge error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Gagal merge produk",
        details: message,
      },
      { status: 500 }
    );
  }
}
