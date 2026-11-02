"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (url: string, body: unknown) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      return d;
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <div className="card p-6">
        <h1 className="h1">Нэвтрэх</h1>
        <p className="muted mt-1">Утасны дугаараараа SMS кодоор нэвтэрнэ. Шинэ хэрэглэгч автоматаар бүртгэгдэнэ.</p>
        {step === "phone" ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const d = await post("/api/auth/otp/request", { phone });
              if (d) {
                setHint(d.demoHint);
                setStep("code");
              }
            }}
          >
            <div>
              <label className="label">Утасны дугаар</label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-line bg-panel2 px-3 py-2.5 text-sm text-gray-400">+976</span>
                <input className="input" inputMode="numeric" maxLength={8} placeholder="99112233" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} autoFocus />
              </div>
            </div>
            <button className="btn-primary w-full" disabled={busy || phone.length !== 8}>
              Код авах
            </button>
          </form>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const d = await post("/api/auth/otp/verify", { phone, code, name, ageConfirmed: age });
              if (d) {
                router.push(next);
                router.refresh();
              }
            }}
          >
            <p className="text-sm text-gray-300">
              <b>+976 {phone}</b> дугаарт код илгээлээ.{" "}
              <button type="button" className="text-neon underline" onClick={() => setStep("phone")}>
                Солих
              </button>
            </p>
            {hint && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-400">{hint}</p>}
            <div>
              <label className="label">4 оронтой код</label>
              <input className="input text-center text-2xl tracking-[0.6em]" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
            </div>
            <div>
              <label className="label">Нэр (шинэ хэрэглэгч)</label>
              <input className="input" placeholder="Б.Болд" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>
            <label className="flex items-start gap-2 text-sm text-gray-300">
              <input type="checkbox" className="mt-1 accent-cyan-400" checked={age} onChange={(e) => setAge(e.target.checked)} />
              <span>
                Би 18 нас хүрсэн бөгөөд{" "}
                <a href="/terms" target="_blank" className="text-neon underline">
                  Үйлчилгээний нөхцөл
                </a>
                ,{" "}
                <a href="/privacy" target="_blank" className="text-neon underline">
                  Нууцлалын бодлого
                </a>
                -г зөвшөөрч байна.
              </span>
            </label>
            <button className="btn-primary w-full" disabled={busy || code.length !== 4}>
              Нэвтрэх
            </button>
          </form>
        )}
        {err && <p className="mt-4 text-sm font-semibold text-rose-400">{err}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
