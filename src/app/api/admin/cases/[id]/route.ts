import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { parseCaseInput } from "@/server/admin";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await prisma.case.update({ where: { id }, data: parseCaseInput(await readJson(req), false) }));
});

/** Cases with history are deactivated instead of deleted, so openings stay verifiable. */
export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const used = await prisma.opening.count({ where: { caseId: id } });
  if (used > 0) {
    await prisma.case.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.case.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
});
