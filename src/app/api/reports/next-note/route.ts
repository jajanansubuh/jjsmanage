import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format, startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) return NextResponse.json({ nextNumber: "001" });

    const date = new Date(dateStr);
    const reports = await prisma.consignmentReport.findMany({
      where: {
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
        noteNumber: {
          not: null
        }
      },
      select: { noteNumber: true },
      distinct: ['noteNumber']
    });

    // Format: ddMMyyyyXXX
    const prefix = format(date, "ddMMyyyy");
    let maxSuffix = 0;

    reports.forEach(r => {
      if (r.noteNumber?.startsWith(prefix)) {
        const suffix = parseInt(r.noteNumber.replace(prefix, ""), 10);
        if (!isNaN(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }
    });

    const nextSuffix = (maxSuffix + 1).toString().padStart(3, '0');
    return NextResponse.json({ nextNumber: nextSuffix });
  } catch (error) {
    console.error("Error fetching next note number:", error);
    return NextResponse.json({ nextNumber: "001" });
  }
}
