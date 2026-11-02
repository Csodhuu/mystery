import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { getActiveSeed } from "@/server/seeds";
import { ItemCard } from "@/components/ItemCard";
import { CaseOpener } from "@/components/opening/CaseOpener";
import { mnt } from "@/lib/format";

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kase = await prisma.case.findUnique({ where: { slug }, include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } });
  if (!kase || !kase.isActive) notFound();
  const user = await getUser();
  const seed = user ? await getActiveSeed(prisma, user.id) : null;
  const items = kase.items.map((i) => ({ id: i.id, name: i.name, value: i.value, rarity: i.rarity, image: i.image }));
  const display = [...kase.items].sort((a, b) => b.value - a.value);

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
        price={kase.price}
        color={kase.color}
        image={kase.image}
        items={items}
        loggedIn={!!user}
        balance={user?.balance ?? 0}
        outOfStock={kase.items.some((i) => i.stock <= 0)}
        fairness={seed ? { hash: seed.hash, clientSeed: seed.clientSeed, nonce: seed.nonce } : null}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Хайрцагт байгаа бараа</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {display.map((i) => (
            <ItemCard key={i.id} name={i.name} value={i.value} rarity={i.rarity} image={i.image} weight={i.weight} stock={i.stock} />
          ))}
        </div>
      </section>
    </div>
  );
}
