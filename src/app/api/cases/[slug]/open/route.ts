import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { openCase, openCases } from "@/server/opening";
import { isOpenMode } from "@/lib/modes";
import { AppError } from "@/server/errors";

export const POST = route(async (req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser();
  const { slug } = await ctx.params;
  const { idempotencyKey, count, mode = "normal" } = await readJson<{ idempotencyKey?: string; count?: number; mode?: string }>(req);
  if (!isOpenMode(mode)) throw new AppError("BAD_MODE", "Горим буруу");
  const key = req.headers.get("idempotency-key") ?? idempotencyKey ?? "";
  if (count === undefined) return NextResponse.json(await openCase({ userId: user.id, slug, idempotencyKey: key }));
  return NextResponse.json({ results: await openCases({ userId: user.id, slug, idempotencyKey: key, count, mode }) });
});
