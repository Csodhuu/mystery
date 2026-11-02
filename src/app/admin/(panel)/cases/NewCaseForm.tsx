"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "./upload";

export function NewCaseForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", slug: "", price: 20_000, description: "", color: "#22d3ee", image: "/generated/cases/starter.svg" });
  const [err, setErr] = useState<string | null>(null);
  return (
    <form
      className="card grid gap-3 p-5 md:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const r = await fetch("/api/admin/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, isActive: false }) });
        const d = await r.json();
        if (!r.ok) return setErr(d.message);
        router.push(`/admin/cases/${d.id}`);
      }}
    >
      <h2 className="font-bold text-white md:col-span-3">+ Шинэ хайрцаг</h2>
      <div>
        <label className="label">Нэр</label>
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      </div>
      <div>
        <label className="label">Slug (URL)</label>
        <input className="input font-mono" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} placeholder="summer-case" required />
      </div>
      <div>
        <label className="label">Үнэ (₮)</label>
        <input className="input" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Тайлбар</label>
        <input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div>
        <label className="label">Өнгө</label>
        <input className="input h-[42px] p-1" type="color" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Зураг</label>
        <div className="flex gap-2">
          <input className="input font-mono text-xs" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} />
          <label className="btn-ghost cursor-pointer whitespace-nowrap">
            Оруулах
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setF({ ...f, image: await uploadImage(file) });
              } catch (x) {
                setErr((x as Error).message);
              }
            }} />
          </label>
        </div>
      </div>
      <div className="flex items-end">
        <button className="btn-primary w-full">Үүсгэх (идэвхгүй)</button>
      </div>
      {err && <p className="text-sm text-rose-400 md:col-span-3">{err}</p>}
    </form>
  );
}
