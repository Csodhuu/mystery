import { prisma } from "@/server/db";
import { mnt } from "@/lib/format";
import { WEIGHT_TOTAL } from "@/lib/fairness";
import { DashboardCharts } from "./DashboardCharts";

const DAY = 86_400_000;

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 30 * DAY);
  const [openings, totals, topups, users, pendingOrders, cases] = await Promise.all([
    prisma.opening.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, price: true, itemValue: true, caseId: true } }),
    prisma.opening.aggregate({ _count: true, _sum: { price: true, itemValue: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", amount: { gt: 0 }, provider: { in: ["qpay", "qpay-mock"] } }, _sum: { amount: true }, _count: true }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.order.count({ where: { status: "DELIVERY_REQUESTED" } }),
    prisma.case.findMany({ orderBy: { sortOrder: "asc" }, include: { items: true } }),
  ]);

  // Daily buckets (local date) for the last 30 days.
  const key = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * DAY);
    return { day: key(d), revenue: 0, payout: 0, opened: 0 };
  });
  const idx = new Map(days.map((d, i) => [d.day, i]));
  for (const o of openings) {
    const i = idx.get(key(o.createdAt));
    if (i === undefined) continue;
    days[i].revenue += o.price;
    days[i].payout += o.itemValue;
    days[i].opened += 1;
  }

  const perCase = cases.map((c) => {
    const os = openings.filter((o) => o.caseId === c.id);
    const rev = os.reduce((s, o) => s + o.price, 0);
    const pay = os.reduce((s, o) => s + o.itemValue, 0);
    const ev = c.items.reduce((s, i) => s + (i.value * i.weight) / WEIGHT_TOTAL, 0);
    return { name: c.name, opened: os.length, revenue: rev, payout: pay, actual: rev ? (pay / rev) * 100 : 0, expected: (ev / c.price) * 100 };
  });

  const revenue = totals._sum.price ?? 0;
  const payout = totals._sum.itemValue ?? 0;
  const tiles = [
    { label: "Нийт орлого", value: mnt(revenue), sub: "нээлтийн төлбөр" },
    { label: "Нээгдсэн хайрцаг", value: totals._count.toLocaleString(), sub: "бүх цаг үе" },
    { label: "Payout ratio", value: `${revenue ? ((payout / revenue) * 100).toFixed(1) : "0"}%`, sub: `${mnt(payout)} бараа` },
    { label: "Ашиг (gross)", value: mnt(revenue - payout), sub: "орлого − барааны үнэ" },
    { label: "QPay цэнэглэлт", value: mnt(topups._sum.amount ?? 0), sub: `${topups._count} гүйлгээ` },
    { label: "Хэрэглэгч", value: users.toLocaleString(), sub: `${pendingOrders} хүргэлт хүлээгдэж буй` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="h1">Самбар</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <div className="text-xs text-gray-400">{t.label}</div>
            <div className="mt-1 text-xl font-black text-white">{t.value}</div>
            <div className="text-[11px] text-gray-500">{t.sub}</div>
          </div>
        ))}
      </div>
      <DashboardCharts days={days} />
      <div className="card overflow-x-auto">
        <h2 className="border-b border-line p-4 font-bold text-white">Хайрцаг бүрээр (сүүлийн 30 хоног)</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>Хайрцаг</th>
              <th className="text-right">Нээлт</th>
              <th className="text-right">Орлого</th>
              <th className="text-right">Бараа</th>
              <th className="text-right">Бодит payout</th>
              <th className="text-right">Тохируулсан (EV)</th>
            </tr>
          </thead>
          <tbody>
            {perCase.map((c) => (
              <tr key={c.name}>
                <td className="font-semibold text-white">{c.name}</td>
                <td className="text-right">{c.opened}</td>
                <td className="text-right">{mnt(c.revenue)}</td>
                <td className="text-right">{mnt(c.payout)}</td>
                <td className="text-right font-semibold text-white">{c.actual.toFixed(1)}%</td>
                <td className="text-right text-gray-400">{c.expected.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="p-4 text-xs text-gray-500">Бодит payout нь цөөн нээлттэй үед ховор том хожлоос болж EV-ээс их хэлбэлзэнэ.</p>
      </div>
    </div>
  );
}
