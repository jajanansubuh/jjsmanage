import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getMaintenanceStatus, updateMaintenanceStatus } from "@/lib/maintenance/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const status = await getMaintenanceStatus(true);
    return NextResponse.json({
      enabled: status.enabled,
      message: status.message,
      estimatedFinish: status.estimatedFinish,
      updatedAt: status.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  try {
    const body = await req.json();
    const { enabled, message, estimatedFinish } = body;

    // Validate estimatedFinish if provided
    let parsedETA: Date | null | undefined = undefined;
    if (estimatedFinish !== undefined) {
      if (estimatedFinish === null || estimatedFinish === "") {
        parsedETA = null;
      } else {
        const d = new Date(estimatedFinish);
        if (isNaN(d.getTime())) {
          return NextResponse.json({ error: "Invalid date format for estimatedFinish" }, { status: 400 });
        }
        parsedETA = d;
      }
    }

    const updated = await updateMaintenanceStatus({
      enabled,
      message,
      estimatedFinish: parsedETA,
      updatedBy: session?.user?.username || "ADMIN",
    });

    return NextResponse.json({
      enabled: updated.enabled,
      message: updated.message,
      estimatedFinish: updated.estimatedFinish,
      updatedAt: updated.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
