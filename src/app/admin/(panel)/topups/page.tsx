import Link from "next/link";
import { prisma } from "@/server/db";
import { dateTime, mnt, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { PaymentStatus } from "@prisma/client";

export default async function AdminTopups({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const where = status && ["PENDING", "PAID", "FAILED"].includes(status) ? { status: status as PaymentStatus } : {};
  const [payments, sums] = await Promise.all([
    prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true, phone: true } } } }),
    prisma.payment.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="h1">Цэнэглэлтийн түүх</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/topups" className={`btn-ghost ${!status ? "!border-neon text-neon" : ""}`}>
          Бүгд
        </Link>
        {(["PAID", "PENDING", "FAILED"] as const).map((s) => {
          const g = sums.find((x) => x.status === s);
          return (
            <Link key={s} href={`/admin/topups?status=${s}`} className={`btn-ghost ${status === s ? "!border-neon text-neon" : ""}`}>
              {PAYMENT_STATUS_LABEL[s]} <span className="text-gray-500">{g?._count ?? 0} · {mnt(g?._sum.amount ?? 0)}</span>
            </Link>
          );
        })}
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Хэрэглэгч</th>
              <th>Provider</th>
              <th>Invoice</th>
              <th className="text-right">Дүн</th>
              <th>Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="whitespace-nowrap text-xs text-gray-400">{dateTime(p.createdAt)}</td>
                <td className="whitespace-nowrap">
                  {p.user.name} <span className="font-mono text-xs text-gray-500">{p.user.phone}</span>
                </td>
                <td className="text-xs">{p.provider}</td>
                <td className="font-mono text-xs text-gray-500">{p.invoiceId ?? "—"}</td>
                <td className={`text-right font-semibold ${p.amount < 0 ? "text-rose-400" : "text-white"}`}>{mnt(p.amount)}</td>
                <td className={p.status === "PAID" ? "text-emerald-400" : p.status === "FAILED" ? "text-rose-400" : "text-amber-400"}>{PAYMENT_STATUS_LABEL[p.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
