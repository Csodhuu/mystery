import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { DEMO_MODE } from "@/lib/env";
import { DevPanel } from "./DevPanel";

export default async function DevPage() {
  if (!DEMO_MODE) notFound();
  const user = await getUser();
  const [users, cases, pending] = await Promise.all([
    prisma.user.findMany({ where: { isDemo: true }, orderBy: { phone: "asc" }, select: { id: true, name: true, phone: true, balance: true } }),
    prisma.case.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
    user ? prisma.payment.findMany({ where: { userId: user.id, status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10 }) : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">🛠️ Dev tools</h1>
        <p className="muted">Зөвхөн DEMO_MODE=true үед. Бүх үйлдэл хуурамч өгөгдөл дээр.</p>
      </div>
      <DevPanel
        me={user ? { name: user.name, phone: user.phone, balance: user.balance, isDemo: user.isDemo } : null}
        users={users}
        cases={cases}
        pending={pending.map((p) => ({ id: p.id, amount: p.amount, createdAt: p.createdAt.toISOString() }))}
      />
    </div>
  );
}
