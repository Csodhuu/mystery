import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { AppError } from "./errors";
import { DEMO_MODE } from "../lib/env";

const COOKIE = "hs_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export function secret() {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  // DEMO_MODE without a configured secret: derive one from the (private) database URL
  if (DEMO_MODE && process.env.DATABASE_URL) return createHash("sha256").update(`session:${process.env.DATABASE_URL}`).digest("hex");
  throw new Error("SESSION_SECRET is not set");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export async function setSession(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

async function sessionUserId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [uid, exp, sig] = raw.split(".");
  if (!uid || !exp || !sig) return null;
  const expected = Buffer.from(sign(`${uid}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return uid;
}

export async function getUser() {
  const id = await sessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || (user.isDemo && !DEMO_MODE)) return null;
  return user;
}

export async function requireUser() {
  const u = await getUser();
  if (!u) throw new AppError("UNAUTHORIZED", "Нэвтэрнэ үү", 401);
  return u;
}

export async function requireAdmin() {
  const u = await getUser();
  if (!u || u.role !== "ADMIN") throw new AppError("FORBIDDEN", "Хандах эрхгүй", 403);
  return u;
}
