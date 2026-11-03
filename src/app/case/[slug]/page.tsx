import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { getActiveSeed } from "@/server/seeds";
import { CaseOpener } from "@/components/opening/CaseOpener";
import { mnt } from "@/lib/format";
import { applyMode, OPEN_MODES } from "@/lib/modes";

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kase = await prisma.case.findUnique({ where: { slug }, include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } });
  if (!kase || !kase.isActive) notFound();
  const user = await getUser();
  const seed = user ? await getActiveSeed(prisma, user.id) : null;
  const items = kase.items.map((i) => ({ id: i.id, name: i.name, value: i.value, rarity: i.rarity, image: i.image }));
  const display = [...kase.items].sort((a, b) => b.value - a.value);
  // Price + odds per mode, computed with the same function the opening transaction uses.
  const modes = Object.fromEntries(
    OPEN_MODES.map((m) => {
      const t = applyMode(kase.items, kase.price, m);
      return [m, { price: t.price, weights: Object.fromEntries(t.items.map((i) => [i.id, i.weight])) }];
    }),
  ) as Record<(typeof OPEN_MODES)[number], { price: number; weights: Record<string, number> }>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-gray-500 hover:text-white">
            ← Бүх хайрцаг
          </Link>
          <h1 className="h1 mt-1">{kase.name}</h1>
          <p className="muted mt-1">{kase.description}</p>
        </div>
        <div className="text-2xl font-black" style={{ color: kase.color }}>
          {mnt(kase.price)}
        </div>
      </div>

      <CaseOpener
        slug={kase.slug}
        modes={modes}
        color={kase.color}
        image={kase.image}
        items={items}
        loggedIn={!!user}
        balance={user?.balance ?? 0}
        outOfStock={kase.items.some((i) => i.stock <= 0)}
        fairness={seed ? { hash: seed.hash, clientSeed: seed.clientSeed, nonce: seed.nonce } : null}
        display={display.map((i) => ({ id: i.id, name: i.name, value: i.value, rarity: i.rarity, image: i.image, stock: i.stock }))}
      />
    </div>
  );
}
