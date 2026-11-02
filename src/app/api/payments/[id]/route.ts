import { NextResponse } from "next/server";
import { route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { paymentStatus } from "@/server/payments";

export const dynamic = "force-dynamic";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  return NextResponse.json(await paymentStatus(user.id, id));
});
