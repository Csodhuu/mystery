import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { RequireLogin } from "@/components/RequireLogin";
import { TopUp } from "./TopUp";
import { dateTime, mnt, PAYMENT_STATUS_LABEL } from "@/lib/format";
import { DEMO_MODE } from "@/lib/env";

const PROVIDER_LABEL: Record<string, string> = { "qpay-mock": "QPay (demo)", qpay: "QPay", "dev-credit": "Dev цэнэглэлт", admin: "Админ засвар" };

export default async function WalletPage() {
  const user = await getUser();
  if (!user) return <RequireLogin next="/wallet" />;
  const payments = await prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-4">
        <div className="card p-6">
          <div className="label">Үлдэгдэл</div>
          <div className="text-4xl font-black text-neon">{mnt(user.balance)}</div>
        </div>
        <TopUp demo={DEMO_MODE} />
      </div>
      <div className="card overflow-hidden">
        <h2 className="border-b border-line p-4 font-bold text-white">Цэнэглэлтийн түүх</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Огноо</th>
                <th>Төрөл</th>
                <th className="text-right">Дүн</th>
                <th>Төлөв</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap text-gray-400">{dateTime(p.createdAt)}</td>
                  <td>{PROVIDER_LABEL[p.provider] ?? p.provider}</td>
                  <td className={`text-right font-semibold ${p.amount < 0 ? "text-rose-400" : "text-white"}`}>{mnt(p.amount)}</td>
                  <td>
                    <span className={p.status === "PAID" ? "text-emerald-400" : p.status === "FAILED" ? "text-rose-400" : "text-amber-400"}>{PAYMENT_STATUS_LABEL[p.status]}</span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Гүйлгээ алга
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
