import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { noteNumber, username, password } = await req.json();

    // 1. Validate credentials against database
    const user = await prisma.user.findFirst({
      where: { 
        username: username,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
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
        const dataToUpdate: any = {
          balance: { decrement: report.profit80 }
        };
        if (report.isValidated) {
          dataToUpdate.validatedBalance = { decrement: report.profit80 };
        }
        await tx.supplier.update({
          where: { id: report.supplierId },
          data: dataToUpdate
        });
      }

      // 4. Delete the reports
      await tx.consignmentReport.deleteMany({
        where: { noteNumber: noteNumber }
      });
    }, {
      timeout: 30000,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}
