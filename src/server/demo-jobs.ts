import { randomInt } from "node:crypto";
import { prisma } from "./db";
import { advanceDemoDeliveries } from "./delivery";
import { generateClientSeed, generateServerSeed, resolveOpening } from "../lib/fairness";
import { DEMO_MODE } from "../lib/env";

const g = globalThis as unknown as { __demoJobs?: boolean };

/** Background jobs that only exist in DEMO_MODE: delivery progression + live-drop bot. */
export function startDemoJobs() {
  if (!DEMO_MODE || g.__demoJobs) return;
  g.__demoJobs = true;
  console.log("🤖 [DEMO] Хүргэлтийн mock болон live-drop bot ажиллаж эхэллээ");

  setInterval(() => {
    advanceDemoDeliveries().catch((e) => console.error("[DEMO] delivery job", e));
  }, 10_000);

  const loop = async () => {
    try {
      await botDrop();
    } catch (e) {
      console.error("[DEMO] bot drop", e);
    }
    setTimeout(loop, randomInt(5_000, 15_001));
  };
  setTimeout(loop, 3_000);
}

/** One fake drop by a random dummy user, rolled with the real probability table. Does not touch stock or balances. */
export async function botDrop() {
  const [users, cases] = await Promise.all([
    prisma.user.findMany({ where: { isDemo: true }, select: { name: true } }),
    prisma.case.findMany({
      where: { isActive: true },
      include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    }),
  ]);
  if (!users.length || !cases.length) return;
  const user = users[randomInt(users.length)];
  const kase = cases[randomInt(cases.length)];
  const { entry } = resolveOpening(kase.items, generateServerSeed(), generateClientSeed(), 0);
  await prisma.liveDrop.create({ data: { userName: user.name, itemId: entry.id, isDemo: true } });

  // Keep the feed table small.
  const cutoff = await prisma.liveDrop.findFirst({ orderBy: { id: "desc" }, skip: 1000, select: { id: true } });
  if (cutoff) await prisma.liveDrop.deleteMany({ where: { id: { lte: cutoff.id }, isDemo: true } });
}
