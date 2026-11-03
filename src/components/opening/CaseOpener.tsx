"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { BoxAnimation } from "./BoxAnimation";
import { LIGHTNING_DURATION, DURATION, Reel, type ReelItem } from "./Reel";
import { ItemCard } from "../ItemCard";
import { Mascot, pickLine, type Mood } from "../Mascot";
import { WinModal } from "./WinModal";
import { sfx } from "./sfx";
import { emitBalance } from "../Balance";
import { RARITY } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import type { OpenMode } from "@/lib/modes";

type OpenResult = {
  openingId: string;
  orderId: string;
  item: ReelItem;
  reel: { ids: string[]; winIndex: number; offset: number };
  balance: number;
  fairness: { serverSeedHash: string; clientSeed: string; nonce: number; roll: number };
};

type Phase = "idle" | "box" | "reel" | "won";

const COUNTS = [1, 2, 3] as const;
const PREFS_KEY = "opener-prefs";

const MODE_INFO: Record<OpenMode, { icon: string; label: string; hint: string }> = {
  normal: { icon: "🎁", label: "Энгийн", hint: "Хайрцгийн үндсэн магадлал" },
  jester: { icon: "🃏", label: "Jester", hint: "Бүх бараа ижил магадлалтай, үнэ нь өснө" },
  boost: { icon: "🚀", label: "Boost", hint: "Үнэ ×2, хайрцгийн үнээс үнэтэй барааны магадлал ×2" },
};

type Prefs = { count: number; mode: OpenMode; lightning: boolean };
type DisplayItem = ReelItem & { stock: number };

function loadPrefs(): Prefs {
  const fallback: Prefs = { count: 1, mode: "normal", lightning: false };
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (!p) return fallback;
    return {
      count: [1, 2, 3].includes(p.count) ? p.count : 1,
      mode: p.mode in MODE_INFO ? p.mode : "normal",
      lightning: !!p.lightning,
    };
  } catch {
    return fallback;
  }
}

