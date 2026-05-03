import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE all reports by noteNumber
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const noteNumber = searchParams.get("noteNumber");

    if (!noteNumber) {
      return NextResponse.json({ error: "noteNumber is required" }, { status: 400 });
    }

    // Get existing reports to reverse supplier balance
    const existingReports = await prisma.consignmentReport.findMany({
      where: { noteNumber },
    });

    if (existingReports.length === 0) {
      return NextResponse.json({ error: "No reports found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Reverse supplier balances
      for (const report of existingReports) {
        await tx.supplier.update({
          where: { id: report.supplierId },
          data: { balance: { decrement: report.profit80 } },
        });
      }

      // Delete all reports with this noteNumber
      await tx.consignmentReport.deleteMany({
        where: { noteNumber },
      });
    });

    return NextResponse.json({ success: true, deleted: existingReports.length });
  } catch (error) {
    console.error("DELETE /api/reports/by-note error:", error);
    return NextResponse.json(
      { error: "Failed to delete reports", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
