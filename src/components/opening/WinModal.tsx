"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { RARITY } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import type { ReelItem } from "./Reel";

type Fairness = { serverSeedHash: string; clientSeed: string; nonce: number; roll: number };

export function WinModal({
  items,
  fairness,
  onDeliver,
  onSell,
  onAgain,
  onClose,
  againLabel,
}: {
  items: ReelItem[];
  fairness: Fairness[];
  onDeliver: () => void;
  /** Sell every item of this batch back for balance */
  onSell: () => Promise<void>;
  onAgain: () => void;
  onClose: () => void;
  againLabel: string;
}) {
  // Celebrate the best drop of the batch.
  const item = items.reduce((a, b) => (RARITY[b.rarity].rank > RARITY[a.rarity].rank || (b.rarity === a.rarity && b.value > a.value) ? b : a));
  const r = RARITY[item.rarity];
  const multi = items.length > 1;
  const [selling, setSelling] = useState(false);
  const [sellErr, setSellErr] = useState<string | null>(null);
  const sell = async () => {
    setSelling(true);
    setSellErr(null);
    try {
      await onSell();
    } catch (e) {
      setSellErr((e as Error).message);
      setSelling(false);
    }
  };

  useEffect(() => {
    if (r.rank < 2) return;
    const colors = [r.color, "#ffffff", "#22d3ee"];
    const burst = (x: number) => confetti({ particleCount: 60 + r.rank * 40, spread: 70 + r.rank * 10, origin: { x, y: 0.55 }, colors, zIndex: 200 });
    burst(0.3);
    burst(0.7);
    const t = r.rank >= 4 ? setInterval(() => burst(Math.random()), 400) : undefined;
    const stop = setTimeout(() => t && clearInterval(t), 2500);
    return () => {
      if (t) clearInterval(t);
      clearTimeout(stop);
    };
  }, [r]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div
        className={`card relative max-h-[90vh] w-full overflow-y-auto p-6 text-center ${multi ? "max-w-xl" : "max-w-md"}`}
        style={{ borderColor: r.color, boxShadow: `0 0 80px -10px ${r.glow}` }}
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="absolute right-3 top-3 text-gray-500 hover:text-white" onClick={onClose} aria-label="Хаах">
          ✕
        </button>
        <div className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: r.color }}>
          {r.label}
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">Баяр хүргэе! 🎉</h2>
        {multi ? (
          <>
            <div className="my-5 grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
              {items.map((it, i) => {
                const ri = RARITY[it.rarity];
                return (
                  <motion.div
                    key={i}
                    className="rounded-2xl border bg-panel2 p-2"
                    style={{ borderColor: ri.color, boxShadow: `0 0 30px -8px ${ri.glow}` }}
                    initial={{ scale: 0.6, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.08 * i }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.name} className="aspect-square w-full rounded-xl object-cover" />
                    <div className="truncate text-xs font-bold text-white">{it.name}</div>
                    <div className="text-xs font-black" style={{ color: ri.color }}>
                      {mnt(it.value)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="text-sm text-gray-400">Нийт үнэ цэнэ</div>
            <div className="text-2xl font-black text-white">{mnt(items.reduce((s, it) => s + it.value, 0))}</div>
          </>
        ) : (
          <>
            <motion.div
              className="relative mx-auto my-5 aspect-square w-56"
              initial={{ rotate: -8, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
            >
              <div className="absolute inset-0 animate-pulse rounded-full blur-2xl" style={{ background: r.glow }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="relative h-full w-full rounded-3xl object-cover shadow-2xl" />
            </motion.div>
            <div className="text-xl font-bold text-white">{item.name}</div>
            <div className="mt-1 text-2xl font-black" style={{ color: r.color }}>
              {mnt(item.value)}
            </div>
          </>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onDeliver}>
            🚚 Хүргүүлж авах
          </button>
          <button className="btn-ghost" onClick={sell} disabled={selling}>
            💰 Зарах · {mnt(items.reduce((s, it) => s + it.value, 0))}
          </button>
          <button className="btn-primary col-span-2" onClick={onAgain}>
            🔁 {againLabel}
          </button>
        </div>
        {sellErr && <p className="mt-2 text-sm font-semibold text-rose-400">{sellErr}</p>}
        <details className="mt-4 text-left text-[11px] text-gray-500">
          <summary className="cursor-pointer">Шударга байдлын мэдээлэл</summary>
          {fairness.map((f, i) => (
            <div key={i} className="mt-2 space-y-1 break-all font-mono">
              {multi && <div className="font-bold text-gray-400">#{i + 1}</div>}
              <div>Server seed hash: {f.serverSeedHash}</div>
              <div>Client seed: {f.clientSeed}</div>
              <div>Nonce: {f.nonce}</div>
              <div>Roll: {f.roll} / 100000</div>
            </div>
          ))}
        </details>
      </motion.div>
    </motion.div>
  );
}
