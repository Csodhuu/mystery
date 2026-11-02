"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { emitBalance } from "@/components/Balance";
import { mnt } from "@/lib/format";

type Invoice = { id: string; amount: number; qrImage: string; urls: { name: string; link: string }[]; autoSucceedMs: number | null };

const PRESETS = [10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

export function TopUp({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState(50_000);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<"PENDING" | "PAID" | "FAILED" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const poll = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = () => clearInterval(poll.current);
  useEffect(() => stop, []);

  const finish = (s: "PAID" | "FAILED", balance?: number) => {
    stop();
    setStatus(s);
    if (balance !== undefined) emitBalance(balance);
    router.refresh();
  };

  const start = async () => {
    setErr(null);
    const r = await fetch("/api/payments/topup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.message);
    setInv(d);
    setStatus("PENDING");
    const t0 = Date.now();
    poll.current = setInterval(async () => {
      if (d.autoSucceedMs) setLeft(Math.max(0, Math.ceil((d.autoSucceedMs - (Date.now() - t0)) / 1000)));
      const s = await fetch(`/api/payments/${d.id}`).then((x) => x.json());
      if (s.status !== "PENDING") finish(s.status, s.balance);
    }, 1000);
    if (d.autoSucceedMs) setLeft(Math.ceil(d.autoSucceedMs / 1000));
  };

  const simulate = async (action: "PAID" | "FAILED") => {
    if (!inv) return;
    const r = await fetch("/api/dev/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, paymentId: inv.id }) });
    const d = await r.json();
    if (r.ok) finish(d.status, d.balance);
  };

  return (
    <div className="card p-6">
      <h2 className="font-bold text-white">Хэтэвч цэнэглэх · QPay</h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button key={p} className={`btn-ghost ${amount === p ? "!border-neon text-neon" : ""}`} onClick={() => setAmount(p)}>
            {mnt(p)}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <label className="label">Дүн (₮)</label>
        <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} />
      </div>
      <button className="btn-primary mt-4 w-full" onClick={start}>
        Цэнэглэх
      </button>
      {err && <p className="mt-3 text-sm font-semibold text-rose-400">{err}</p>}

      {inv && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur" onClick={() => status !== "PENDING" && (setInv(null), stop())}>
          <div className="card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">QPay төлбөр · {mnt(inv.amount)}</h3>
            {status === "PENDING" && (
              <>
                <p className="muted mt-1">Банкны аппаараа QR кодыг уншуулна уу</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inv.qrImage} alt="QPay QR" className="mx-auto mt-4 w-56 rounded-xl" />
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {inv.urls.map((u) => (
                    <span key={u.name} className="rounded-md bg-panel2 px-2 py-1 text-[11px] text-gray-300">
                      {u.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-400">
                  <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" /> Төлбөр хүлээж байна{inv.autoSucceedMs ? ` · ${left}с` : ""}
                </p>
                {demo && (
                  <div className="mt-4 rounded-xl border border-dashed border-amber-500/50 p-3">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">Dev panel · callback simulate</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn bg-emerald-600 text-white" onClick={() => simulate("PAID")}>
                        Амжилттай
                      </button>
                      <button className="btn-danger" onClick={() => simulate("FAILED")}>
                        Амжилтгүй
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {status === "PAID" && (
              <div className="py-6">
                <div className="text-5xl">✅</div>
                <p className="mt-3 font-bold text-emerald-400">Амжилттай цэнэглэгдлээ!</p>
              </div>
            )}
            {status === "FAILED" && (
              <div className="py-6">
                <div className="text-5xl">❌</div>
                <p className="mt-3 font-bold text-rose-400">Төлбөр амжилтгүй боллоо</p>
              </div>
            )}
            {status !== "PENDING" && (
              <button className="btn-ghost mt-2 w-full" onClick={() => setInv(null)}>
                Хаах
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
