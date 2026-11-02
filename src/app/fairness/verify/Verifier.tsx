"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { hmacHexBrowser, rollFromHex, sha256HexBrowser, WEIGHT_TOTAL } from "@/lib/fairness-browser";

type Entry = { id: string; name: string; weight: number };
type CaseT = { slug: string; name: string; table: Entry[] };
type OpeningInfo = { id: string; caseName: string; serverSeedHash: string; serverSeed: string | null; roll: number; item: { id: string; name: string }; table: Entry[] };

function VerifierInner({ cases }: { cases: CaseT[] }) {
  const q = useSearchParams();
  const [serverSeed, setServerSeed] = useState(q.get("serverSeed") ?? "");
  const [clientSeed, setClientSeed] = useState(q.get("clientSeed") ?? "");
  const [nonce, setNonce] = useState(q.get("nonce") ?? "0");
  const [openingId, setOpeningId] = useState(q.get("opening") ?? "");
  const [caseSlug, setCaseSlug] = useState(cases[0]?.slug ?? "");
  const [opening, setOpening] = useState<OpeningInfo | null>(null);
  const [out, setOut] = useState<{ hash: string; hmac: string; roll: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!openingId) return setOpening(null);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/fairness/opening/${encodeURIComponent(openingId)}`);
      if (!r.ok) return setOpening(null);
      const d: OpeningInfo = await r.json();
      setOpening(d);
      if (d.serverSeed && !serverSeed) setServerSeed(d.serverSeed);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId]);

  useEffect(() => {
    setErr(null);
    if (!serverSeed || !clientSeed || !/^\d+$/.test(nonce)) return setOut(null);
    let alive = true;
    (async () => {
      const [hash, hmac] = await Promise.all([sha256HexBrowser(serverSeed), hmacHexBrowser(serverSeed, `${clientSeed}:${nonce}`)]);
      if (alive) setOut({ hash, hmac, roll: rollFromHex(hmac) });
    })().catch((e) => setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [serverSeed, clientSeed, nonce]);

  const table = opening?.table ?? cases.find((c) => c.slug === caseSlug)?.table ?? [];
  let acc = 0;
  const ranges = table.map((e) => {
    const r = { ...e, from: acc, to: acc + e.weight - 1 };
    acc += e.weight;
    return r;
  });
  const hit = out ? ranges.find((r) => out.roll >= r.from && out.roll <= r.to) : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card space-y-4 p-6">
        <div>
          <label className="label">Нээлтийн ID (заавал биш)</label>
          <input className="input font-mono" value={openingId} onChange={(e) => setOpeningId(e.target.value.trim())} placeholder="Түүх хуудаснаас" />
          {opening && (
            <p className="mt-1 text-xs text-gray-400">
              {opening.caseName} · бүртгэгдсэн roll <b className="text-white">{opening.roll}</b> → <b className="text-white">{opening.item.name}</b>
            </p>
          )}
        </div>
        {!opening && (
          <div>
            <label className="label">Хайрцаг (одоогийн хүснэгт)</label>
            <select className="input" value={caseSlug} onChange={(e) => setCaseSlug(e.target.value)}>
              {cases.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Server seed (илчлэгдсэн)</label>
          <input className="input font-mono text-xs" value={serverSeed} onChange={(e) => setServerSeed(e.target.value.trim())} />
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <label className="label">Client seed</label>
            <input className="input font-mono" value={clientSeed} onChange={(e) => setClientSeed(e.target.value.trim())} />
          </div>
          <div>
            <label className="label">Nonce</label>
            <input className="input font-mono" inputMode="numeric" value={nonce} onChange={(e) => setNonce(e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        {err && <p className="text-sm text-rose-400">{err}</p>}
      </div>

      <div className="card space-y-4 p-6">
        {!out ? (
          <p className="muted">Server seed, client seed, nonce оруулна уу.</p>
        ) : (
          <>
            <div>
              <div className="label">SHA-256(server seed)</div>
              <div className="break-all font-mono text-xs text-white">{out.hash}</div>
              {opening && (
                <div className={`mt-1 text-sm font-bold ${out.hash === opening.serverSeedHash ? "text-emerald-400" : "text-rose-400"}`}>
                  {out.hash === opening.serverSeedHash ? "✓ Урьдчилан харуулсан hash-тай таарч байна" : "✗ Hash таарахгүй байна"}
                </div>
              )}
            </div>
            <div>
              <div className="label">HMAC-SHA256</div>
              <div className="break-all font-mono text-xs">
                <span className="rounded bg-neon/20 text-neon">{out.hmac.slice(0, 13)}</span>
                <span className="text-gray-500">{out.hmac.slice(13)}</span>
              </div>
            </div>
            <div>
              <div className="label">Roll</div>
              <div className="text-3xl font-black text-white">
                {out.roll.toLocaleString()} <span className="text-base text-gray-500">/ {WEIGHT_TOTAL.toLocaleString()}</span>
              </div>
              {hit && <div className="mt-1 text-lg font-bold text-neon">→ {hit.name}</div>}
              {opening && hit && (
                <div className={`text-sm font-bold ${out.roll === opening.roll && hit.id === opening.item.id ? "text-emerald-400" : "text-rose-400"}`}>
                  {out.roll === opening.roll && hit.id === opening.item.id ? "✓ Бүртгэгдсэн үр дүнтэй таарч байна" : "✗ Үр дүн таарахгүй"}
                </div>
              )}
            </div>
          </>
        )}
        <div>
          <div className="label">Магадлалын хүснэгт</div>
          <table className="table-base text-xs">
            <tbody>
              {ranges.map((r) => (
                <tr key={r.id} className={hit?.id === r.id ? "bg-neon/10 text-neon" : ""}>
                  <td>{r.name}</td>
                  <td className="text-right font-mono">{(r.weight / 1000).toLocaleString("en-US", { maximumFractionDigits: 3 })}%</td>
                  <td className="text-right font-mono text-gray-500">
                    {r.from}–{r.to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Verifier(props: { cases: CaseT[] }) {
  return (
    <Suspense>
      <VerifierInner {...props} />
    </Suspense>
  );
}
