import { describe, expect, it } from "vitest";
import { SEED_CASES } from "../prisma/data/cases";
import { isValidTable, percentToWeight } from "../src/lib/fairness";
import { applyMode, expectedValue } from "../src/lib/modes";

const cases = SEED_CASES.map((c) => ({
  ...c,
  items: c.items.map((it, i) => ({ id: `${c.slug}-${i}`, value: it.value, weight: percentToWeight(it.percent) })),
}));

describe("open modes", () => {
  it.each(cases)("$slug: normal is unchanged", (c) => {
    expect(applyMode(c.items, c.price, "normal")).toEqual({ items: c.items, price: c.price });
  });

  it.each(cases)("$slug: jester gives equal odds and keeps the RTP", (c) => {
    const j = applyMode(c.items, c.price, "jester");
    expect(isValidTable(j.items)).toBe(true);
    const ws = j.items.map((i) => i.weight);
    expect(Math.max(...ws) - Math.min(...ws)).toBeLessThanOrEqual(1);
    expect(j.price % 100).toBe(0);
    const rtp = expectedValue(c.items) / c.price;
    expect(expectedValue(j.items) / j.price).toBeCloseTo(rtp, 2);
  });

  it.each(cases)("$slug: boost doubles price and the odds of items worth more than the price", (c) => {
    const b = applyMode(c.items, c.price, "boost");
    expect(isValidTable(b.items)).toBe(true);
    expect(b.price).toBe(c.price * 2);
    c.items.forEach((it, i) => {
      if (it.value > c.price) expect(Math.abs(b.items[i].weight - it.weight * 2)).toBeLessThanOrEqual(1);
      else expect(b.items[i].weight).toBeLessThanOrEqual(it.weight);
    });
  });
});
