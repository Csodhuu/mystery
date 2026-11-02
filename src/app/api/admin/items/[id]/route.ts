import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { parseItemInput } from "@/server/admin";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await prisma.item.update({ where: { id }, data: parseItemInput(await readJson(req), false) }));
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const item = await prisma.item.findUnique({ where: { id }, include: { _count: { select: { openings: true } } } });
  if (!item) throw new AppError("NOT_FOUND", "Бараа олдсонгүй", 404);
  if (item._count.openings > 0) throw new AppError("IN_USE", "Энэ бараа нээлтийн түүхэнд байгаа тул устгах боломжгүй. Нөөцийг 0 болгоно уу", 409);
  if (item.weight > 0) throw new AppError("IN_TABLE", "Эхлээд магадлалыг 0% болгоод хадгална уу", 409);
  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
