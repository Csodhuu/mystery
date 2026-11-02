"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RARITIES, RARITY, type RarityKey } from "@/lib/rarity";
import { mnt } from "@/lib/format";
import { WEIGHT_TOTAL } from "@/lib/fairness-browser";
import { uploadImage } from "../upload";

type Kase = { id: string; name: string; slug: string; price: number; description: string; color: string; image: string; isActive: boolean; sortOrder: number };
type Item = { id: string; name: string; value: number; rarity: RarityKey; weight: number; stock: number; image: string };

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message);
  return d;
}

const toWeight = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 1000) : NaN;
};

export function CaseEditor({ kase, items: initial }: { kase: Kase; items: Item[] }) {
  const router = useRouter();
  const [c, setC] = useState(kase);
  const [items, setItems] = useState(initial);
  const [pcts, setPcts] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((i) => [i.id, String(i.weight / 1000)])));
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newItem, setNewItem] = useState({ name: "", value: 10_000, rarity: "COMMON" as RarityKey, stock: 100, image: "/generated/items/starter-1.svg" });

  const run = async (fn: () => Promise<string>) => {
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  const stats = useMemo(() => {
    const weights = items.map((i) => toWeight(pcts[i.id] ?? "0"));
    const valid = weights.every((w) => Number.isInteger(w) && w >= 0);
    const total = weights.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
    const ev = items.reduce((s, i, k) => s + (i.value * (weights[k] || 0)) / WEIGHT_TOTAL, 0);
    return { weights, valid, total, ev, rtp: c.price ? (ev / c.price) * 100 : 0 };
  }, [items, pcts, c.price]);
  const sumOk = stats.valid && stats.total === WEIGHT_TOTAL;
  const pctsChanged = items.some((i, k) => stats.weights[k] !== i.weight);

  const setItem = (id: string, patch: Partial<Item>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setDirty((d) => ({ ...d, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Case fields */}
      <section className="card grid gap-3 p-5 md:grid-cols-4">
        <div className="flex items-center gap-3 md:col-span-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image} alt="" className="h-14 w-14" />
          <h1 className="h1">{c.name}</h1>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-cyan-400" checked={c.isActive} onChange={(e) => setC({ ...c, isActive: e.target.checked })} />
            Идэвхтэй
          </label>
        </div>
        <div>
          <label className="label">Нэр</label>
          <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input font-mono" value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value })} />
        </div>
        <div>
          <label className="label">Үнэ (₮)</label>
          <input className="input" inputMode="numeric" value={c.price} onChange={(e) => setC({ ...c, price: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
        </div>
        <div>
          <label className="label">Өнгө / эрэмбэ</label>
          <div className="flex gap-2">
            <input className="input h-[42px] w-16 p-1" type="color" value={c.color} onChange={(e) => setC({ ...c, color: e.target.value })} />
            <input className="input" inputMode="numeric" value={c.sortOrder} onChange={(e) => setC({ ...c, sortOrder: Number(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label">Тайлбар</label>
          <input className="input" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Зураг</label>
          <div className="flex gap-2">
            <input className="input font-mono text-xs" value={c.image} onChange={(e) => setC({ ...c, image: e.target.value })} />
            <UploadButton onUrl={(url) => setC({ ...c, image: url })} onError={(t) => setMsg({ ok: false, text: t })} />
          </div>
        </div>
        <div className="flex gap-2 md:col-span-4">
          <button className="btn-primary" onClick={() => run(async () => (await call(`/api/admin/cases/${c.id}`, "PATCH", c), "Хайрцаг хадгалагдлаа"))}>
            Хайрцаг хадгалах
          </button>
          <button
            className="btn-danger ml-auto"
            onClick={() => {
              if (!confirm("Устгах уу? Түүхтэй хайрцгийг идэвхгүй болгоно.")) return;
              void run(async () => {
                const d = await call(`/api/admin/cases/${c.id}`, "DELETE");
                if (d.deleted) router.push("/admin/cases");
                else setC({ ...c, isActive: false });
                return d.deleted ? "Устгалаа" : "Түүхтэй тул идэвхгүй болголоо";
              });
            }}
          >
            Устгах
          </button>
        </div>
      </section>

      {/* Probability editor */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line p-4">
          <h2 className="font-bold text-white">Бараа ба магадлал</h2>
          <div className={`text-sm font-bold ${sumOk ? "text-emerald-400" : "text-rose-400"}`}>
            Нийлбэр: {(stats.total / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })}% {sumOk ? "✓" : `(${((WEIGHT_TOTAL - stats.total) / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })}% дутуу/илүү)`}
          </div>
          <div className="text-sm text-gray-300">
            EV: <b className="text-white">{mnt(stats.ev)}</b>
          </div>
          <div className="text-sm text-gray-300">
            RTP: <b className="text-white">{stats.rtp.toFixed(2)}%</b>
          </div>
          <div className="text-sm text-gray-300">
            House margin: <b className={100 - stats.rtp < 0 ? "text-rose-400" : "text-neon"}>{(100 - stats.rtp).toFixed(2)}%</b>
          </div>
          <button
            className="btn-primary ml-auto"
            disabled={!sumOk || !pctsChanged}
            onClick={() =>
              run(async () => {
                const weights = Object.fromEntries(items.map((i, k) => [i.id, stats.weights[k]]));
                await call(`/api/admin/cases/${c.id}/probabilities`, "PUT", { weights });
                setItems((xs) => xs.map((x, k) => ({ ...x, weight: stats.weights[k] })));
                return "Магадлал хадгалагдлаа";
              })
            }
          >
            Магадлал хадгалах
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Нэр</th>
                <th>Үнэ цэнэ (₮)</th>
                <th>Зэрэглэл</th>
                <th>Нөөц</th>
                <th>Магадлал %</th>
                <th className="text-right">EV хувь нэмэр</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((i, k) => (
                <tr key={i.id}>
                  <td>
                    <div className="flex items-center gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.image} alt="" className="h-9 w-9 rounded" />
                      <UploadButton small onUrl={(url) => setItem(i.id, { image: url })} onError={(t) => setMsg({ ok: false, text: t })} />
                    </div>
                  </td>
                  <td>
                    <input className="input min-w-[180px] py-1.5" value={i.name} onChange={(e) => setItem(i.id, { name: e.target.value })} />
                  </td>
                  <td>
                    <input className="input w-28 py-1.5" inputMode="numeric" value={i.value} onChange={(e) => setItem(i.id, { value: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                  </td>
                  <td>
                    <select className="input w-32 py-1.5" style={{ color: RARITY[i.rarity].color }} value={i.rarity} onChange={(e) => setItem(i.id, { rarity: e.target.value as RarityKey })}>
                      {RARITIES.map((r) => (
                        <option key={r} value={r}>
                          {RARITY[r].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={`input w-24 py-1.5 ${i.stock <= 0 ? "!border-rose-500" : ""}`}
                      inputMode="numeric"
                      value={i.stock}
                      onChange={(e) => setItem(i.id, { stock: Number(e.target.value.replace(/\D/g, "")) || 0 })}
                    />
                  </td>
                  <td>
                    <input
                      className={`input w-24 py-1.5 font-mono ${Number.isInteger(stats.weights[k]) && stats.weights[k] >= 0 ? "" : "!border-rose-500"}`}
                      value={pcts[i.id] ?? ""}
                      onChange={(e) => setPcts({ ...pcts, [i.id]: e.target.value.replace(",", ".") })}
                    />
                  </td>
                  <td className="whitespace-nowrap text-right text-gray-400">{mnt((i.value * (stats.weights[k] || 0)) / WEIGHT_TOTAL)}</td>
                  <td className="whitespace-nowrap">
                    <button
                      className="btn-ghost px-2 py-1 text-xs"
                      disabled={!dirty[i.id]}
                      onClick={() =>
                        run(async () => {
                          await call(`/api/admin/items/${i.id}`, "PATCH", { name: i.name, value: i.value, rarity: i.rarity, stock: i.stock, image: i.image });
                          setDirty((d) => ({ ...d, [i.id]: false }));
                          return `${i.name} хадгалагдлаа`;
                        })
                      }
                    >
                      Хадгалах
                    </button>{" "}
                    <button
                      className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300"
                      onClick={() =>
                        confirm(`${i.name} устгах уу?`) &&
                        run(async () => {
                          await call(`/api/admin/items/${i.id}`, "DELETE");
                          setItems((xs) => xs.filter((x) => x.id !== i.id));
                          return "Устгалаа";
                        })
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line p-4 text-xs text-gray-500">
          Магадлалыг 0.001%-ийн нарийвчлалтай оруулна. Нийлбэр яг 100% болсон үед л хадгална. Нэг ч барааны нөөц 0 бол хайрцаг нээгдэхгүй.
        </p>
      </section>

      {/* Add item */}
      <section className="card grid gap-3 p-5 md:grid-cols-6">
        <h2 className="font-bold text-white md:col-span-6">+ Бараа нэмэх (0%-иар нэмэгдэнэ)</h2>
        <input className="input md:col-span-2" placeholder="Нэр" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
        <input className="input" inputMode="numeric" placeholder="Үнэ цэнэ" value={newItem.value} onChange={(e) => setNewItem({ ...newItem, value: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
        <select className="input" value={newItem.rarity} onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value as RarityKey })}>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {RARITY[r].label}
            </option>
          ))}
        </select>
        <input className="input" inputMode="numeric" placeholder="Нөөц" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
        <div className="flex gap-2">
          <UploadButton onUrl={(url) => setNewItem({ ...newItem, image: url })} onError={(t) => setMsg({ ok: false, text: t })} />
          <button
            className="btn-primary flex-1"
            onClick={() =>
              run(async () => {
                const d = await call(`/api/admin/cases/${c.id}/items`, "POST", newItem);
                setItems((xs) => [...xs, d]);
                setPcts((p) => ({ ...p, [d.id]: "0" }));
                setNewItem({ ...newItem, name: "" });
                return "Бараа нэмэгдлээ – магадлалыг тохируулна уу";
              })
            }
          >
            Нэмэх
          </button>
        </div>
      </section>

      {msg && (
        <div className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-xl ${msg.ok ? "border-emerald-500/50 bg-emerald-950 text-emerald-300" : "border-rose-500/50 bg-rose-950 text-rose-300"}`}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

function UploadButton({ onUrl, onError, small }: { onUrl: (url: string) => void; onError: (t: string) => void; small?: boolean }) {
  return (
    <label className={`btn-ghost cursor-pointer whitespace-nowrap ${small ? "px-2 py-1 text-xs" : ""}`} title="Зураг оруулах">
      {small ? "⇪" : "Зураг"}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            onUrl(await uploadImage(f));
          } catch (x) {
            onError((x as Error).message);
          }
        }}
      />
    </label>
  );
}
