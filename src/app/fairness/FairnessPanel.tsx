"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { dateTime } from "@/lib/format";

type State = {
  active: { hash: string; clientSeed: string; nonce: number };
  previous: { id: string; seed: string; hash: string; clientSeed: string; nonce: number; revealedAt: string }[];
};

export function FairnessPanel() {
  const [s, setS] = useState<State | null>(null);
  const [client, setClient] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const d = await fetch("/api/fairness").then((r) => r.json());
    setS(d);
    setClient(d.active.clientSeed);
  };
  useEffect(() => {
    void load();
  }, []);

  const act = async (body: object) => {
    setMsg(null);
    const r = await fetch("/api/fairness", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) return setMsg(d.message);
    setS(d.state);
    setClient(d.state.active.clientSeed);
    setMsg("Server seed илчлэгдэж, шинэ seed хос үүслээ.");
  };

  if (!s) return <div className="card p-6 text-gray-500">Ачаалж байна…</div>;
  return (
    <div className="card space-y-5 p-6">
      <h2 className="text-lg font-bold text-white">Миний seed</h2>
      <div>
        <div className="label">Идэвхтэй server seed hash (SHA-256)</div>
        <div className="break-all rounded-lg bg-panel2 p-2 font-mono text-xs text-neon">{s.active.hash}</div>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <div>
          <label className="label">Client seed</label>
          <input className="input font-mono" value={client} onChange={(e) => setClient(e.target.value)} maxLength={64} />
        </div>
        <button className="btn-ghost" onClick={() => act({ action: "clientSeed", clientSeed: client })} disabled={client === s.active.clientSeed}>
          Хадгалах
        </button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Дараагийн nonce: <b className="text-white">{s.active.nonce}</b>
        </span>
        <button className="btn-primary" onClick={() => act({ action: "rotate" })}>
          Server seed солих (илчлэх)
        </button>
      </div>
      {msg && <p className="text-sm text-amber-400">{msg}</p>}
      <div>
        <h3 className="mb-2 text-sm font-bold text-white">Илчлэгдсэн seed-үүд</h3>
        {s.previous.length === 0 && <p className="muted">Одоогоор алга.</p>}
        <ul className="space-y-2">
          {s.previous.map((p) => (
            <li key={p.id} className="rounded-lg bg-panel2 p-2 font-mono text-[11px] text-gray-400">
              <div className="break-all">
                seed: <span className="text-white">{p.seed}</span>
              </div>
              <div className="break-all">hash: {p.hash}</div>
              <div>
                client: {p.clientSeed} · nonce 0–{Math.max(0, p.nonce - 1)} · {dateTime(p.revealedAt)}{" "}
                <Link className="text-neon" href={`/fairness/verify?serverSeed=${p.seed}&clientSeed=${p.clientSeed}&nonce=0`}>
                  шалгах
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
