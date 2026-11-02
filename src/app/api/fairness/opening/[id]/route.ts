import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";

export const dynamic = "force-dynamic";

/** Public: everything needed to verify one opening. The server seed is included only once it has been revealed. */
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const o = await prisma.opening.findUnique({ where: { id }, include: { serverSeed: true, item: true, case: { select: { name: true } } } });
  if (!o) throw new AppError("NOT_FOUND", "Нээлт олдсонгүй", 404);
  return NextResponse.json({
    id: o.id,
    caseName: o.case.name,
    createdAt: o.createdAt,
    serverSeedHash: o.serverSeed.hash,
    serverSeed: o.serverSeed.active ? null : o.serverSeed.seed,
    clientSeed: o.clientSeed,
    nonce: o.nonce,
    roll: o.roll,
    item: { id: o.item.id, name: o.item.name },
    table: o.table,
  });
});
