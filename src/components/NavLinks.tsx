"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function NavLinks({ links, mobile }: { links: { href: string; label: string }[]; mobile?: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/case") : path.startsWith(href));
  if (mobile) {
    return (
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${active(l.href) ? "bg-neon/15 text-neon" : "text-gray-400"}`}>
            {l.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active(l.href) ? "bg-neon/10 text-neon" : "text-gray-400 hover:text-white"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn-ghost px-3"
      title="Гарах"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      Гарах
    </button>
  );
}
