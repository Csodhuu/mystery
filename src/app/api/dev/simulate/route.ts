import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireDemo } from "@/server/dev";
import { AppError } from "@/server/errors";
import { prisma } from "@/server/db";
import { simulate, WEIGHT_TOTAL } from "@/lib/fairness";

export const POST = route(async (req: Request) => {
  requireDemo();
  const { slug, n } = await readJson<{ slug?: string; n?: number }>(req);
  const count = Math.min(Math.max(Number(n) || 10_000, 100), 200_000);
  const kase = await prisma.case.findUnique({
    where: { slug: String(slug ?? "") },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
  });
  if (!kase) throw new AppError("NOT_FOUND", "Хайрцаг олдсонгүй", 404);
  const t0 = Date.now();
  const counts = simulate(kase.items, count);
  let paid = 0;
  const rows = kase.items.map((it) => {
    const c = counts.get(it.id) ?? 0;
    paid += c * it.value;
    return { id: it.id, name: it.name, rarity: it.rarity, value: it.value, configured: (it.weight / WEIGHT_TOTAL) * 100, actual: (c / count) * 100, count: c };
  });
  const ev = kase.items.reduce((s, i) => s + (i.value * i.weight) / WEIGHT_TOTAL, 0);
  return NextResponse.json({
    n: count,
    ms: Date.now() - t0,
    rows,
    configuredRtp: (ev / kase.price) * 100,
    actualRtp: (paid / (count * kase.price)) * 100,
  });
});
