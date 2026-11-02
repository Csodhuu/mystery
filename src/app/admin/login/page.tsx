"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-sm">
      <form
        className="card space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          const r = await fetch("/api/auth/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, password }) });
          const d = await r.json();
          if (!r.ok) return setErr(d.message);
          router.push("/admin");
          router.refresh();
        }}
      >
        <h1 className="h1">Админ нэвтрэх</h1>
        <div>
          <label className="label">Утас</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Нууц үг</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full">Нэвтрэх</button>
        {err && <p className="text-sm font-semibold text-rose-400">{err}</p>}
      </form>
    </div>
  );
}