export function CaseOpener({
  slug,
  modes,
  color,
  image,
  items,
  loggedIn,
  balance,
  outOfStock,
  fairness,
  display,
}: {
  slug: string;
  modes: Record<OpenMode, { price: number; weights: Record<string, number> }>;
  color: string;
  image: string;
  items: ReelItem[];
  loggedIn: boolean;
  balance: number;
  outOfStock: boolean;
  fairness: { hash: string; clientSeed: string; nonce: number } | null;
  display: DisplayItem[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<OpenResult[] | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ count: 1, mode: "normal", lightning: false });
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => (typeof window === "undefined" ? false : sfx().muted));
  const [bal, setBal] = useState(balance);
  const [seedInfo, setSeedInfo] = useState(fairness);
  const boxDone = useRef(false);
  const pending = useRef<OpenResult[] | null>(null);
  const reelsDone = useRef(0);
  const busy = phase === "box" || phase === "reel";
  const { count, mode, lightning } = prefs;
  const price = modes[mode].price;

  // Тарваа reacts to each stage; on a win, to how good the batch was for the price paid.
  const mood: Mood = useMemo(() => {
    if (phase === "box") return "excited";
    if (phase === "reel") return "nervous";
    if (phase === "won" && results) {
      const won = results.reduce((s, r) => s + r.item.value, 0);
      const paid = price * results.length;
      if (results.some((r) => RARITY[r.item.rarity].rank >= 4) || won >= paid * 5) return "ecstatic";
      return won >= paid ? "happy" : "sad";
    }
    return "idle";
  }, [phase, results, price]);
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    setLine(pickLine(mood));
    if (mood !== "idle") return;
    const t = setTimeout(() => setLine(null), 5000);
    return () => clearTimeout(t);
  }, [mood]);

  useEffect(() => setPrefs(loadPrefs()), []);
  const updatePrefs = (p: Partial<Prefs>) =>
    setPrefs((cur) => {
      const next = { ...cur, ...p };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);

  const maybeStartReel = () => {
    if (boxDone.current && pending.current) {
      reelsDone.current = 0;
      setResults(pending.current);
      setPhase("reel");
    }
  };

  const open = async () => {
    if (!loggedIn) return router.push(`/login?next=/case/${slug}`);
    if (busy) return;
    setError(null);
    sfx().unlock();
    sfx().whoosh();
    // Lightning skips the box animation entirely.
    boxDone.current = lightning;
    pending.current = null;
    setResults(null);
    setPhase("box");

    // One key per click: a retried / double-sent request can never open twice.
    const key = crypto.randomUUID();
    try {
      const res = await fetch(`/api/cases/${slug}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ idempotencyKey: key, count, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Алдаа гарлаа");
      const list: OpenResult[] = data.results;
      const last = list[list.length - 1];
      pending.current = list;
      setBal(last.balance);
      emitBalance(last.balance);
      setSeedInfo((s) => (s ? { ...s, nonce: last.fairness.nonce + 1 } : s));
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
    const list = pending.current;
    if (!list || ++reelsDone.current < list.length) return;
    sfx().win(Math.max(...list.map((r) => RARITY[r.item.rarity].rank)));
    setPhase("won");
  }, []);

  const toggleMute = () => {
    sfx().setMuted(!muted);
    setMuted(!muted);
  };

  const total = price * count;
  const insufficient = loggedIn && bal < total;

  return (
    <div className="space-y-8">
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
          lightning ? (
            <div className="grid h-[340px] place-items-center text-5xl" aria-hidden>
              <span className="animate-pulse">⚡</span>
            </div>
          ) : (
            <BoxAnimation color={color} onDone={onBoxDone} />
          )
        ) : (
          results && (
            <div className="flex min-h-[340px] flex-col justify-center gap-2">
              {results.map((r, i) => (
                <Reel
                  key={r.openingId}
                  items={byId}
                  ids={r.reel.ids}
                  winIndex={r.reel.winIndex}
                  offset={r.reel.offset}
                  onDone={onReelDone}
                  duration={lightning ? LIGHTNING_DURATION : DURATION}
                  compact={results.length > 1}
                  ticks={i === 0}
                />
              ))}
            </div>
          )
        )}

        <div className="mt-2 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex rounded-xl border border-line bg-panel2 p-1" role="group" aria-label="Хэдэн хайрцаг нээх">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => updatePrefs({ count: n })}
                  disabled={busy}
                  aria-pressed={count === n}
                  className={`min-w-10 rounded-lg px-3 py-1.5 text-sm font-bold transition ${count === n ? "text-black" : "text-gray-400 hover:text-white"}`}
                  style={count === n ? { background: color } : undefined}
                >
                  x{n}
                </button>
              ))}
            </div>
            <ModeToggle on={lightning} disabled={busy} onClick={() => updatePrefs({ lightning: !lightning })} icon="⚡" label="Lightning" hint="Зөвхөн анимацыг хурдасгана" />
          </div>
          <div className="grid w-full max-w-md grid-cols-3 gap-2" role="group" aria-label="Горим">
            {(Object.keys(MODE_INFO) as OpenMode[]).map((m) => (
              <button
                key={m}
                onClick={() => updatePrefs({ mode: m })}
                disabled={busy}
                aria-pressed={mode === m}
                title={MODE_INFO[m].hint}
                className={`rounded-xl border px-2 py-2 text-sm font-bold transition ${mode === m ? "text-white" : "border-line bg-panel2 text-gray-400 hover:text-white"}`}
                style={mode === m ? { borderColor: color, background: `${color}26` } : undefined}
              >
                <div>
                  {MODE_INFO[m].icon} {MODE_INFO[m].label}
                </div>
                <div className="text-[11px] font-semibold opacity-80">{mnt(modes[m].price)}</div>
              </button>
            ))}
          </div>
          {mode !== "normal" && <p className="text-center text-xs text-gray-400">{MODE_INFO[mode].hint}</p>}
          <button
            onClick={open}
            disabled={busy || outOfStock || insufficient}
            className="btn-primary w-full max-w-xs py-4 text-lg"
            style={{ background: color, boxShadow: `0 0 40px ${color}88` }}
          >
            {busy ? "Нээж байна…" : loggedIn ? `${count > 1 ? `${count} хайрцаг нээх` : "Нээх"} · ${mnt(total)}` : "Нэвтэрч нээх"}
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

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">
          Хайрцагт байгаа бараа{mode !== "normal" && <span className="ml-2 text-sm font-semibold text-gray-400">· {MODE_INFO[mode].label} магадлал</span>}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {display.map((i) => (
            <ItemCard key={i.id} name={i.name} value={i.value} rarity={i.rarity} image={i.image} weight={modes[mode].weights[i.id]} stock={i.stock} />
          ))}
        </div>
      </section>

      <div className="pointer-events-none fixed bottom-3 right-3 z-[95] sm:bottom-6 sm:right-6">
        <Mascot mood={mood} say={line} size={84} bubble="right" className="sm:hidden" />
        <Mascot mood={mood} say={line} size={120} bubble="right" className="hidden sm:inline-flex" />
      </div>

      <AnimatePresence>
        {phase === "won" && results && (
          <WinModal
            items={results.map((r) => r.item)}
            fairness={results.map((r) => r.fairness)}
            againLabel={`Дахин нээх · ${mnt(total)}`}
            onClose={() => setPhase("idle")}
            onDeliver={() => router.push(results.length > 1 ? "/inventory" : `/inventory?deliver=${results[0].orderId}`)}
            onSell={async () => {
              const res = await fetch("/api/inventory/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: results.map((r) => r.orderId) }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message ?? "Алдаа гарлаа");
              setBal(data.balance);
              emitBalance(data.balance);
              setPhase("idle");
            }}
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

function ModeToggle({ on, disabled, onClick, icon, label, hint }: { on: boolean; disabled: boolean; onClick: () => void; icon: string; label: string; hint: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      title={hint}
      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${on ? "border-legendary bg-legendary/15 text-legendary" : "border-line bg-panel2 text-gray-400 hover:text-white"}`}
    >
      {icon} {label}
    </button>
  );
}
