import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { requestDelivery, type DeliveryForm } from "@/server/delivery";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await requestDelivery(user.id, id, await readJson<Partial<DeliveryForm>>(req));
  return NextResponse.json({ ok: true });
});
