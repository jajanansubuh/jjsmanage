"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");

export async function mergeProductsAction(data: {
  nameToMerge: string;
  fromSupplierId: string;
  toSupplierId: string;
}) {
  try {
    const { nameToMerge, fromSupplierId, toSupplierId } = data;

    if (!nameToMerge || !fromSupplierId || !toSupplierId) {
      return {
        error: "nameToMerge, fromSupplierId, dan toSupplierId harus diisi",
      };
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
        where: { supplierId: fromSupplierId },
        select: { id: true, items: true },
      });

      // 3. Filter reports that have items matching the product name
      const reportsToUpdate = reports.filter((report) => {
        if (!Array.isArray(report.items)) return false;
        return report.items.some((item: any) => {
          const itemName = String(item.name || "").trim();
          return normalizeProductName(itemName) === normalizedName;
        });
      });

      // 4. Update report items - consolidate product name references
      let itemsUpdated = 0;
      for (const report of reportsToUpdate) {
        if (!Array.isArray(report.items)) continue;

        const updatedItems = report.items.map((item: any) => {
          const itemName = String(item.name || "").trim();
          // Check if this item matches the product to merge
          if (normalizeProductName(itemName) === normalizedName) {
            itemsUpdated++;
            // Update to use normalized name (for consistency)
            return { ...item, name: normalizedName };
          }
          return item;
        });

        if (itemsUpdated > 0) {
          await tx.consignmentReport.update({
            where: { id: report.id },
            data: { items: updatedItems },
          });
        }
      }

      // 5. Delete the "from" product (duplicate/redundant supplier variant)
      await tx.product.delete({
        where: { id: fromProduct.id },
      });

      return {
        success: true,
        message: `Berhasil merge ${normalizedName} dari supplier ${fromSupplierId} ke ${toSupplierId}`,
        details: {
          productName: normalizedName,
          fromSupplierId,
          toSupplierId,
          itemsUpdated,
          reportsModified: reports.length,
        },
      };
    });

    if (result.success) {
      revalidatePath("/(dashboard)/produk");
      revalidatePath("/(dashboard)/reports");
      revalidatePath("/");
    }

    return result;
  } catch (error) {
    console.error("mergeProductsAction error:", error);
    return {
      error: "Gagal merge produk",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function syncProductsFromReportsAction() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products/sync-from-reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return {
        success: false,
        error: errorData.error || "Gagal sync produk",
      };
    }

    const data = await res.json();
    
    if (data.success) {
      revalidatePath("/(dashboard)/produk");
      revalidatePath("/(dashboard)/reports");
      revalidatePath("/");
    }

    return data;
  } catch (error) {
    console.error("syncProductsFromReportsAction error:", error);
    return {
      success: false,
      error: "Gagal sync produk",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
