import Link from "next/link";

export function RequireLogin({ next }: { next: string }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="h1">Нэвтрэх шаардлагатай</h1>
      <p className="muted mt-2">Энэ хуудсыг үзэхийн тулд нэвтэрнэ үү.</p>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary mt-6">
        Нэвтрэх
      </Link>
    </div>
  );
}
