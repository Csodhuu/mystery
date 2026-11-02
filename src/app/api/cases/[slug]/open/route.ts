import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { openCase } from "@/server/opening";

export const POST = route(async (req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser();
  const { slug } = await ctx.params;
  const { idempotencyKey } = await readJson<{ idempotencyKey?: string }>(req);
  const key = req.headers.get("idempotency-key") ?? idempotencyKey ?? "";
  return NextResponse.json(await openCase({ userId: user.id, slug, idempotencyKey: key }));
});
