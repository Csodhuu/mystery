import { AppError } from "./errors";
import { RARITIES, type RarityKey } from "../lib/rarity";

const str = (v: unknown, min: number, max: number, label: string) => {
  const s = String(v ?? "").trim();
  if (s.length < min || s.length > max) throw new AppError("BAD_INPUT", `${label}: ${min}-${max} тэмдэгт`);
  return s;
};
const int = (v: unknown, min: number, max: number, label: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new AppError("BAD_INPUT", `${label}: ${min}–${max} бүхэл тоо`);
  return n;
};
const image = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!/^\/(generated|uploads)\/[\w./-]+$/.test(s)) throw new AppError("BAD_INPUT", "Зураг: локал зам (/uploads/... эсвэл /generated/...)");
  return s;
};

export function parseCaseInput(b: Record<string, unknown>, create: boolean) {
  const out: Record<string, unknown> = {};
  if (create || b.name !== undefined) out.name = str(b.name, 2, 60, "Нэр");
  if (create || b.slug !== undefined) {
    const slug = String(b.slug ?? "").trim();
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) throw new AppError("BAD_INPUT", "Slug: a-z, 0-9, - (2-40)");
    out.slug = slug;
  }
  if (create || b.price !== undefined) out.price = int(b.price, 100, 100_000_000, "Үнэ");
  if (create || b.image !== undefined) out.image = image(b.image);
  if (b.description !== undefined) out.description = str(b.description, 0, 300, "Тайлбар");
  if (b.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(b.color))) throw new AppError("BAD_INPUT", "Өнгө: #RRGGBB");
    out.color = String(b.color);
  }
  if (b.isActive !== undefined) out.isActive = Boolean(b.isActive);
  if (b.sortOrder !== undefined) out.sortOrder = int(b.sortOrder, 0, 1000, "Эрэмбэ");
  return out;
}

export function parseItemInput(b: Record<string, unknown>, create: boolean) {
  const out: Record<string, unknown> = {};
  if (create || b.name !== undefined) out.name = str(b.name, 1, 80, "Нэр");
  if (create || b.value !== undefined) out.value = int(b.value, 0, 1_000_000_000, "Үнэ цэнэ");
  if (create || b.rarity !== undefined) {
    if (!RARITIES.includes(b.rarity as RarityKey)) throw new AppError("BAD_INPUT", "Зэрэглэл буруу");
    out.rarity = b.rarity;
  }
  if (create || b.stock !== undefined) out.stock = int(b.stock, 0, 10_000_000, "Нөөц");
  if (create || b.image !== undefined) out.image = image(b.image);
  return out;
}
