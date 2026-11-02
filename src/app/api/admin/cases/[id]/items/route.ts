import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { parseItemInput } from "@/server/admin";

/** New items start at 0% so the case's table stays valid; set odds in the probability editor. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const data = parseItemInput(await readJson(req), true);
  const max = await prisma.item.aggregate({ where: { caseId: id }, _max: { sortOrder: true } });
  const item = await prisma.item.create({
    data: { ...(data as { name: string; value: number; rarity: "COMMON"; stock: number; image: string }), caseId: id, weight: 0, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  return NextResponse.json(item);
});
