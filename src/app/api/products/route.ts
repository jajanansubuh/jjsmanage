import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";
import { requireAdmin } from "@/lib/api-auth";

const normalizeProductName = (val: string | null | undefined) =>
  String(val || "")
    .trim()
    .toUpperCase()
    .replace(/[.,\s]+$/, "")
    .replace(/\s+/g, " ");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetName = searchParams.get("name");
    let targetSupplierId = searchParams.get("supplierId");
    const forLookup = searchParams.get("forLookup") === "true";

    // Check session for Role Based Access
    const session = await getSession();
    const isSupplier = session?.user?.role?.toUpperCase() === "SUPPLIER";
    
    if (forLookup) {
      const where = isSupplier
        ? { supplierId: session.user.supplierId || "INVALID_SUPPLIER_ID" }
        : {};
      const products = await prisma.product.findMany({
        where,
        select: { id: true, name: true, code: true, supplierId: true, supplier: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(products);
    }

    // Global name lookup (restricted fields)
    if (targetName) {
      const normalized = targetName.trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");
      const product = await prisma.product.findFirst({
        where: {
          name: { equals: normalized, mode: "insensitive" },
          ...(isSupplier ? { supplierId: session.user.supplierId || "INVALID_SUPPLIER_ID" } : {}),
        },
        select: { id: true, name: true, code: true }
      });
      return NextResponse.json(product ? [product] : []);
    }

    if (isSupplier) {
      targetSupplierId = session.user.supplierId || "INVALID_SUPPLIER_ID";
    }

    const where = targetSupplierId ? { supplierId: targetSupplierId } : {};

    const products = await prisma.product.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error: unknown) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

type ProductImportItem = {
  name?: string;
  code?: string | null;
  supplierId?: string | null;
};

type ProductCreateBody = {
  name?: string;
  code?: string | null;
  supplierId?: string | null;
};

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const payload = await req.json();

    // Import logic: array of { name, code, supplierId? }
    if (Array.isArray(payload)) {
      const results: Array<Awaited<ReturnType<typeof prisma.product.create>> | Awaited<ReturnType<typeof prisma.product.update>>> = [];
      const normalize = (val: string | null | undefined) => String(val || "").trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");

      try {
        for (const item of payload as ProductImportItem[]) {
          if (!item.name) continue;

          const name = normalize(item.name);
          const supplierId = item.supplierId || null;

          const existing = await prisma.product.findFirst({
            where: {
              name: { equals: name, mode: "insensitive" },
              supplierId,
            },
          });

          if (existing) {
            const product = await prisma.product.update({
              where: { id: existing.id },
              data: { code: item.code != null ? String(item.code) : undefined },
            });
            results.push(product);
          } else {
            const product = await prisma.product.create({
              data: {
                name,
                code: item.code != null ? String(item.code) : undefined,
                supplierId,
              },
            });
            results.push(product);
          }
        }

        return NextResponse.json({ message: "Import successful", count: results.length });
      } catch (loopError: unknown) {
        console.error("Import loop error:", loopError);
        const message = loopError instanceof Error ? loopError.message : String(loopError);
        return NextResponse.json({
          error: "Gagal memproses baris data: " + message,
          details: message,
        }, { status: 500 });
      }
    }

    const { name, code, supplierId } = payload as ProductCreateBody;
    if (!name) return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 });

    const normalizedName = name.trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");

    const product = await prisma.product.create({
      data: {
        name: normalizedName,
        code: code != null ? String(code) : undefined,
        supplierId: supplierId || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Produk dengan nama dan supplier yang sama sudah ada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan produk" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { id, name, code, supplierId } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { name: true, supplierId: true }
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const normalizedOldName = normalizeProductName(existingProduct.name);
    const normalizedName = name ? normalizeProductName(name) : undefined;

    // Prevent duplicate (name + supplierId) — check for existing product with same name and supplier
    if (normalizedName) {
      const conflict = await prisma.product.findFirst({
        where: {
          name: { equals: normalizedName, mode: "insensitive" },
          supplierId: supplierId || null,
          id: { not: id },
        }
      });

      if (conflict) {
        return NextResponse.json({ error: "Produk dengan nama dan supplier yang sama sudah ada" }, { status: 409 });
      }
    }

    // If product name changes, also update report items for the same supplier
    if (normalizedName && normalizedName !== normalizedOldName) {
      const reportSupplierId = existingProduct.supplierId;
      if (reportSupplierId) {
        // Pre-filter reports that contain the product name (case-insensitive text search)
        const nameSearchPattern = `%${normalizedOldName.toLowerCase()}%`;
        const reports = await prisma.$queryRaw<any[]>`
          SELECT id, items 
          FROM "ConsignmentReport"
          WHERE "supplierId" = ${reportSupplierId}
            AND LOWER("items"::text) LIKE ${nameSearchPattern}
        `;

        if (reports.length > 0) {
          const updates: Prisma.Prisma__ConsignmentReportClient<any, any>[] = [];
          
          for (const report of reports) {
            const items = Array.isArray(report.items) ? report.items : [];
            let updated = false;

            const normalizedItems = items.map((item: any) => {
              const itemName = String(item.name || "");
              if (normalizeProductName(itemName) === normalizedOldName) {
                updated = true;
                return { ...item, name: normalizedName };
              }
              return item;
            });

            if (updated) {
              updates.push(
                prisma.consignmentReport.update({
                  where: { id: report.id },
                  data: { items: normalizedItems }
                })
              );
            }
          }

          if (updates.length > 0) {
            // Execute all updates in a single database transaction
            await prisma.$transaction(updates);
          }
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: normalizedName,
        code: (code !== undefined && code !== null) ? String(code) : undefined,
        supplierId: supplierId || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });

    return NextResponse.json(product);
  } catch (error: unknown) {
    console.error("PUT /api/products error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Produk dengan nama dan supplier yang sama sudah ada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error: unknown) {
    console.error("DELETE /api/products error:", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
