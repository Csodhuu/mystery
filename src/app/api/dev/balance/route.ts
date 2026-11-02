import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { requireDemo } from "@/server/dev";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/db";

export const POST = route(async (req: Request) => {
  requireDemo();
  const user = await requireUser();
  const { amount } = await readJson<{ amount?: number }>(req);
  const n = Number(amount);
  if (!Number.isInteger(n) || n <= 0 || n > 100_000_000) throw new AppError("BAD_AMOUNT", "Дүн буруу");
  const [, u] = await prisma.$transaction([
    prisma.payment.create({ data: { userId: user.id, amount: n, provider: "dev-credit", status: "PAID", settledAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { balance: { increment: n } } }),
  ]);
  return NextResponse.json({ balance: u.balance });
});
