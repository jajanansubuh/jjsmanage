import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import JSZip from "jszip";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "File backup tidak ditemukan" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Temukan file JSON mentah di dalam ZIP (misal: backup-jjs-raw-YYYYMMDD-HHmm.json)
    const jsonFile = Object.keys(zip.files).find(name => name.endsWith(".json") && name.includes("raw"));
    if (!jsonFile) {
      return NextResponse.json({ error: "Arsip ZIP tidak valid atau tidak memiliki file raw dump JSON" }, { status: 400 });
    }

    const jsonContent = await zip.files[jsonFile].async("string");
    const data = JSON.parse(jsonContent);

    const { suppliers, consignmentReports, products, supplierPayouts, cashiers, labelPrints, users } = data;

    if (!suppliers || !consignmentReports || !products || !supplierPayouts || !cashiers || !labelPrints || !users) {
      return NextResponse.json({ error: "Format database JSON tidak lengkap atau tidak valid" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Bersihkan tabel lama dengan urutan dependensi yang benar untuk mencegah foreign key violations
      await tx.labelPrint.deleteMany({});
      await tx.supplierPayout.deleteMany({});
      await tx.consignmentReport.deleteMany({});
      await tx.product.deleteMany({});
      await tx.user.deleteMany({});
      await tx.cashier.deleteMany({});
      await tx.supplier.deleteMany({});

      // 2. Masukkan data baru dengan urutan dependensi yang benar

      // A. Supplier
      if (suppliers.length > 0) {
        await tx.supplier.createMany({
          data: suppliers.map((s: any) => ({
            id: s.id,
            name: s.name,
            accountNumber: s.accountNumber,
            balance: s.balance,
            validatedBalance: s.validatedBalance,
            ownerName: s.ownerName,
            bankName: s.bankName,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }))
        });
      }

      // B. Cashier
      if (cashiers.length > 0) {
        await tx.cashier.createMany({
          data: cashiers.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }))
        });
      }

      // C. User
      if (users.length > 0) {
        await tx.user.createMany({
          data: users.map((u: any) => ({
            id: u.id,
            username: u.username,
            password: u.password,
            name: u.name,
            role: u.role,
            permissions: u.permissions || [],
            supplierId: u.supplierId,
            isCredentialsChanged: u.isCredentialsChanged,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          }))
        });
      }

      // D. Product
      if (products.length > 0) {
        await tx.product.createMany({
          data: products.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            supplierId: p.supplierId,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }))
        });
      }

      // E. ConsignmentReport
      if (consignmentReports.length > 0) {
        await tx.consignmentReport.createMany({
          data: consignmentReports.map((r: any) => ({
            id: r.id,
            date: new Date(r.date),
            supplierId: r.supplierId,
            revenue: r.revenue,
            profit80: r.profit80,
            profit20: r.profit20,
            barcode: r.barcode,
            cost: r.cost,
            kukuluban: r.kukuluban,
            serviceCharge: r.serviceCharge,
            tabungan: r.tabungan,
            noteNumber: r.noteNumber,
            notes: r.notes,
            deductionDate: r.deductionDate ? new Date(r.deductionDate) : null,
            deductionNoteNumber: r.deductionNoteNumber,
            items: r.items || [],
            isValidated: r.isValidated,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          }))
        });
      }

      // F. SupplierPayout
      if (supplierPayouts.length > 0) {
        await tx.supplierPayout.createMany({
          data: supplierPayouts.map((py: any) => ({
            id: py.id,
            amount: py.amount,
            date: new Date(py.date),
            notes: py.notes,
            supplierId: py.supplierId,
            createdAt: new Date(py.createdAt),
            updatedAt: new Date(py.updatedAt),
          }))
        });
      }

      // G. LabelPrint
      if (labelPrints.length > 0) {
        await tx.labelPrint.createMany({
          data: labelPrints.map((l: any) => ({
            id: l.id,
            supplierId: l.supplierId,
            name: l.name,
            code: l.code,
            qty: l.qty,
            status: l.status,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          }))
        });
      }
    });

    return NextResponse.json({ message: "Database berhasil direstore sepenuhnya!" });
  } catch (error) {
    console.error("Database restore error:", error);
    return NextResponse.json(
      { error: "Gagal merestore database", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
