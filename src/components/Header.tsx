import Link from "next/link";
import { getUser } from "@/server/auth";
import { DEMO_MODE } from "@/lib/env";
import { BalanceBadge } from "./Balance";
import { NavLinks, LogoutButton } from "./NavLinks";

export async function Header() {
  const user = await getUser();
  const links = [
    { href: "/", label: "Хайрцагнууд" },
    { href: "/inventory", label: "Агуулах" },
    { href: "/history", label: "Түүх" },
    { href: "/fairness", label: "Шударга байдал" },
    ...(DEMO_MODE ? [{ href: "/dev", label: "Dev" }] : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin", label: "Админ" }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-neon to-rare text-black shadow-[0_0_18px_rgba(34,211,238,.5)]">▣</span>
          <span>
            Хайрцаг<span className="text-neon">.mn</span>
          </span>
        </Link>
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <BalanceBadge initial={user.balance} />
              <span className="hidden max-w-[120px] truncate text-sm text-gray-300 md:inline">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Нэвтрэх
            </Link>
          )}
        </div>
      </div>
      <NavLinks links={links} mobile />
    </header>
  );
}
