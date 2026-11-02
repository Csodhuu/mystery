import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";

const FLOW = ["IN_INVENTORY", "DELIVERY_REQUESTED", "SHIPPED", "DELIVERED"] as const;

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { status } = await readJson<{ status?: string }>(req);
  if (!FLOW.includes(status as (typeof FLOW)[number])) throw new AppError("BAD_STATUS", "Төлөв буруу");
  const s = status as (typeof FLOW)[number];
  const now = new Date();
  const order = await prisma.order.update({
    where: { id },
    data: {
      status: s,
      autoAdvance: false,
      ...(s === "SHIPPED" ? { shippedAt: now } : {}),
      ...(s === "DELIVERED" ? { deliveredAt: now } : {}),
    },
  });
  return NextResponse.json(order);
});
