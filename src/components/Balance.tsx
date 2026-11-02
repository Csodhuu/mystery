"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { mnt } from "@/lib/format";

export function emitBalance(balance: number) {
  window.dispatchEvent(new CustomEvent("balance", { detail: balance }));
}

export function BalanceBadge({ initial }: { initial: number }) {
  const [b, setB] = useState(initial);
  useEffect(() => setB(initial), [initial]);
  useEffect(() => {
    const h = (e: Event) => setB((e as CustomEvent<number>).detail);
    window.addEventListener("balance", h);
    return () => window.removeEventListener("balance", h);
  }, []);
  return (
    <Link href="/wallet" className="flex items-center gap-2 rounded-xl border border-neon/40 bg-neon/10 px-3 py-1.5 text-sm font-bold text-neon hover:bg-neon/20">
      <span>{mnt(b)}</span>
      <span className="grid h-5 w-5 place-items-center rounded-md bg-neon text-xs text-black">+</span>
    </Link>
  );
}
