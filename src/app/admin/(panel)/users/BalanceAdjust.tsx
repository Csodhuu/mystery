"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function BalanceAdjust({ id }: { id: string }) {
  const router = useRouter();
  const [v, setV] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-1">
      <input className="input w-28 py-1 text-xs" placeholder="±10000" value={v} onChange={(e) => setV(e.target.value.replace(/[^\d-]/g, ""))} />
      <button
        className="btn-ghost px-2 py-1 text-xs"
        disabled={!v || v === "-"}
        onClick={async () => {
          setErr(null);
          const r = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta: Number(v) }) });
          const d = await r.json();
          if (!r.ok) return setErr(d.message);
          setV("");
          router.refresh();
        }}
      >
        OK
      </button>
      {err && <span className="text-[10px] text-rose-400">{err}</span>}
    </div>
  );
}
