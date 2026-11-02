import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { createTopUp } from "@/server/payments";

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const { amount } = await readJson<{ amount?: number }>(req);
  return NextResponse.json(await createTopUp(user.id, Number(amount)));
});
