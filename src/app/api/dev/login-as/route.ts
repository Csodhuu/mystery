import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireDemo } from "@/server/dev";
import { setSession } from "@/server/auth";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/db";

export const POST = route(async (req: Request) => {
  requireDemo();
  const { userId } = await readJson<{ userId?: string }>(req);
  const u = await prisma.user.findUnique({ where: { id: String(userId ?? "") } });
  if (!u || !u.isDemo) throw new AppError("NOT_FOUND", "Demo хэрэглэгч олдсонгүй", 404);
  await setSession(u.id);
  return NextResponse.json({ ok: true });
});
