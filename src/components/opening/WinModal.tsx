"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { RARITY } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import type { ReelItem } from "./Reel";

export function WinModal({
  item,
  fairness,
  onDeliver,
  onAgain,
  onClose,
  againLabel,
}: {
  item: ReelItem;
  fairness: { serverSeedHash: string; clientSeed: string; nonce: number; roll: number };
  onDeliver: () => void;
  onAgain: () => void;
  onClose: () => void;
  againLabel: string;
}) {
  const r = RARITY[item.rarity];

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
        className="card relative w-full max-w-md overflow-hidden p-6 text-center"
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
        <motion.div
          className="relative mx-auto my-5 aspect-square w-56"
          initial={{ rotate: -8, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.1 }}
        >
          <div className="absolute inset-0 animate-pulse rounded-full blur-2xl" style={{ background: r.glow }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.name} className="relative h-full w-full rounded-3xl object-contain" />
        </motion.div>
        <div className="text-xl font-bold text-white">{item.name}</div>
        <div className="mt-1 text-2xl font-black" style={{ color: r.color }}>
          {mnt(item.value)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onDeliver}>
            🚚 Хүргүүлж авах
          </button>
          <button className="btn-primary" onClick={onAgain}>
            🔁 {againLabel}
          </button>
        </div>
        <details className="mt-4 text-left text-[11px] text-gray-500">
          <summary className="cursor-pointer">Шударга байдлын мэдээлэл</summary>
          <div className="mt-2 space-y-1 break-all font-mono">
            <div>Server seed hash: {fairness.serverSeedHash}</div>
            <div>Client seed: {fairness.clientSeed}</div>
            <div>Nonce: {fairness.nonce}</div>
            <div>Roll: {fairness.roll} / 100000</div>
          </div>
        </details>
      </motion.div>
    </motion.div>
  );
}
