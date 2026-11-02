import QRCode from "qrcode";
import { prisma } from "../db";
import { AppError } from "../errors";
import { DEMO_MODE } from "../../lib/env";
import { MockQPayProvider, MOCK_AUTO_SUCCESS_MS } from "./mock";
import { QPayProvider } from "./qpay";
import type { PaymentProvider } from "./provider";

export const paymentProvider: PaymentProvider = DEMO_MODE ? new MockQPayProvider() : new QPayProvider();

export const MIN_TOPUP = 1_000;
export const MAX_TOPUP = 5_000_000;

export async function createTopUp(userId: string, amount: number, opts: { autoSucceed?: boolean } = {}) {
  if (!Number.isInteger(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    throw new AppError("BAD_AMOUNT", `Дүн ${MIN_TOPUP.toLocaleString()}₮ - ${MAX_TOPUP.toLocaleString()}₮ хооронд байна`);
  }
  const autoSucceed = opts.autoSucceed ?? true;
  const payment = await prisma.payment.create({
    data: { userId, amount, provider: paymentProvider.name, autoSucceed },
  });
  const invoice = await paymentProvider.createInvoice({ paymentId: payment.id, amount, description: "Хэтэвч цэнэглэх" });
  await prisma.payment.update({ where: { id: payment.id }, data: { invoiceId: invoice.invoiceId, qrText: invoice.qrText } });

  if (DEMO_MODE && autoSucceed) {
    setTimeout(() => void settlePayment(payment.id, "PAID").catch(console.error), MOCK_AUTO_SUCCESS_MS);
  }

  return {
    id: payment.id,
    amount,
    invoiceId: invoice.invoiceId,
    qrImage: await QRCode.toDataURL(invoice.qrText, { margin: 1, width: 280, color: { dark: "#0b0d14", light: "#ffffff" } }),
    urls: invoice.urls,
    autoSucceed,
    autoSucceedMs: DEMO_MODE && autoSucceed ? MOCK_AUTO_SUCCESS_MS : null,
  };
}

/** Idempotent: only a PENDING payment can transition; balance is credited exactly once. */
export async function settlePayment(paymentId: string, status: "PAID" | "FAILED") {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!p) throw new AppError("NOT_FOUND", "Төлбөр олдсонгүй", 404);
    const changed = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status, settledAt: new Date() },
    });
    if (changed.count === 1 && status === "PAID") {
      await tx.user.update({ where: { id: p.userId }, data: { balance: { increment: p.amount } } });
    }
    return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
  });
}

export async function paymentStatus(userId: string, paymentId: string) {
  let p = await prisma.payment.findFirst({ where: { id: paymentId, userId } });
  if (!p) throw new AppError("NOT_FOUND", "Төлбөр олдсонгүй", 404);
  if (p.status === "PENDING" && p.invoiceId) {
    const s = await paymentProvider.checkInvoice({ invoiceId: p.invoiceId, createdAt: p.createdAt, autoSucceed: p.autoSucceed });
    if (s !== "PENDING") p = await settlePayment(p.id, s);
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true } });
  return { id: p.id, status: p.status, amount: p.amount, balance: user.balance };
}
