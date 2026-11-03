import { WEIGHT_TOTAL } from "./fairness";

/**
 * Opening modes change the price and the probability table the roll is made against.
 * The modified table is stored with each opening, so /fairness/verify works unchanged.
 * (Lightning is animation-only and lives in the client.)
 */
export type OpenMode = "normal" | "jester" | "boost";
export const OPEN_MODES: OpenMode[] = ["normal", "jester", "boost"];

/** Boost: price × this, and every item worth more than the base price gets its odds × this. */
export const BOOST_FACTOR = 2;

type Entry = { id: string; value: number; weight: number };

export function isOpenMode(m: unknown): m is OpenMode {
  return typeof m === "string" && (OPEN_MODES as string[]).includes(m);
}

export function applyMode<T extends Entry>(items: T[], price: number, mode: OpenMode): { items: T[]; price: number } {
  if (mode === "jester") return jester(items, price);
  if (mode === "boost") return boost(items, price);
  return { items, price };
}

/** Every item equally likely; the price rises so the case keeps its normal RTP. */
function jester<T extends Entry>(items: T[], price: number) {
  const n = items.length;
  const base = Math.floor(WEIGHT_TOTAL / n);
  const extra = WEIGHT_TOTAL - base * n;
  const out = items.map((it, i) => ({ ...it, weight: base + (i < extra ? 1 : 0) }));
  const ev = expectedValue(items);
  const mean = items.reduce((s, it) => s + it.value, 0) / n;
  const raw = ev > 0 ? (price * mean) / ev : price * n;
  return { items: out, price: roundUp(raw, 100) };
}

/** Price × 2; items worth more than the base price get their odds × 2, the cheap ones shrink to fill 100%. */
function boost<T extends Entry>(items: T[], price: number) {
  const pricey = (it: Entry) => it.value > price;
  const pricyTotal = items.filter(pricey).reduce((s, it) => s + it.weight, 0);
  const cheapTotal = WEIGHT_TOTAL - pricyTotal;
  // Can't double past 100%: cap the boosted share at what the cheap items can give up.
  const boostedTotal = Math.min(pricyTotal * BOOST_FACTOR, WEIGHT_TOTAL);
  if (pricyTotal === 0 || cheapTotal === 0) return { items, price: price * BOOST_FACTOR };
  const scalePricey = boostedTotal / pricyTotal;
  const scaleCheap = (WEIGHT_TOTAL - boostedTotal) / cheapTotal;
  const weights = distribute(items.map((it) => it.weight * (pricey(it) ? scalePricey : scaleCheap)));
  return { items: items.map((it, i) => ({ ...it, weight: weights[i] })), price: price * BOOST_FACTOR };
}

export function expectedValue(items: Entry[]): number {
  return items.reduce((s, it) => s + (it.value * it.weight) / WEIGHT_TOTAL, 0);
}

/** Largest-remainder rounding to integers that sum to exactly WEIGHT_TOTAL. */
function distribute(raw: number[]): number[] {
  const floors = raw.map(Math.floor);
  let left = WEIGHT_TOTAL - floors.reduce((s, x) => s + x, 0);
  const order = raw.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]++;
    left--;
  }
  return floors;
}

function roundUp(x: number, step: number) {
  return Math.ceil(x / step) * step;
}
