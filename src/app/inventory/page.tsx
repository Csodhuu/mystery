import { prisma } from "@/server/db";
import { getUser } from "@/server/auth";
import { RequireLogin } from "@/components/RequireLogin";
import { InventoryList } from "./InventoryList";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ deliver?: string }> }) {
  const user = await getUser();
  if (!user) return <RequireLogin next="/inventory" />;
  const { deliver } = await searchParams;
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { item: true, opening: { select: { itemValue: true } } } });
  return (
    <div>
      <h1 className="h1 mb-1">Миний агуулах</h1>
      <p className="muted mb-6">Хожсон бараагаа хүргүүлэх эсвэл зарж үлдэгдэлдээ нэмээрэй. Улаанбаатар хот дотор хүргэлт үнэгүй.</p>
      <InventoryList
        defaultPhone={user.phone}
        defaultName={user.name}
        openId={deliver ?? null}
        orders={orders.map((o) => ({
          id: o.id,
          status: o.status,
          itemId: o.itemId,
          sellValue: o.opening.itemValue,
          soldFor: o.soldFor,
          createdAt: o.createdAt.toISOString(),
          requestedAt: o.requestedAt?.toISOString() ?? null,
          shippedAt: o.shippedAt?.toISOString() ?? null,
          deliveredAt: o.deliveredAt?.toISOString() ?? null,
          address: o.district ? `${o.district}, ${o.khoroo}-р хороо, ${o.address}` : null,
          item: { name: o.item.name, value: o.item.value, rarity: o.item.rarity, image: o.item.image },
        }))}
      />
    </div>
  );
}
