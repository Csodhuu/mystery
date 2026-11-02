import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { paymentProvider, settlePayment } from "@/server/payments";

/** Provider → us. The mock accepts ?payment_id=…&status=PAID|FAILED; the real provider must re-verify. */
export const POST = route(async (req: Request) => {
  const { paymentId, status } = await paymentProvider.parseCallback(req);
  if (status === "PENDING") return NextResponse.json({ ok: true });
  const p = await settlePayment(paymentId, status);
  return NextResponse.json({ ok: true, status: p.status });
});
export const GET = POST;
