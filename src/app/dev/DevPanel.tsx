"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { emitBalance } from "@/components/Balance";
import { RARITY, type RarityKey } from "@/lib/rarity";
import { dateTime, mnt } from "@/lib/format";

type SimRow = { id: string; name: string; rarity: RarityKey; value: number; configured: number; actual: number; count: number };
type Sim = { n: number; ms: number; rows: SimRow[]; configuredRtp: number; actualRtp: number };

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message);
  return d;
}

export function DevPanel({
  me,
  users,
  cases,
  pending,
}: {
  me: { name: string; phone: string; balance: number; isDemo: boolean } | null;
  users: { id: string; name: string; phone: string; balance: number }[];
  cases: { slug: string; name: string }[];
  pending: { id: string; amount: number; createdAt: string }[];
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [amount, setAmount] = useState(100_000);
  const [filter, setFilter] = useState("");
  const [slug, setSlug] = useState(cases[0]?.slug ?? "");
  const [sim, setSim] = useState<Sim | null>(null);
  const [simBusy, setSimBusy] = useState(false);

  const run = async (fn: () => Promise<string | void>) => {
    setMsg(null);
    try {
      const m = await fn();
      if (m) setMsg(m);
      router.refresh();
    } catch (e) {
      setMsg("⚠️ " + (e as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <section className="card space-y-3 p-5">
          <h2 className="font-bold text-white">Одоогийн хэрэглэгч</h2>
          {me ? (
            <p className="text-sm text-gray-300">
              {me.name} · {me.phone} {me.isDemo && <span className="rounded bg-amber-500/20 px-1 text-xs font-bold text-amber-400">ТЕСТ</span>} ·{" "}
              <b className="text-neon">{mnt(me.balance)}</b>
            </p>
          ) : (
            <p className="muted">Нэвтрээгүй байна. Доороос demo хэрэглэгчээр нэвтэрнэ үү.</p>
          )}
          <div className="flex gap-2">
            <input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)} />
            <button
              className="btn-primary whitespace-nowrap"
              disabled={!me}
              onClick={() =>
                run(async () => {
                  const d = await post("/api/dev/balance", { amount });
                  emitBalance(d.balance);
                  return `✓ ${mnt(amount)} нэмэгдлээ`;
                })
              }
            >
              Үлдэгдэл нэмэх
            </button>
          </div>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-bold text-white">QPay callback simulate</h2>
          <div className="flex gap-2">
            <button
              className="btn-ghost"
              disabled={!me}
              onClick={() =>
                run(async () => {
                  await post("/api/dev/payment", { action: "create", amount: 50_000 });
                  return "✓ Хүлээгдэж буй 50,000₮ нэхэмжлэх үүслээ (автомат төлөгдөхгүй)";
                })
              }
            >
              + Хүлээгдэж буй нэхэмжлэх үүсгэх
            </button>
          </div>
          {pending.length === 0 && <p className="muted">Хүлээгдэж буй төлбөр алга.</p>}
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-panel2 p-2 text-sm">
                <span>
                  {mnt(p.amount)} <span className="text-xs text-gray-500">{dateTime(p.createdAt)}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    className="btn bg-emerald-600 px-3 py-1.5 text-white"
                    onClick={() =>
                      run(async () => {
                        const d = await post("/api/dev/payment", { action: "PAID", paymentId: p.id });
                        emitBalance(d.balance);
                        return "✓ Амжилттай callback";
                      })
                    }
                  >
                    Амжилттай
                  </button>
                  <button className="btn-danger px-3 py-1.5" onClick={() => run(async () => (await post("/api/dev/payment", { action: "FAILED", paymentId: p.id }), "✓ Амжилтгүй callback"))}>
                    Амжилтгүй
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold text-white">Demo хэрэглэгчээр нэвтрэх</h2>
          <input className="input mb-3" placeholder="Хайх…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
            {users
              .filter((u) => (u.name + u.phone).toLowerCase().includes(filter.toLowerCase()))
              .map((u) => (
                <button
                  key={u.id}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-panel2"
                  onClick={() => run(async () => (await post("/api/dev/login-as", { userId: u.id }), `✓ ${u.name}-ээр нэвтэрлээ`))}
                >
                  <span>
                    {u.name} <span className="font-mono text-xs text-gray-500">{u.phone}</span>
                  </span>
                  <span className="text-xs text-neon">{mnt(u.balance)}</span>
                </button>
              ))}
          </div>
        </section>
      </div>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-white">Симуляц: бодит vs тохируулсан магадлал</h2>
        <div className="flex gap-2">
          <select className="input" value={slug} onChange={(e) => setSlug(e.target.value)}>
            {cases.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            className="btn-primary whitespace-nowrap"
            disabled={simBusy}
            onClick={async () => {
              setSimBusy(true);
              try {
                setSim(await post("/api/dev/simulate", { slug, n: 10_000 }));
              } catch (e) {
                setMsg("⚠️ " + (e as Error).message);
              } finally {
                setSimBusy(false);
              }
            }}
          >
            {simBusy ? "…" : "10,000 нээлт"}
          </button>
        </div>
        {sim && (
          <>
            <p className="text-sm text-gray-400">
              {sim.n.toLocaleString()} нээлт · {sim.ms}ms · RTP тохируулсан <b className="text-white">{sim.configuredRtp.toFixed(2)}%</b> / бодит{" "}
              <b className="text-neon">{sim.actualRtp.toFixed(2)}%</b>
            </p>
            <div className="overflow-x-auto">
              <table className="table-base text-xs">
                <thead>
                  <tr>
                    <th>Бараа</th>
                    <th className="text-right">Тохируулсан</th>
                    <th className="text-right">Бодит</th>
                    <th className="text-right">Тоо</th>
                    <th className="w-32" />
                  </tr>
                </thead>
                <tbody>
                  {sim.rows.map((r) => {
                    const max = Math.max(...sim.rows.map((x) => Math.max(x.configured, x.actual)));
                    return (
                      <tr key={r.id}>
                        <td style={{ color: RARITY[r.rarity].color }}>{r.name}</td>
                        <td className="text-right font-mono">{r.configured.toFixed(3)}%</td>
                        <td className="text-right font-mono text-white">{r.actual.toFixed(3)}%</td>
                        <td className="text-right font-mono text-gray-500">{r.count}</td>
                        <td>
                          <div className="relative h-3 rounded bg-panel2">
                            <div className="absolute inset-y-0 left-0 rounded bg-gray-600" style={{ width: `${(r.configured / max) * 100}%` }} />
                            <div className="absolute inset-y-[3px] left-0 rounded" style={{ width: `${(r.actual / max) * 100}%`, background: RARITY[r.rarity].color }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      {msg && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-panel2 px-4 py-3 text-sm shadow-xl">{msg}</div>}
    </div>
  );
}
