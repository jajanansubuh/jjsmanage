import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\-\s]+$/, "")
    .replace(/\s+/g, " ");

/**
 * Merge/consolidate products
 * POST body:
 * {
 *   "sourceProductId": "prod_123",    // Source product ID (will be merged & deleted)
 *   "targetProductId": "prod_456"     // Destination product ID (will be kept)
 * }
 * OR (legacy)
 * {
 *   "nameToMerge": "COOKIES KNC",
 *   "fromSupplierId": "KN",
 *   "toSupplierId": "KNC"
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

    const body = await req.json();
    const { sourceProductId, targetProductId, nameToMerge, fromSupplierId, toSupplierId } = body;

    // Transaction to handle merge atomically
    const result = await prisma.$transaction(async (tx) => {
      let sourceProduct: any = null;
      let targetProduct: any = null;

      if (sourceProductId && targetProductId) {
        sourceProduct = await tx.product.findUnique({
          where: { id: sourceProductId },
          include: { supplier: true },
        });
        targetProduct = await tx.product.findUnique({
          where: { id: targetProductId },
          include: { supplier: true },
        });
      } else if (nameToMerge && fromSupplierId && toSupplierId) {
        const normalizedName = normalizeProductName(nameToMerge);
        sourceProduct = await tx.product.findFirst({
          where: {
            name: { equals: normalizedName, mode: "insensitive" },
            supplierId: fromSupplierId,
          },
          include: { supplier: true },
        });
        targetProduct = await tx.product.findFirst({
          where: {
            name: { equals: normalizedName, mode: "insensitive" },
            supplierId: toSupplierId,
          },
          include: { supplier: true },
        });
      }

      if (!sourceProduct) {
        return {
          success: false,
          error: "Produk asal (yang akan digabungkan) tidak ditemukan",
        };
      }

      if (!targetProduct) {
        return {
          success: false,
          error: "Produk tujuan tidak ditemukan",
        };
      }

      if (sourceProduct.id === targetProduct.id) {
        return {
          success: false,
          error: "Produk asal dan produk tujuan tidak boleh produk yang sama",
        };
      }

      const normalizedSource = normalizeProductName(sourceProduct.name);
      const targetName = targetProduct.name;

      // 1. Update ConsignmentReport items
      const reports = await tx.consignmentReport.findMany({
        where: sourceProduct.supplierId
          ? { supplierId: sourceProduct.supplierId }
          : {},
        select: { id: true, items: true },
      });

      let itemsUpdated = 0;
      for (const report of reports) {
        if (!Array.isArray(report.items)) continue;
        let modified = false;

        const updatedItems = report.items.map((item: any) => {
          const itemName = String(item.name || "").trim();
          if (normalizeProductName(itemName) === normalizedSource) {
            itemsUpdated++;
            modified = true;
            return { ...item, name: targetName };
          }
          return item;
        });

        if (modified) {
          await tx.consignmentReport.update({
            where: { id: report.id },
            data: { items: updatedItems },
          });
        }
      }

      // 2. Update LabelPrint queue if any
      if (sourceProduct.supplierId) {
        await tx.labelPrint.updateMany({
          where: {
            supplierId: sourceProduct.supplierId,
            name: { equals: sourceProduct.name, mode: "insensitive" },
          },
          data: {
            name: targetName,
            supplierId: targetProduct.supplierId || sourceProduct.supplierId,
          },
        });
      }

      // 3. Preserve code if target product lacks one
      if (!targetProduct.code && sourceProduct.code) {
        await tx.product.update({
          where: { id: targetProduct.id },
          data: { code: sourceProduct.code },
        });
      }

      // 4. Delete source product
      await tx.product.delete({
        where: { id: sourceProduct.id },
      });

      return {
        success: true,
        message: `Berhasil menggabungkan produk "${sourceProduct.name}" ke "${targetProduct.name}"`,
        details: {
          sourceProduct: sourceProduct.name,
          targetProduct: targetProduct.name,
          itemsUpdated,
        },
      };
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

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

