import { NextResponse } from "next/server";
import { readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { parseCaseInput } from "@/server/admin";

export const POST = route(async (req: Request) => {
  await requireAdmin();
  const data = parseCaseInput(await readJson(req), true);
  const c = await prisma.case.create({ data: data as Parameters<typeof prisma.case.create>[0]["data"] });
  return NextResponse.json(c);
});
