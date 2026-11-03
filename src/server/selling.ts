import { prisma } from "./db";
import { AppError } from "./errors";

export const MAX_SELL_BATCH = 500;

/**
 * Sells inventory items back for balance at the value they had when won.
 * The conditional status update makes every order sellable exactly once, even under concurrent requests.
 */
export async function sellOrders(userId: string, orderIds: string[]) {
  const ids = [...new Set(orderIds.filter((id) => typeof id === "string"))];
  if (ids.length === 0 || ids.length > MAX_SELL_BATCH) throw new AppError("BAD_IDS", "Зарах бараагаа сонгоно уу");

  return prisma.$transaction(
    async (tx) => {
      const orders = await tx.order.findMany({
        where: { id: { in: ids }, userId, status: "IN_INVENTORY" },
        select: { id: true, itemId: true, opening: { select: { itemValue: true } } },
      });
      const now = new Date();
      let total = 0;
      const sold: string[] = [];
      for (const o of orders) {
        const value = o.opening.itemValue;
        const res = await tx.order.updateMany({
          where: { id: o.id, status: "IN_INVENTORY" },
          data: { status: "SOLD", soldAt: now, soldFor: value },
        });
        if (res.count === 0) continue;
        await tx.item.update({ where: { id: o.itemId }, data: { stock: { increment: 1 } } });
        total += value;
        sold.push(o.id);
      }
      if (sold.length === 0) throw new AppError("NOT_ALLOWED", "Энэ барааг зарах боломжгүй", 409);
      const user = await tx.user.update({ where: { id: userId }, data: { balance: { increment: total } } });
      return { sold, total, balance: user.balance };
    },
    { timeout: 15_000 },
  );
}
