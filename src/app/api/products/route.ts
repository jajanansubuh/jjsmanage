import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetName = searchParams.get("name");
    let targetSupplierId = searchParams.get("supplierId");
    const forLookup = searchParams.get("forLookup") === "true";

    // Check session for Role Based Access
    const session = await getSession();
    
    // Code lookup mode: return all products with name+code only (no supplier filter)
    // Product codes are catalog identifiers, not sensitive financial data
    if (forLookup) {
      const products = await prisma.product.findMany({
        select: { name: true, code: true, supplierId: true, supplier: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(products);
    }

    // Global name lookup (restricted fields)
    if (targetName) {
      const normalized = targetName.trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");
      const product = await prisma.product.findFirst({
        where: { name: { equals: normalized, mode: "insensitive" } },
        select: { id: true, name: true, code: true }
      });
      return NextResponse.json(product ? [product] : []);
    }

    if (session?.user?.role?.toUpperCase() === "SUPPLIER") {
      targetSupplierId = session.user.supplierId || "INVALID_SUPPLIER_ID";
    }

    const where = targetSupplierId ? { supplierId: targetSupplierId } : {};

    const products = await prisma.product.findMany({
      where,
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Import logic: array of { name, code, supplierId? }
    if (Array.isArray(data)) {
      const results = [];
      const normalize = (val: any) => String(val || "").trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");
      
      try {
        for (const item of data) {
          if (!item.name) continue;

          const name = normalize(item.name);
          const supplierId = item.supplierId || null;

          // Try to find existing product by name and supplierId
          // Using case-insensitive match for robustness
          const existing = await prisma.product.findFirst({
            where: { 
              name: { equals: name, mode: "insensitive" },
              ...(supplierId ? { supplierId } : {})
            }
          });

          if (existing) {
            const product = await prisma.product.update({
              where: { id: existing.id },
              data: { code: (item.code !== undefined && item.code !== null) ? String(item.code) : undefined }
            });
            results.push(product);
          } else {
        const product = await prisma.product.create({
          data: {
            name,
            code: (item.code !== undefined && item.code !== null) ? String(item.code) : undefined,
            supplierId
          }
        });
            results.push(product);
          }
        }
        return NextResponse.json({ message: "Import successful", count: results.length });
      } catch (loopError: any) {
        console.error("Import loop error:", loopError);
        return NextResponse.json({ 
          error: "Gagal memproses baris data: " + loopError.message,
          details: loopError 
        }, { status: 500 });
      }
    }

    // Single create
    const { name, code, supplierId } = data;
    if (!name) return NextResponse.json({ error: "Nama barang wajib diisi" }, { status: 400 });

    const normalizedName = name.trim().toUpperCase().replace(/[.,\s]+$/, "").replace(/\s+/g, " ");

    const product = await prisma.product.create({
      data: {
        name: normalizedName,
        code: (code !== undefined && code !== null) ? String(code) : undefined,
        supplierId: supplierId || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Produk dengan nama dan suplier yang sama sudah ada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan produk" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, code, supplierId } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name?.trim().toUpperCase(),
        code: (code !== undefined && code !== null) ? String(code) : undefined,
        supplierId: supplierId || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
