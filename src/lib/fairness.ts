/**
 * Provably-fair core. Pure functions shared by the server, the seed script,
 * the /dev simulator and the unit tests – there is exactly one opening algorithm.
 *
 *   roll = floor( first52bits(HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}`)) * 100000 / 2^52 )
 *
 * The roll (0..99999) is mapped onto the case's cumulative weight table,
 * where each item's weight is its probability in units of 0.001%.
 */
import { createHash, createHmac, randomBytes } from "node:crypto";

export const WEIGHT_TOTAL = 100_000;

export type TableEntry = { id: string; weight: number };

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function generateClientSeed(): string {
  return randomBytes(8).toString("hex");
}

export function hmacHex(serverSeed: string, clientSeed: string, nonce: number): string {
  return createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest("hex");
}

/** Map an HMAC hex digest to an integer roll in [0, WEIGHT_TOTAL). */
export function rollFromHex(hex: string): number {
  const n = BigInt("0x" + hex.slice(0, 13)); // 52 bits
  return Number((n * BigInt(WEIGHT_TOTAL)) >> 52n);
}

export function computeRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  return rollFromHex(hmacHex(serverSeed, clientSeed, nonce));
}

export function tableTotal(table: TableEntry[]): number {
  return table.reduce((s, e) => s + e.weight, 0);
}

export function isValidTable(table: TableEntry[]): boolean {
  return (
    table.length > 0 &&
    table.every((e) => Number.isInteger(e.weight) && e.weight >= 0) &&
    tableTotal(table) === WEIGHT_TOTAL
  );
}

/** Pick the table entry whose cumulative range contains `roll`. Table order matters. */
export function pickByRoll<T extends TableEntry>(table: T[], roll: number): T {
  if (!isValidTable(table)) throw new Error("Probability table must sum to 100%");
  let acc = 0;
  for (const entry of table) {
    acc += entry.weight;
    if (roll < acc) return entry;
  }
  throw new Error("Roll out of range");
}

export function resolveOpening<T extends TableEntry>(
  table: T[],
  serverSeed: string,
  clientSeed: string,
  nonce: number,
): { roll: number; entry: T } {
  const roll = computeRoll(serverSeed, clientSeed, nonce);
  return { roll, entry: pickByRoll(table, roll) };
}

/** Run n openings with a fresh random server seed – used by tests and /dev simulator. */
export function simulate<T extends TableEntry>(table: T[], n: number): Map<string, number> {
  const serverSeed = generateServerSeed();
  const clientSeed = generateClientSeed();
  const counts = new Map<string, number>(table.map((e) => [e.id, 0]));
  for (let nonce = 0; nonce < n; nonce++) {
    const { entry } = resolveOpening(table, serverSeed, clientSeed, nonce);
    counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  }
  return counts;
}

/** Percent string → weight units, e.g. "0.02" → 20. */
export function percentToWeight(percent: number): number {
  return Math.round(percent * 1000);
}

export function weightToPercent(weight: number): number {
  return weight / 1000;
}
