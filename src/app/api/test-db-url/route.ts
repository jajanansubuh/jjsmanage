import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL || "";
  const maskedUrl = url.replace(/:([^:@]+)@/, ":******@");
  return NextResponse.json({ databaseUrl: maskedUrl });
}
