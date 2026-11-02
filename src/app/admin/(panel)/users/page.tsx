import { prisma } from "@/server/db";
import { dateTime, mnt } from "@/lib/format";
import { BalanceAdjust } from "./BalanceAdjust";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { openings: true } } },
  });
  const spend = await prisma.opening.groupBy({ by: ["userId"], where: { userId: { in: users.map((u) => u.id) } }, _sum: { price: true, itemValue: true } });
  const byUser = new Map(spend.map((s) => [s.userId, s._sum]));
  return (
    <div className="space-y-4">
      <h1 className="h1">Хэрэглэгчид, үлдэгдэл</h1>
      <form className="flex max-w-md gap-2">
        <input name="q" defaultValue={q} className="input" placeholder="Нэр эсвэл утас" />
        <button className="btn-ghost">Хайх</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Хэрэглэгч</th>
              <th>Утас</th>
              <th className="text-right">Үлдэгдэл</th>
              <th className="text-right">Нээлт</th>
              <th className="text-right">Зарцуулсан</th>
              <th className="text-right">Хожсон</th>
              <th>Бүртгүүлсэн</th>
              <th>Үлдэгдэл засах</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-nowrap">
                  <span className="text-white">{u.name}</span>{" "}
                  {u.role === "ADMIN" && <span className="rounded bg-neon/20 px-1 text-[10px] font-bold text-neon">ADMIN</span>}
                  {u.isDemo && <span className="rounded bg-amber-500/20 px-1 text-[10px] font-bold text-amber-400">ТЕСТ</span>}
                </td>
                <td className="font-mono text-xs">{u.phone}</td>
                <td className="text-right font-semibold text-neon">{mnt(u.balance)}</td>
                <td className="text-right">{u._count.openings}</td>
                <td className="text-right">{mnt(byUser.get(u.id)?.price ?? 0)}</td>
                <td className="text-right">{mnt(byUser.get(u.id)?.itemValue ?? 0)}</td>
                <td className="whitespace-nowrap text-xs text-gray-400">{dateTime(u.createdAt)}</td>
                <td>
                  <BalanceAdjust id={u.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
