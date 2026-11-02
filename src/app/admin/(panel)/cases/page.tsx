import Link from "next/link";
import { prisma } from "@/server/db";
import { mnt } from "@/lib/format";
import { WEIGHT_TOTAL } from "@/lib/fairness";
import { NewCaseForm } from "./NewCaseForm";

export default async function AdminCases() {
  const cases = await prisma.case.findMany({ orderBy: { sortOrder: "asc" }, include: { items: true, _count: { select: { openings: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="h1">Хайрцаг, бараа</h1>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Хайрцаг</th>
              <th className="text-right">Үнэ</th>
              <th className="text-right">Бараа</th>
              <th className="text-right">EV</th>
              <th className="text-right">House margin</th>
              <th className="text-right">Нээлт</th>
              <th>Төлөв</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const total = c.items.reduce((s, i) => s + i.weight, 0);
              const ev = c.items.reduce((s, i) => s + (i.value * i.weight) / WEIGHT_TOTAL, 0);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt="" className="h-9 w-9" />
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="font-mono text-xs text-gray-500">/{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">{mnt(c.price)}</td>
                  <td className="text-right">{c.items.length}</td>
                  <td className="text-right">{mnt(ev)}</td>
                  <td className="text-right">{(100 - (ev / c.price) * 100).toFixed(1)}%</td>
                  <td className="text-right">{c._count.openings}</td>
                  <td>
                    {total !== WEIGHT_TOTAL ? (
                      <span className="text-rose-400">⚠ {total / 1000}%</span>
                    ) : c.items.some((i) => i.stock <= 0) ? (
                      <span className="text-amber-400">Нөөц дууссан</span>
                    ) : c.isActive ? (
                      <span className="text-emerald-400">Идэвхтэй</span>
                    ) : (
                      <span className="text-gray-500">Идэвхгүй</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/cases/${c.id}`} className="text-sm font-semibold text-neon hover:underline">
                      Засах →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <NewCaseForm />
    </div>
  );
}
