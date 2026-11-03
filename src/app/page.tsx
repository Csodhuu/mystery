import Link from "next/link";
import { prisma } from "@/server/db";
import { CaseCard } from "@/components/CaseCard";
import { TopWins } from "@/components/TopWins";
import { HeroMascot } from "@/components/HeroMascot";

export default async function Home() {
  const cases = await prisma.case.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { value: "desc" }, take: 3 } },
  });
  const stats = await prisma.opening.aggregate({ _count: true, _sum: { itemValue: true } });

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rare/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-neon/20 blur-3xl" />
        <HeroMascot />
        <div className="relative max-w-2xl">
          <span className="rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-bold text-neon">Provably fair · Бодит бараа · Хүргэлттэй</span>
          <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
            Хайрцгаа нээ, <span className="bg-gradient-to-r from-neon via-rare to-legendary bg-clip-text text-transparent">бодит шагнал</span> хож!
          </h1>
          <p className="mt-3 text-gray-400">
            AirPods, iPhone, PlayStation 5 хүртэлх бараа таныг хүлээж байна. Хожсон бараагаа Улаанбаатар хотод гэрээрээ хүргүүлж аваарай.
          </p>
          <a href="#cases" className="btn-primary mt-6 px-7 py-3.5 text-base">
            🎁 Хайрцаг сонгох
          </a>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <div className="text-2xl font-black text-white">{stats._count.toLocaleString()}</div>
              <div className="text-gray-500">нийт нээлт</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{(stats._sum.itemValue ?? 0).toLocaleString()}₮</div>
              <div className="text-gray-500">нийт хожсон бараа</div>
            </div>
            <Link href="/fairness" className="self-center text-neon underline-offset-4 hover:underline">
              Шударга байдал хэрхэн баталгаажих вэ? →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 id="cases" className="h1 mb-4 scroll-mt-24">Хайрцагнууд</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <CaseCard key={c.id} slug={c.slug} name={c.name} price={c.price} image={c.image} color={c.color} top={c.items} />
          ))}
        </div>
      </section>

      <section>
        <TopWins />
      </section>
    </div>
  );
}
