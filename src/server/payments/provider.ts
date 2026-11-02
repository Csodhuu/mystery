export type InvoiceStatus = "PENDING" | "PAID" | "FAILED";

export type Invoice = {
  invoiceId: string;
  /** Text encoded into the QR code */
  qrText: string;
  /** Bank app deep links (QPay returns these) */
  urls: { name: string; link: string }[];
};

export interface PaymentProvider {
  readonly name: string;
  createInvoice(input: { paymentId: string; amount: number; description: string }): Promise<Invoice>;
  checkInvoice(input: { invoiceId: string; createdAt: Date; autoSucceed: boolean }): Promise<InvoiceStatus>;
  /** Validate an incoming provider callback and extract our payment id + status. */
  parseCallback(req: Request): Promise<{ paymentId: string; status: InvoiceStatus }>;
}
