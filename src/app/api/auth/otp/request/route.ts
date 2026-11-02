import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requestOtp } from "@/server/sms";
import { DEMO_MODE } from "@/lib/env";

export const POST = route(async (req: Request) => {
  const { phone } = await readJson<{ phone?: string }>(req);
  await requestOtp(String(phone ?? "").trim());
  return NextResponse.json({ ok: true, demoHint: DEMO_MODE ? "Демо горим: код 1234" : null });
});
