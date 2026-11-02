import { prisma } from "./db";
import { AppError } from "./errors";
import { DEMO_MODE } from "../lib/env";
import { UB_DISTRICTS } from "../lib/format";
import { PHONE_RE } from "./sms";

export type DeliveryForm = { fullName: string; phone: string; district: string; khoroo: string; address: string };

export function validateDeliveryForm(f: Partial<DeliveryForm>): DeliveryForm {
  const fullName = String(f.fullName ?? "").trim();
  const phone = String(f.phone ?? "").trim();
  const district = String(f.district ?? "").trim();
  const khoroo = String(f.khoroo ?? "").trim();
  const address = String(f.address ?? "").trim();
  if (fullName.length < 2 || fullName.length > 80) throw new AppError("BAD_FORM", "Нэрээ зөв оруулна уу");
  if (!PHONE_RE.test(phone)) throw new AppError("BAD_FORM", "Утасны дугаар 8 оронтой байна");
  if (!UB_DISTRICTS.includes(district)) throw new AppError("BAD_FORM", "Дүүргээ сонгоно уу");
  if (!/^\d{1,2}$/.test(khoroo)) throw new AppError("BAD_FORM", "Хороо (тоо) оруулна уу");
  if (address.length < 5 || address.length > 300) throw new AppError("BAD_FORM", "Хаягаа дэлгэрэнгүй оруулна уу");
  return { fullName, phone, district, khoroo, address };
}

export async function requestDelivery(userId: string, orderId: string, form: Partial<DeliveryForm>) {
  const data = validateDeliveryForm(form);
  const res = await prisma.order.updateMany({
    where: { id: orderId, userId, status: "IN_INVENTORY" },
    data: { ...data, status: "DELIVERY_REQUESTED", requestedAt: new Date(), autoAdvance: DEMO_MODE },
  });
  if (res.count === 0) throw new AppError("NOT_ALLOWED", "Энэ барааг хүргүүлэх боломжгүй", 409);
}

/** Demo: requested → shipped after 1 min → delivered 3 min after the request. */
export const DEMO_SHIP_AFTER_MS = 60_000;
export const DEMO_DELIVER_AFTER_MS = 3 * 60_000;

export async function advanceDemoDeliveries(now = Date.now()) {
  const shipped = await prisma.order.updateMany({
    where: { autoAdvance: true, status: "DELIVERY_REQUESTED", requestedAt: { lte: new Date(now - DEMO_SHIP_AFTER_MS) } },
    data: { status: "SHIPPED", shippedAt: new Date(now) },
  });
  const delivered = await prisma.order.updateMany({
    where: { autoAdvance: true, status: "SHIPPED", requestedAt: { lte: new Date(now - DEMO_DELIVER_AFTER_MS) } },
    data: { status: "DELIVERED", deliveredAt: new Date(now) },
  });
  return { shipped: shipped.count, delivered: delivered.count };
}
