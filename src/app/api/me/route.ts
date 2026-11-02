import { NextResponse } from "next/server";
import { getUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getUser();
  return NextResponse.json(u ? { id: u.id, name: u.name, phone: u.phone, balance: u.balance, role: u.role } : null);
}
