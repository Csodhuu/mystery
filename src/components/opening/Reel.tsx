"use client";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RARITY, type RarityKey } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import { sfx } from "./sfx";

export type ReelItem = { id: string; name: string; value: number; rarity: RarityKey; image: string };

export const DURATION = 6.6;
export const LIGHTNING_DURATION = 1.8;
/** Strong ease-out: fast start, long deceleration. */
const EASE: [number, number, number, number] = [0.08, 0.82, 0.17, 1];

export function Reel({
  items,
  ids,
  winIndex,
  offset,
  onDone,
  duration = DURATION,
  compact = false,
  ticks = true,
}: {
  items: Record<string, ReelItem>;
  ids: string[];
  winIndex: number;
  /** fraction of a card width (-0.42..0.42) – where under the marker the reel stops */
  offset: number;
  onDone: () => void;
  duration?: number;
  /** Smaller cards for stacked multi-open reels */
  compact?: boolean;
  /** Only one of several simultaneous reels should play tick sounds */
  ticks?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [dims, setDims] = useState<{ w: number; card: number } | null>(null);
  const [landed, setLanded] = useState(false);

  useLayoutEffect(() => {
    const w = wrap.current?.clientWidth ?? 800;
    setDims({ w, card: compact ? (w < 520 ? 76 : 104) : w < 520 ? 104 : 148 });
  }, [compact]);

  useEffect(() => {
    if (!dims) return;
    const gap = 8;
    const step = dims.card + gap;
    const center = dims.w / 2;
    const target = -(winIndex * step + dims.card / 2 + offset * dims.card) + center;
    let lastIdx = -1;
    const onUpdate = (v: number) => {
      const idx = Math.floor((center - v) / step);
      if (idx !== lastIdx) {
        lastIdx = idx;
        if (ticks) sfx().tick();
      }
    };
    x.set(center - dims.card * 2); // start with a few cards visible right of the marker
    const controls = animate(x, target, {
      duration,
      ease: EASE,
      onUpdate,
      onComplete: () => {
        setLanded(true);
        setTimeout(onDone, 450);
      },
    });
    return () => controls.stop();
  }, [dims, winIndex, offset, onDone, x, duration, ticks]);

  return (
    <div
      ref={wrap}
      className={`relative overflow-hidden rounded-2xl border border-line bg-black/40 ${compact ? "h-[110px] sm:h-[150px]" : "h-[200px] sm:h-[230px]"}`}
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg to-transparent sm:w-32" />
      {/* center marker */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 -translate-x-1/2">
        <div className="absolute -top-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-legendary" />
        <div className="h-full w-[3px] bg-legendary shadow-[0_0_16px_4px_rgba(245,158,11,.7)]" />
        <div className="absolute -bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[14px] border-x-transparent border-b-legendary" />
      </div>
      {dims && (
        <motion.div className="absolute inset-y-0 left-0 flex items-center gap-2 will-change-transform" style={{ x }}>
          {ids.map((id, i) => {
            const it = items[id];
            const r = RARITY[it.rarity];
            const win = landed && i === winIndex;
            return (
              <div
                key={i}
                className="relative flex shrink-0 flex-col overflow-hidden rounded-xl border bg-panel2 transition-all duration-300"
                style={{
                  width: dims.card,
                  height: dims.card * 1.22,
                  borderTopColor: win ? r.color : "#232739",
                  borderLeftColor: win ? r.color : "#232739",
                  borderRightColor: win ? r.color : "#232739",
                  borderBottom: `4px solid ${r.color}`,
                  boxShadow: win ? `0 0 40px 6px ${r.glow}` : `inset 0 -30px 40px -30px ${r.color}`,
                  opacity: landed && !win ? 0.35 : 1,
                  transform: win ? "scale(1.06)" : undefined,
                }}
              >
                <div className="flex-1" style={{ background: `radial-gradient(circle at 50% 60%, ${r.glow}, transparent 70%)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" className="h-full w-full rounded-lg object-cover p-1.5" draggable={false} />
                </div>
                <div className="px-2 pb-2">
                  <div className={`truncate font-semibold text-white ${compact ? "text-[10px]" : "text-[11px]"}`}>{it.name}</div>
                  <div className="text-[11px] font-bold" style={{ color: r.color }}>
                    {mnt(it.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
