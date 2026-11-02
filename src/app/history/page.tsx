import Link from "next/link";
import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { RequireLogin } from "@/components/RequireLogin";
import { RarityBadge } from "@/components/ItemCard";
import { dateTime, mnt } from "@/lib/format";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) return <RequireLogin next="/history" />;
  const openings = await prisma.opening.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { item: true, case: true, serverSeed: { select: { hash: true, seed: true, active: true } } },
  });
  const totals = await prisma.opening.aggregate({ where: { userId: user.id }, _count: true, _sum: { price: true, itemValue: true } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h1">Нээлтийн түүх</h1>
          <p className="muted">Сүүлийн 100 нээлт. Server seed-ээ солисны дараа нээлт бүрийг шалгах боломжтой.</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <div className="text-gray-500">Нээлт</div>
            <div className="font-bold text-white">{totals._count}</div>
          </div>
          <div>
            <div className="text-gray-500">Зарцуулсан</div>
            <div className="font-bold text-white">{mnt(totals._sum.price ?? 0)}</div>
          </div>
          <div>
            <div className="text-gray-500">Хожсон</div>
            <div className="font-bold text-neon">{mnt(totals._sum.itemValue ?? 0)}</div>
          </div>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Хайрцаг</th>
              <th>Бараа</th>
              <th className="text-right">Үнэ цэнэ</th>
              <th>Nonce</th>
              <th>Шалгах</th>
            </tr>
          </thead>
          <tbody>
            {openings.map((o) => {
              const revealed = !o.serverSeed.active;
              const q = new URLSearchParams({ opening: o.id, clientSeed: o.clientSeed, nonce: String(o.nonce), ...(revealed ? { serverSeed: o.serverSeed.seed } : {}) });
              return (
                <tr key={o.id}>
                  <td className="whitespace-nowrap text-gray-400">{dateTime(o.createdAt)}</td>
                  <td className="whitespace-nowrap">{o.case.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.item.image} alt="" className="h-8 w-8 rounded-md" />
                      <span className="text-white">{o.item.name}</span>
                      <RarityBadge rarity={o.item.rarity} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-right font-semibold">{mnt(o.itemValue)}</td>
                  <td className="font-mono text-xs text-gray-400">{o.nonce}</td>
                  <td>
                    {revealed ? (
                      <Link href={`/fairness/verify?${q}`} className="text-xs font-semibold text-neon hover:underline">
                        Шалгах →
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-500" title="Server seed-ээ солисны дараа шалгах боломжтой">
                        Seed нууц
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {openings.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  Нээлт алга
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
