import { AppError } from "../errors";
import type { Invoice, InvoiceStatus, PaymentProvider } from "./provider";

/**
 * Real QPay (merchant API v2) – stub. Fill these in with the credentials from QPay:
 *   1. POST {base}/auth/token        (basic auth QPAY_USERNAME:QPAY_PASSWORD) → access_token
 *   2. POST {base}/invoice           { invoice_code, sender_invoice_no: paymentId, amount, callback_url }
 *                                    → { invoice_id, qr_text, qr_image, urls[] }
 *   3. POST {base}/payment/check     { object_type: "INVOICE", object_id: invoice_id } → rows[].payment_status
 *   4. Callback hits /api/payments/qpay/callback?payment_id=…  – always re-check via step 3, never trust the callback body.
 */
export class QPayProvider implements PaymentProvider {
  readonly name = "qpay";
  private base = "https://merchant.qpay.mn/v2";

  private notReady(): never {
    void this.base;
    throw new AppError("QPAY_NOT_CONFIGURED", "QPay холболт хараахан тохируулагдаагүй байна", 503);
  }

  async createInvoice(): Promise<Invoice> {
    this.notReady();
  }

  async checkInvoice(): Promise<InvoiceStatus> {
    this.notReady();
  }

  async parseCallback(): Promise<{ paymentId: string; status: InvoiceStatus }> {
    this.notReady();
  }
}
