import { randomInt } from "node:crypto";
import type { RarityKey } from "./rarity";

export const REEL_LENGTH = 60;
export const WIN_INDEX = 52;

/** Visual frequency of filler cards per rarity (not the real odds – those decide only the winner). */
const VISUAL_WEIGHT: Record<RarityKey, number> = { COMMON: 40, UNCOMMON: 25, RARE: 16, EPIC: 9, LEGENDARY: 4 };

type ReelItem = { id: string; rarity: RarityKey; value: number };

export type Reel = { ids: string[]; winIndex: number; /** -0.42..0.42 of a card width */ offset: number };

export function buildReel(items: ReelItem[], winnerId: string, rng: (max: number) => number = (m) => randomInt(m)): Reel {
  const weighted = items.map((it) => ({ id: it.id, w: VISUAL_WEIGHT[it.rarity] }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  const pick = () => {
    let r = rng(total);
    for (const x of weighted) {
      if (r < x.w) return x.id;
      r -= x.w;
    }
    return weighted[0].id;
  };

  const ids = Array.from({ length: REEL_LENGTH }, pick);
  const top = items.reduce((a, b) => (b.value > a.value ? b : a));

  // Near misses: the top prize appears a few times, one of them right next to the winner.
  if (top.id !== winnerId) {
    ids[WIN_INDEX + (rng(2) === 0 ? -1 : 1)] = top.id;
  }
  for (let i = 0, n = 1 + rng(2); i < n; i++) ids[20 + rng(28)] = top.id;

  ids[WIN_INDEX] = winnerId;
  const offset = (rng(841) - 420) / 1000;
  return { ids, winIndex: WIN_INDEX, offset };
}
