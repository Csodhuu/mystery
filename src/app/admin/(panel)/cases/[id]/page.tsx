import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/server/db";
import { CaseEditor } from "./CaseEditor";

export default async function EditCase({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.case.findUnique({ where: { id }, include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } } });
  if (!c) notFound();
  return (
    <div className="space-y-4">
      <Link href="/admin/cases" className="text-sm text-gray-500 hover:text-white">
        ← Хайрцагнууд
      </Link>
      <CaseEditor
        kase={{ id: c.id, name: c.name, slug: c.slug, price: c.price, description: c.description, color: c.color, image: c.image, isActive: c.isActive, sortOrder: c.sortOrder }}
        items={c.items.map((i) => ({ id: i.id, name: i.name, value: i.value, rarity: i.rarity, weight: i.weight, stock: i.stock, image: i.image }))}
      />
    </div>
  );
}
