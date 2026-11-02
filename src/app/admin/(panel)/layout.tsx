import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/server/auth";

const NAV = [
  { href: "/admin", label: "📊 Самбар" },
  { href: "/admin/cases", label: "📦 Хайрцаг, бараа" },
  { href: "/admin/orders", label: "🚚 Захиалга, хүргэлт" },
  { href: "/admin/users", label: "👥 Хэрэглэгчид" },
  { href: "/admin/topups", label: "💳 Цэнэглэлт" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-24">
        <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-gray-500">Админ</div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-panel2 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
