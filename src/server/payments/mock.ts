import { randomBytes } from "node:crypto";
import type { Invoice, InvoiceStatus, PaymentProvider } from "./provider";

export const MOCK_AUTO_SUCCESS_MS = 3_000;

/** Fake QPay: shows a QR, auto-pays after 3 seconds, callbacks can be simulated from the dev panel. */
export class MockQPayProvider implements PaymentProvider {
  readonly name = "qpay-mock";

  async createInvoice({ paymentId, amount }: { paymentId: string; amount: number }): Promise<Invoice> {
    const invoiceId = `MOCK-${randomBytes(6).toString("hex").toUpperCase()}`;
    return {
      invoiceId,
      qrText: `DEMO-QPAY|${invoiceId}|${paymentId}|${amount}MNT`,
      urls: ["Хаан банк", "Голомт банк", "ХасБанк", "ТДБ", "Төрийн банк"].map((name) => ({ name, link: "#demo" })),
    };
  }

  async checkInvoice({ createdAt, autoSucceed }: { createdAt: Date; autoSucceed: boolean }): Promise<InvoiceStatus> {
    return autoSucceed && Date.now() - createdAt.getTime() >= MOCK_AUTO_SUCCESS_MS ? "PAID" : "PENDING";
  }

  async parseCallback(req: Request) {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get("payment_id") ?? "";
    const status = url.searchParams.get("status") === "FAILED" ? "FAILED" : "PAID";
    return { paymentId, status } as const;
  }
}
