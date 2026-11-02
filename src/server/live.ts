import { prisma } from "./db";
import { DEMO_MODE } from "../lib/env";

export type DropDTO = {
  id: number;
  userName: string;
  isDemo: boolean;
  createdAt: string;
  item: { name: string; value: number; rarity: string; image: string };
  caseSlug: string;
  caseName: string;
};

export async function recentDrops(afterId = 0, take = 20): Promise<DropDTO[]> {
  const rows = await prisma.liveDrop.findMany({
    where: { id: { gt: afterId }, ...(DEMO_MODE ? {} : { isDemo: false }) },
    orderBy: { id: "desc" },
    take,
    include: { item: { include: { case: { select: { slug: true, name: true } } } } },
  });
  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
    item: { name: r.item.name, value: r.item.value, rarity: r.item.rarity, image: r.item.image },
    caseSlug: r.item.case.slug,
    caseName: r.item.case.name,
  }));
}

export async function topWins(period: "day" | "week", take = 8) {
  const since = new Date(Date.now() - (period === "day" ? 1 : 7) * 86_400_000);
  return prisma.opening.findMany({
    where: { createdAt: { gte: since }, ...(DEMO_MODE ? {} : { user: { isDemo: false } }) },
    orderBy: [{ itemValue: "desc" }, { createdAt: "desc" }],
    take,
    include: { item: true, case: { select: { name: true, slug: true } }, user: { select: { name: true } } },
  });
}
