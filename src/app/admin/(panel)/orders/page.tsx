import Link from "next/link";
import { prisma } from "@/server/db";
import { dateTime, mnt, ORDER_STATUS_LABEL } from "@/lib/format";
import { RarityBadge } from "@/components/ItemCard";
import { StatusSelect } from "./StatusSelect";
import type { OrderStatus } from "@prisma/client";

const STATUSES = ["DELIVERY_REQUESTED", "SHIPPED", "DELIVERED", "IN_INVENTORY"] as const;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as OrderStatus) : "DELIVERY_REQUESTED";
  const page = Math.max(1, Number(sp.page) || 1);
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: { status },
      orderBy: [{ requestedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      skip: (page - 1) * 50,
      include: { item: { include: { case: { select: { name: true } } } }, user: { select: { name: true, phone: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="h1">Захиалга, хүргэлт</h1>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`btn-ghost whitespace-nowrap ${s === status ? "!border-neon text-neon" : ""}`}>
            {ORDER_STATUS_LABEL[s]} <span className="text-gray-500">{count(s)}</span>
          </Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Бараа</th>
              <th>Хэрэглэгч</th>
              <th>Хүлээн авагч / хаяг</th>
              <th>Огноо</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.item.image} alt="" className="h-9 w-9 rounded" />
                    <div>
                      <div className="font-semibold text-white">{o.item.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {o.item.case.name} · {mnt(o.item.value)} <RarityBadge rarity={o.item.rarity} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  <div>{o.user.name}</div>
                  <div className="font-mono text-xs text-gray-500">{o.user.phone}</div>
                </td>
                <td className="max-w-xs text-xs">
                  {o.fullName ? (
                    <>
                      <div className="text-white">
                        {o.fullName} · {o.phone}
                      </div>
                      <div className="text-gray-400">
                        {o.district}, {o.khoroo}-р хороо, {o.address}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-xs text-gray-400">
                  <div>Хожсон: {dateTime(o.createdAt)}</div>
                  {o.requestedAt && <div>Хүссэн: {dateTime(o.requestedAt)}</div>}
                  {o.shippedAt && <div>Илгээсэн: {dateTime(o.shippedAt)}</div>}
                  {o.deliveredAt && <div>Хүргэсэн: {dateTime(o.deliveredAt)}</div>}
                </td>
                <td>
                  <StatusSelect id={o.id} status={o.status} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  Захиалга алга
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between text-sm">
        {page > 1 ? <Link className="text-neon" href={`/admin/orders?status=${status}&page=${page - 1}`}>← Өмнөх</Link> : <span />}
        {orders.length === 50 && <Link className="text-neon" href={`/admin/orders?status=${status}&page=${page + 1}`}>Дараах →</Link>}
      </div>
    </div>
  );
}
