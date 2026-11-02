import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { setSession } from "@/server/auth";
import { verifyPassword } from "@/server/password";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";

export const POST = route(async (req: Request) => {
  const { phone, password } = await readJson<{ phone?: string; password?: string }>(req);
  const user = await prisma.user.findUnique({ where: { phone: String(phone ?? "") } });
  if (!user || user.role !== "ADMIN" || !user.passwordHash || !verifyPassword(String(password ?? ""), user.passwordHash)) {
    throw new AppError("BAD_CREDENTIALS", "Нэвтрэх мэдээлэл буруу байна", 401);
  }
  await setSession(user.id);
  return NextResponse.json({ ok: true });
});
