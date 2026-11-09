import { NextResponse } from "next/server";
import { getScheduleStatus, upcomingDeliveryDays } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getScheduleStatus();
  return NextResponse.json({ ...status, upcomingDays: upcomingDeliveryDays() });
}
