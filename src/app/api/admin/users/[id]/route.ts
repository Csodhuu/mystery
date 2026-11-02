import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";

/** { delta } – manual balance adjustment, recorded in the payments ledger as provider "admin". */
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { delta } = await readJson<{ delta?: number }>(req);
  const d = Number(delta);
  if (!Number.isInteger(d) || d === 0 || Math.abs(d) > 100_000_000) throw new AppError("BAD_AMOUNT", "Дүн буруу");
  const user = await prisma.$transaction(async (tx) => {
    const res = await tx.user.updateMany({
      where: { id, ...(d < 0 ? { balance: { gte: -d } } : {}) },
      data: { balance: { increment: d } },
    });
    if (res.count === 0) throw new AppError("INSUFFICIENT_BALANCE", "Үлдэгдэл хасагдах хэмжээнээс бага байна", 409);
    await tx.payment.create({ data: { userId: id, amount: d, provider: "admin", status: "PAID", settledAt: new Date() } });
    return tx.user.findUniqueOrThrow({ where: { id } });
  });
  return NextResponse.json({ balance: user.balance });
});
