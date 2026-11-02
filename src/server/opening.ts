import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import { getActiveSeed } from "./seeds";
import { isValidTable, resolveOpening } from "../lib/fairness";
import { buildReel, type Reel } from "../lib/reel";
import type { RarityKey } from "../lib/rarity";

type LockedItem = { id: string; name: string; value: number; rarity: RarityKey; weight: number; stock: number; image: string };

export type OpenResult = {
  openingId: string;
  orderId: string;
  item: { id: string; name: string; value: number; rarity: RarityKey; image: string };
  reel: Reel;
  balance: number;
  fairness: { serverSeedHash: string; clientSeed: string; nonce: number; roll: number };
  replay: boolean;
};

export async function openCase(opts: {
  userId: string;
  slug: string;
  idempotencyKey: string;
  /** Seed script only: backdate the record */
  at?: Date;
  /** Seed script only: don't publish to the live ticker */
  silent?: boolean;
}): Promise<OpenResult> {
  const { userId, slug, idempotencyKey } = opts;
  if (!/^[\w-]{8,64}$/.test(idempotencyKey)) throw new AppError("BAD_KEY", "Idempotency key буруу");

  const replay = await findExisting(userId, idempotencyKey);
  if (replay) return replay;

  try {
    return await prisma.$transaction(
      async (tx) => {
        const kase = await tx.case.findUnique({ where: { slug } });
        if (!kase || !kase.isActive) throw new AppError("NOT_FOUND", "Хайрцаг олдсонгүй", 404);

        // Lock every item row of this case: stock check + decrement are serialized per case.
        const items = await tx.$queryRaw<LockedItem[]>`
          SELECT id, name, value, rarity::text AS rarity, weight, stock, image
          FROM "Item" WHERE "caseId" = ${kase.id}
          ORDER BY "sortOrder" ASC, id ASC
          FOR UPDATE`;
        if (!isValidTable(items)) throw new AppError("BAD_TABLE", "Хайрцагны магадлал буруу тохируулагдсан", 409);
        if (items.some((i) => i.stock <= 0)) {
          throw new AppError("OUT_OF_STOCK", "Зарим бараа дууссан тул энэ хайрцгийг одоогоор нээх боломжгүй", 409);
        }

        // Atomic, conditional balance deduction.
        const debited = await tx.user.updateMany({
          where: { id: userId, balance: { gte: kase.price } },
          data: { balance: { decrement: kase.price } },
        });
        if (debited.count === 0) throw new AppError("INSUFFICIENT_BALANCE", "Үлдэгдэл хүрэлцэхгүй байна", 402);

        // Reserve a nonce (row-level lock via UPDATE).
        const active = await getActiveSeed(tx, userId);
        const seed = await tx.serverSeed.update({ where: { id: active.id }, data: { nonce: { increment: 1 } } });
        const nonce = seed.nonce - 1;

        const { roll, entry } = resolveOpening(items, seed.seed, seed.clientSeed, nonce);

        await tx.item.update({ where: { id: entry.id }, data: { stock: { decrement: 1 } } });

        const at = opts.at ?? new Date();
        const opening = await tx.opening.create({
          data: {
            userId,
            caseId: kase.id,
            itemId: entry.id,
            price: kase.price,
            itemValue: entry.value,
            serverSeedId: seed.id,
            clientSeed: seed.clientSeed,
            nonce,
            roll,
            table: items.map((i) => ({ id: i.id, name: i.name, weight: i.weight })),
            idempotencyKey,
            createdAt: at,
          },
        });
        const order = await tx.order.create({
          data: { userId, openingId: opening.id, itemId: entry.id, createdAt: at },
        });
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        if (!opts.silent) {
          await tx.liveDrop.create({ data: { userName: user.name, itemId: entry.id, isDemo: false, createdAt: at } });
        }

        return {
          openingId: opening.id,
          orderId: order.id,
          item: { id: entry.id, name: entry.name, value: entry.value, rarity: entry.rarity, image: entry.image },
          reel: buildReel(items, entry.id),
          balance: user.balance,
          fairness: { serverSeedHash: seed.hash, clientSeed: seed.clientSeed, nonce, roll },
          replay: false,
        };
      },
      { timeout: 15_000 },
    );
  } catch (e) {
    // Concurrent request with the same idempotency key won the race.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await findExisting(userId, idempotencyKey);
      if (again) return again;
    }
    throw e;
  }
}

async function findExisting(userId: string, idempotencyKey: string): Promise<OpenResult | null> {
  const o = await prisma.opening.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey } },
    include: { item: true, order: true, serverSeed: true, user: true, case: { include: { items: true } } },
  });
  if (!o) return null;
  return {
    openingId: o.id,
    orderId: o.order?.id ?? "",
    item: { id: o.item.id, name: o.item.name, value: o.item.value, rarity: o.item.rarity, image: o.item.image },
    reel: buildReel(o.case.items, o.itemId),
    balance: o.user.balance,
    fairness: { serverSeedHash: o.serverSeed.hash, clientSeed: o.clientSeed, nonce: o.nonce, roll: o.roll },
    replay: true,
  };
}
