import { prisma } from "@/server/db";
import { Verifier } from "./Verifier";

export default async function VerifyPage() {
  const cases = await prisma.case.findMany({ orderBy: { sortOrder: "asc" }, include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } });
  return (
    <div>
      <h1 className="h1">Нээлт шалгах</h1>
      <p className="muted mb-6">Бүх тооцоолол таны браузерт (Web Crypto) хийгдэнэ – сервертэй холбогдохгүй.</p>
      <Verifier cases={cases.map((c) => ({ slug: c.slug, name: c.name, table: c.items.map((i) => ({ id: i.id, name: i.name, weight: i.weight })) }))} />
    </div>
  );
}
