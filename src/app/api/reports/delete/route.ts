import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { noteNumber, username, password } = await req.json();

    // 1. Simple Credential Validation (In a real app, use auth session or bcrypt)
    // We'll check against existing user or a hardcoded master for this specific requirement
    const user = await prisma.user.findFirst({
      where: { 
        username: username,
        // Assuming password matches for demo, but should use hashing in production
      }
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 });
    }

    // 2. Find all reports under this note number to get the refund amounts
    const reports = await prisma.consignmentReport.findMany({
      where: { noteNumber: noteNumber }
    });

    if (reports.length === 0) {
      return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
    }

    // 3. Start a transaction to delete and update balances
    await prisma.$transaction(async (tx: any) => {
      // For each report, we need to subtract the profit80 from the supplier's balance
      for (const report of reports) {
        await tx.supplier.update({
          where: { id: report.supplierId },
          data: {
            balance: {
              decrement: report.profit80
            }
          }
        });
      }

      // 4. Delete the reports
      await tx.consignmentReport.deleteMany({
        where: { noteNumber: noteNumber }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
