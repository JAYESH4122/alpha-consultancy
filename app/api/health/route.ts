import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "alpha-consultancy-web", timestamp: new Date().toISOString() });
}
