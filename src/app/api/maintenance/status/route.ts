import { NextResponse } from "next/server";
import { getMaintenanceStatus } from "@/lib/maintenance/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getMaintenanceStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { enabled: false, message: "System is under maintenance. (Error loading status)", estimatedFinish: null },
      { status: 500 }
    );
  }
}
