import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { generateClientSeed, generateServerSeed, sha256Hex } from "../lib/fairness";
import { AppError } from "./errors";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function createSeedPair(tx: Tx, userId: string, clientSeed = generateClientSeed()) {
  const seed = generateServerSeed();
  return tx.serverSeed.create({ data: { userId, seed, hash: sha256Hex(seed), clientSeed } });
}

export async function getActiveSeed(tx: Tx, userId: string) {
  const s = await tx.serverSeed.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } });
  return s ?? createSeedPair(tx, userId);
}

/** Public view: never exposes the active (unrevealed) server seed. */
export async function fairnessState(userId: string) {
  const active = await getActiveSeed(prisma, userId);
  const previous = await prisma.serverSeed.findMany({
    where: { userId, active: false },
    orderBy: { revealedAt: "desc" },
    take: 10,
    select: { id: true, seed: true, hash: true, clientSeed: true, nonce: true, revealedAt: true },
  });
  return {
    active: { id: active.id, hash: active.hash, clientSeed: active.clientSeed, nonce: active.nonce },
    previous,
  };
}

/** Reveal the current server seed and start a new committed pair. */
export async function rotateSeed(userId: string, newClientSeed?: string) {
  if (newClientSeed !== undefined) validateClientSeed(newClientSeed);
  return prisma.$transaction(async (tx) => {
    const current = await getActiveSeed(tx, userId);
    await tx.serverSeed.update({ where: { id: current.id }, data: { active: false, revealedAt: new Date() } });
    const next = await createSeedPair(tx, userId, newClientSeed || generateClientSeed());
    return { revealed: { seed: current.seed, hash: current.hash, clientSeed: current.clientSeed, nonce: current.nonce }, nextHash: next.hash };
  });
}

export function validateClientSeed(s: string) {
  if (!/^[\w-]{1,64}$/.test(s)) throw new AppError("BAD_CLIENT_SEED", "Client seed: 1-64 тэмдэгт (үсэг, тоо, _ -)");
}

/** Changing the client seed also rotates the server seed, so the commitment stays meaningful. */
export async function setClientSeed(userId: string, clientSeed: string) {
  validateClientSeed(clientSeed);
  return rotateSeed(userId, clientSeed);
}
