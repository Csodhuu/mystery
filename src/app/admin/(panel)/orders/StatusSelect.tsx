"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/format";

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [busy, setBusy] = useState(false);
  return (
    <select
      className="input w-40 py-1.5 text-xs font-semibold"
      style={{ color: ORDER_STATUS_COLOR[s] }}
      value={s}
      disabled={busy}
      onChange={async (e) => {
        const next = e.target.value;
        setBusy(true);
        const r = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
        setBusy(false);
        if (r.ok) {
          setS(next);
          router.refresh();
        }
      }}
    >
      {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}
