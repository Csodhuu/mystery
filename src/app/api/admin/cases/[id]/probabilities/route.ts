import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { WEIGHT_TOTAL } from "@/lib/fairness";

/** { weights: { [itemId]: weight } } – must cover every item and sum to exactly 100%. */
export const PUT = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { weights } = await readJson<{ weights?: Record<string, number> }>(req);
  const items = await prisma.item.findMany({ where: { caseId: id } });
  if (!weights || items.some((i) => !(i.id in weights))) throw new AppError("BAD_TABLE", "Бүх барааны магадлалыг оруулна уу");
  const values = items.map((i) => Number(weights[i.id]));
  if (values.some((w) => !Number.isInteger(w) || w < 0)) throw new AppError("BAD_TABLE", "Магадлал 0.001%-ийн нарийвчлалтай сөрөг биш тоо байна");
  const total = values.reduce((a, b) => a + b, 0);
  if (total !== WEIGHT_TOTAL) throw new AppError("BAD_TABLE", `Нийлбэр 100% байх ёстой (одоо ${total / 1000}%)`);
  await prisma.$transaction(items.map((i) => prisma.item.update({ where: { id: i.id }, data: { weight: Number(weights[i.id]) } })));
  return NextResponse.json({ ok: true });
});
