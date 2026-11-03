import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { sellOrders } from "@/server/selling";

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { ids } = await readJson<{ ids?: string[] }>(req);
  return NextResponse.json(await sellOrders(user.id, Array.isArray(ids) ? ids : []));
});
