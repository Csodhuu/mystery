"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { BoxAnimation } from "./BoxAnimation";
import { Reel, type ReelItem } from "./Reel";
import { WinModal } from "./WinModal";
import { sfx } from "./sfx";
import { emitBalance } from "../Balance";
import { RARITY } from "@/lib/rarity";
import { mnt } from "@/lib/format";

type OpenResult = {
  openingId: string;
  orderId: string;
  item: ReelItem;
  reel: { ids: string[]; winIndex: number; offset: number };
  balance: number;
  fairness: { serverSeedHash: string; clientSeed: string; nonce: number; roll: number };
};

type Phase = "idle" | "box" | "reel" | "won";

export function CaseOpener({
  slug,
  price,
  color,
  image,
  items,
  loggedIn,
  balance,
  outOfStock,
  fairness,
}: {
  slug: string;
  price: number;
  color: string;
  image: string;
  items: ReelItem[];
  loggedIn: boolean;
  balance: number;
  outOfStock: boolean;
  fairness: { hash: string; clientSeed: string; nonce: number } | null;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<OpenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => (typeof window === "undefined" ? false : sfx().muted));
  const [bal, setBal] = useState(balance);
  const [seedInfo, setSeedInfo] = useState(fairness);
  const boxDone = useRef(false);
  const pending = useRef<OpenResult | null>(null);
  const busy = phase === "box" || phase === "reel";

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const maybeStartReel = () => {
    if (boxDone.current && pending.current) {
      setResult(pending.current);
      setPhase("reel");
    }
  };

  const open = async () => {
    if (!loggedIn) return router.push(`/login?next=/case/${slug}`);
    if (busy) return;
    setError(null);
    sfx().unlock();
    sfx().whoosh();
    boxDone.current = false;
    pending.current = null;
    setResult(null);
    setPhase("box");

    // One key per click: a retried / double-sent request can never open twice.
    const key = crypto.randomUUID();
    try {
      const res = await fetch(`/api/cases/${slug}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ idempotencyKey: key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Алдаа гарлаа");
      pending.current = data;
      setBal(data.balance);
      emitBalance(data.balance);
      setSeedInfo((s) => (s ? { ...s, nonce: data.fairness.nonce + 1 } : s));
      maybeStartReel();
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  };

  const onBoxDone = useCallback(() => {
    boxDone.current = true;
    maybeStartReel();
  }, []);

  const onReelDone = useCallback(() => {
    if (pending.current) sfx().win(RARITY[pending.current.item.rarity].rank);
    setPhase("won");
  }, []);

  const toggleMute = () => {
    sfx().setMuted(!muted);
    setMuted(!muted);
  };

  const insufficient = loggedIn && bal < price;

  return (
    <div className="space-y-4">
      <div className="card relative overflow-hidden p-4 sm:p-6" style={{ boxShadow: `0 30px 80px -40px ${color}` }}>
        <button
          onClick={toggleMute}
          className="absolute right-3 top-3 z-30 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-sm"
          title={muted ? "Дуу асаах" : "Дуу хаах"}
          aria-label={muted ? "Дуу асаах" : "Дуу хаах"}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {phase === "idle" || phase === "won" ? (
          <div className="grid h-[340px] place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-64 w-64 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_40px_rgba(255,255,255,.08)]" />
          </div>
        ) : phase === "box" ? (
          <BoxAnimation color={color} onDone={onBoxDone} />
        ) : (
          result && (
            <div className="grid h-[340px] items-center">
              <Reel items={byId} ids={result.reel.ids} winIndex={result.reel.winIndex} offset={result.reel.offset} onDone={onReelDone} />
            </div>
          )
        )}

        <div className="mt-2 flex flex-col items-center gap-3">
          <button
            onClick={open}
            disabled={busy || outOfStock || insufficient}
            className="btn-primary w-full max-w-xs py-4 text-lg"
            style={{ background: color, boxShadow: `0 0 40px ${color}88` }}
          >
            {busy ? "Нээж байна…" : loggedIn ? `Нээх · ${mnt(price)}` : "Нэвтэрч нээх"}
          </button>
          {outOfStock && <p className="text-sm font-semibold text-rose-400">Зарим бараа дууссан тул түр нээх боломжгүй.</p>}
          {insufficient && !busy && (
            <p className="text-sm text-amber-400">
              Үлдэгдэл хүрэлцэхгүй.{" "}
              <Link href="/wallet" className="font-bold underline">
                Хэтэвч цэнэглэх →
              </Link>
            </p>
          )}
          {error && <p className="text-sm font-semibold text-rose-400">{error}</p>}
          {seedInfo && (
            <div className="w-full max-w-xl text-center font-mono text-[10px] leading-relaxed text-gray-500">
              <div className="truncate">Server seed hash: {seedInfo.hash}</div>
              <div>
                Client seed: {seedInfo.clientSeed} · Дараагийн nonce: {seedInfo.nonce} ·{" "}
                <Link href="/fairness" className="text-neon">
                  Өөрчлөх
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {phase === "won" && result && (
          <WinModal
            item={result.item}
            fairness={result.fairness}
            againLabel={`Дахин нээх · ${mnt(price)}`}
            onClose={() => setPhase("idle")}
            onDeliver={() => router.push(`/inventory?deliver=${result.orderId}`)}
            onAgain={() => {
              setPhase("idle");
              setTimeout(open, 50);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
