import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "./db";
import { AppError } from "./errors";
import { DEMO_MODE } from "../lib/env";

export interface SmsProvider {
  send(phone: string, text: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async send(phone: string, text: string) {
    console.log(`\n📱 [MOCK SMS] → ${phone}: ${text}\n`);
  }
}

/** Plug a real Mongolian SMS gateway (e.g. Unitel / Mobicom / Skytel API) in here. */
export class GatewaySmsProvider implements SmsProvider {
  async send(): Promise<void> {
    throw new AppError("SMS_NOT_CONFIGURED", "SMS үйлчилгээ тохируулагдаагүй байна", 503);
  }
}

export const smsProvider: SmsProvider = DEMO_MODE ? new MockSmsProvider() : new GatewaySmsProvider();

export const DEMO_OTP = "1234";
const OTP_TTL_MS = 5 * 60_000;
const RESEND_MS = 30_000;
const MAX_ATTEMPTS = 5;

export const PHONE_RE = /^[6-9]\d{7}$/;

const hashCode = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}:${process.env.SESSION_SECRET}`).digest("hex");

export async function requestOtp(phone: string) {
  if (!PHONE_RE.test(phone)) throw new AppError("BAD_PHONE", "Утасны дугаар буруу байна (8 оронтой)");
  const last = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_MS && !DEMO_MODE) {
    throw new AppError("TOO_SOON", "30 секундын дараа дахин оролдоно уу", 429);
  }
  const code = DEMO_MODE ? DEMO_OTP : String(randomInt(1000, 10000));
  await prisma.otpCode.create({
    data: { phone, codeHash: hashCode(phone, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  if (DEMO_MODE) console.log(`🔐 [DEMO OTP] ${phone} → ${code}`);
  await smsProvider.send(phone, `Hairtsag.mn баталгаажуулах код: ${code}`);
}

export async function verifyOtp(phone: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new AppError("OTP_EXPIRED", "Код хүчингүй болсон. Дахин код авна уу");
  if (otp.attempts >= MAX_ATTEMPTS) throw new AppError("OTP_LOCKED", "Хэт олон удаа буруу оруулсан байна");
  const a = Buffer.from(hashCode(phone, code));
  const b = Buffer.from(otp.codeHash);
  if (!timingSafeEqual(a, b)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError("OTP_WRONG", "Код буруу байна");
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
}
