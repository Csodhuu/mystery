import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireDemo } from "@/server/dev";
import { requireUser } from "@/server/auth";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/db";
import { createTopUp, settlePayment } from "@/server/payments";

/** { action: "create", amount } – pending invoice without auto-success
 *  { action: "PAID" | "FAILED", paymentId } – simulate the QPay callback */
export const POST = route(async (req: Request) => {
  requireDemo();
  const user = await requireUser();
  const body = await readJson<{ action?: string; amount?: number; paymentId?: string }>(req);
  if (body.action === "create") return NextResponse.json(await createTopUp(user.id, Number(body.amount ?? 50_000), { autoSucceed: false }));
  if (body.action !== "PAID" && body.action !== "FAILED") throw new AppError("BAD_ACTION", "Үйлдэл буруу");
  const p = await prisma.payment.findFirst({ where: { id: String(body.paymentId ?? ""), userId: user.id } });
  if (!p) throw new AppError("NOT_FOUND", "Төлбөр олдсонгүй", 404);
  const settled = await settlePayment(p.id, body.action);
  const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  return NextResponse.json({ status: settled.status, balance: u.balance });
});
