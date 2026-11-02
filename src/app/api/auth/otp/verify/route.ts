import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { verifyOtp } from "@/server/sms";
import { setSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { createSeedPair } from "@/server/seeds";
import { DEMO_MODE } from "@/lib/env";

export const POST = route(async (req: Request) => {
  const body = await readJson<{ phone?: string; code?: string; name?: string; ageConfirmed?: boolean }>(req);
  const phone = String(body.phone ?? "").trim();
  await verifyOtp(phone, String(body.code ?? "").trim());

  let user = await prisma.user.findUnique({ where: { phone } });
  if (user?.isDemo && !DEMO_MODE) throw new AppError("DISABLED", "Тест дугаар идэвхгүй байна", 403);
  if (!user) {
    if (!body.ageConfirmed) throw new AppError("AGE", "18 нас хүрсэн байх шаардлагатай", 403);
    const name = String(body.name ?? "").trim().slice(0, 40) || `Тоглогч ${phone.slice(-4)}`;
    user = await prisma.user.create({ data: { phone, name, ageConfirmedAt: new Date() } });
    await createSeedPair(prisma, user.id);
  }
  await setSession(user.id);
  return NextResponse.json({ ok: true });
});
