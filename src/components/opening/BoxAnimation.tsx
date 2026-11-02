"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";

const S = 150;

/** ~1.5s: the 3D box shakes, the lid swings open and light bursts out. */
export function BoxAnimation({ color, onDone }: { color: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1550);
    return () => clearTimeout(t);
  }, [onDone]);

  const face = (transform: string, shade = 1) => (
    <div
      className="absolute inset-0 rounded-md border-2"
      style={{
        transform,
        borderColor: color,
        background: `linear-gradient(160deg, ${color}${shade > 0.8 ? "cc" : "88"}, #0b0d14 120%)`,
        boxShadow: `inset 0 0 30px ${color}66`,
        backfaceVisibility: "visible",
      }}
    >
      <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2" style={{ background: `${color}`, opacity: 0.6 }} />
    </div>
  );

  return (
    <div className="relative grid h-[340px] place-items-center overflow-hidden" style={{ perspective: 900 }}>
      {/* light rays */}
      <motion.div
        className="pointer-events-none absolute h-[600px] w-[600px] rounded-full"
        style={{ maskImage: "radial-gradient(circle, #000 15%, transparent 55%)", WebkitMaskImage: "radial-gradient(circle, #000 15%, transparent 55%)", background: `conic-gradient(from 0deg, transparent, ${color}66, transparent 20%, ${color}55, transparent 40%, ${color}66, transparent 60%, ${color}55, transparent 80%, ${color}66, transparent)` }}
        initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
        animate={{ opacity: [0, 0, 0.9, 0.7], scale: [0.2, 0.2, 1, 1.2], rotate: 60 }}
        transition={{ duration: 1.5, times: [0, 0.55, 0.8, 1], ease: "easeOut" }}
      />
      <motion.div
        className="pointer-events-none absolute h-72 w-72 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, #fff, ${color} 40%, transparent 70%)` }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0, 1, 0.85], scale: [0.3, 0.3, 1.6, 2.2] }}
        transition={{ duration: 1.5, times: [0, 0.55, 0.8, 1] }}
      />
      <motion.div
        animate={{ rotateZ: [0, -5, 5, -7, 7, -4, 4, 0, 0], y: [0, -4, 0, -6, 0, -3, 0, -10, -10], scale: [1, 1, 1, 1, 1, 1, 1, 1.05, 1.05] }}
        transition={{ duration: 1.5, times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.6, 1] }}
        className="preserve-3d"
      >
        <div className="preserve-3d relative" style={{ width: S, height: S, transform: "rotateX(-22deg) rotateY(-32deg)" }}>
          {face(`translateZ(${S / 2}px)`)}
          {face(`rotateY(180deg) translateZ(${S / 2}px)`, 0.6)}
          {face(`rotateY(-90deg) translateZ(${S / 2}px)`, 0.7)}
          {face(`rotateY(90deg) translateZ(${S / 2}px)`, 0.7)}
          {face(`rotateX(-90deg) translateZ(${S / 2}px)`, 0.5)}
          {/* inner glow visible once the lid opens */}
          <motion.div
            className="absolute inset-0"
            style={{ transform: `rotateX(90deg) translateZ(${S / 2 - 6}px)`, background: `radial-gradient(circle, #fff, ${color} 50%, transparent 75%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1] }}
            transition={{ duration: 1.2, times: [0, 0.6, 1] }}
          />
          {/* lid hinged on the back-top edge */}
          <div className="preserve-3d absolute left-0 top-0" style={{ width: S, height: 0, transform: `translateZ(${-S / 2}px)` }}>
            <motion.div
              className="absolute left-[-4px] top-0 rounded-md border-2"
              style={{
                width: S + 8,
                height: S + 8,
                transformOrigin: "top center",
                borderColor: color,
                background: `linear-gradient(200deg, ${color}, #0b0d14 130%)`,
                boxShadow: `0 0 40px ${color}`,
              }}
              initial={{ rotateX: 90 }}
              animate={{ rotateX: [90, 90, 96, 90, 215] }}
              transition={{ duration: 1.35, times: [0, 0.3, 0.42, 0.5, 0.8], ease: "easeOut" }}
            >
              <div className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 opacity-60" style={{ background: color }} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
