"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemCard } from "@/components/ItemCard";
import type { RarityKey } from "@/lib/rarity";
import { dateTime, mnt, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, UB_DISTRICTS } from "@/lib/format";

type Order = {
  id: string;
  status: keyof typeof ORDER_STATUS_LABEL;
  createdAt: string;
  requestedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  address: string | null;
  item: { name: string; value: number; rarity: RarityKey; image: string };
};

const TABS = ["ALL", "IN_INVENTORY", "DELIVERY_REQUESTED", "SHIPPED", "DELIVERED"] as const;

export function InventoryList({ orders, openId, defaultPhone, defaultName }: { orders: Order[]; openId: string | null; defaultPhone: string; defaultName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("ALL");
  const [modal, setModal] = useState<Order | null>(() => orders.find((o) => o.id === openId && o.status === "IN_INVENTORY") ?? null);
  const [form, setForm] = useState({ fullName: defaultName, phone: defaultPhone, district: "", khoroo: "", address: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => (tab === "ALL" ? orders : orders.filter((o) => o.status === tab)), [orders, tab]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, t === "ALL" ? orders.length : orders.filter((o) => o.status === t).length])), [orders]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/inventory/${modal.id}/deliver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.message);
    setModal(null);
    router.replace("/inventory");
    router.refresh();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn-ghost whitespace-nowrap ${tab === t ? "!border-neon text-neon" : ""}`}>
            {t === "ALL" ? "Бүгд" : ORDER_STATUS_LABEL[t]} <span className="text-gray-500">{counts[t]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">Бараа алга. Хайрцаг нээж бараа хожоорой!</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((o) => (
            <div key={o.id} className="flex flex-col gap-2">
              <ItemCard {...o.item} />
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold" style={{ color: ORDER_STATUS_COLOR[o.status] }}>
                  ● {ORDER_STATUS_LABEL[o.status]}
                </span>
                <span className="text-gray-500">{dateTime(o.createdAt).slice(5)}</span>
              </div>
              {o.status === "IN_INVENTORY" ? (
                <button className="btn-primary py-2 text-xs" onClick={() => setModal(o)}>
                  🚚 Хүргүүлэх
                </button>
              ) : (
                <div className="text-[11px] leading-snug text-gray-500" title={o.address ?? ""}>
                  <div className="line-clamp-2">{o.address}</div>
                  {o.deliveredAt ? <div>Хүргэсэн: {dateTime(o.deliveredAt)}</div> : o.shippedAt ? <div>Илгээсэн: {dateTime(o.shippedAt)}</div> : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-4 backdrop-blur" onClick={() => setModal(null)}>
          <form className="card max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3 className="text-lg font-bold text-white">Хүргэлтийн мэдээлэл</h3>
            <div className="flex items-center gap-3 rounded-xl bg-panel2 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modal.item.image} alt="" className="h-12 w-12 rounded-lg" />
              <div>
                <div className="text-sm font-semibold text-white">{modal.item.name}</div>
                <div className="text-xs text-gray-400">{mnt(modal.item.value)}</div>
              </div>
            </div>
            <div>
              <label className="label">Хүлээн авагчийн нэр</label>
              <input className="input" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div>
              <label className="label">Утас</label>
              <input className="input" inputMode="numeric" maxLength={8} value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Дүүрэг</label>
                <select className="input" value={form.district} onChange={set("district")} required>
                  <option value="">Сонгох</option>
                  {UB_DISTRICTS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Хороо</label>
                <input className="input" inputMode="numeric" maxLength={2} placeholder="1" value={form.khoroo} onChange={set("khoroo")} required />
              </div>
            </div>
            <div>
              <label className="label">Дэлгэрэнгүй хаяг</label>
              <textarea className="input min-h-[80px]" placeholder="Байр, орц, давхар, тоот" value={form.address} onChange={set("address")} required />
            </div>
            {err && <p className="text-sm font-semibold text-rose-400">{err}</p>}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>
                Болих
              </button>
              <button className="btn-primary" disabled={busy}>
                Илгээх
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
