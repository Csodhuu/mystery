"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RARITY, type RarityKey } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import type { DropDTO } from "@/server/live";

export function LiveTicker() {
  const [drops, setDrops] = useState<DropDTO[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/live");
    es.addEventListener("init", (e) => {
      setDrops(JSON.parse((e as MessageEvent).data));
      setConnected(true);
    });
    es.addEventListener("drops", (e) => {
      const fresh: DropDTO[] = JSON.parse((e as MessageEvent).data);
      setDrops((d) => [...fresh.reverse(), ...d].slice(0, 30));
    });
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);
    return () => es.close();
  }, []);

  return (
    <div className="border-b border-line bg-panel/60">
      <div className="mx-auto flex max-w-7xl items-stretch gap-3 px-4 py-2">
        <div className="flex shrink-0 flex-col justify-center pr-2">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-300">
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-emerald-400" : "bg-gray-600"}`} />
            Шууд
          </span>
          <span className="text-[10px] text-gray-500">хожлууд</span>
        </div>
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-hidden">
          <AnimatePresence initial={false}>
            {drops.map((d) => {
              const r = RARITY[d.item.rarity as RarityKey];
              return (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, x: -40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                >
                  <Link
                    href={`/case/${d.caseSlug}`}
                    className="flex w-44 shrink-0 items-center gap-2 rounded-lg border border-line bg-panel2 p-1.5 pr-2"
                    style={{ borderBottom: `2px solid ${r.color}`, boxShadow: `inset 0 -12px 20px -16px ${r.color}` }}
                    title={`${d.userName} – ${d.caseName}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.item.image} alt="" className="h-9 w-9 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-semibold text-white">{d.item.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <span className="truncate">{d.userName}</span>
                        {d.isDemo && <span className="rounded bg-amber-500/20 px-1 font-bold text-amber-400">DEMO</span>}
                      </div>
                      <div className="text-[10px] font-bold" style={{ color: r.color }}>
                        {mnt(d.item.value)}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {drops.length === 0 && <div className="self-center text-xs text-gray-500">Одоогоор хожил алга…</div>}
        </div>
      </div>
    </div>
  );
}
