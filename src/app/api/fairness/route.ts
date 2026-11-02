import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { fairnessState, rotateSeed, setClientSeed } from "@/server/seeds";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return NextResponse.json(await fairnessState(user.id));
});

/** { action: "rotate" } or { action: "clientSeed", clientSeed } */
export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const body = await readJson<{ action?: string; clientSeed?: string }>(req);
  const result = body.action === "clientSeed" ? await setClientSeed(user.id, String(body.clientSeed ?? "")) : await rotateSeed(user.id);
  return NextResponse.json({ ...result, state: await fairnessState(user.id) });
});
