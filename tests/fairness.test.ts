import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  WEIGHT_TOTAL,
  computeRoll,
  hmacHex,
  isValidTable,
  percentToWeight,
  pickByRoll,
  resolveOpening,
  rollFromHex,
  sha256Hex,
  simulate,
} from "../src/lib/fairness";
import { buildReel, REEL_LENGTH, WIN_INDEX } from "../src/lib/reel";
import { SEED_CASES } from "../prisma/data/cases";

const tables = SEED_CASES.map((c) => ({
  name: c.name,
  price: c.price,
  table: c.items.map((it, i) => ({ id: `${c.slug}-${i}`, name: it.name, value: it.value, rarity: it.rarity, weight: percentToWeight(it.percent) })),
}));

describe("probability tables", () => {
  it.each(tables)("$name sums to exactly 100%", ({ table }) => {
    expect(isValidTable(table)).toBe(true);
  });

  it("rejects tables that do not sum to 100%", () => {
    expect(isValidTable([{ id: "a", weight: 50_000 }, { id: "b", weight: 49_999 }])).toBe(false);
    expect(() => pickByRoll([{ id: "a", weight: 1 }], 0)).toThrow();
  });

  it("matches the configured expected values", () => {
    const ev = (t: (typeof tables)[number]) => t.table.reduce((s, i) => s + (i.value * i.weight) / WEIGHT_TOTAL, 0);
    expect(ev(tables[0])).toBeCloseTo(7649.27, 1);
    expect(ev(tables[1])).toBeCloseTo(40931, -1);
    expect(ev(tables[2])).toBeCloseTo(77996, -1);
  });
});

describe("roll mapping", () => {
  it("is deterministic for the same seeds and nonce", () => {
    expect(computeRoll("server", "client", 7)).toBe(computeRoll("server", "client", 7));
    expect(computeRoll("server", "client", 7)).not.toBe(computeRoll("server", "client", 8));
  });

  it("matches a known HMAC-SHA256 vector", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    // RFC-style vector: HMAC-SHA256("key", "The quick brown fox jumps over the lazy dog")
    const digest = createHmac("sha256", "key").update("The quick brown fox jumps over the lazy dog").digest("hex");
    expect(digest).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
    expect(rollFromHex(digest)).toBe(96772);
    // message format is `${clientSeed}:${nonce}`
    expect(hmacHex("key", "The quick brown fox jumps over the lazy dog", 0)).toBe(
      createHmac("sha256", "key").update("The quick brown fox jumps over the lazy dog:0").digest("hex"),
    );
  });

  it("maps the extremes of the 52-bit range to 0 and 99999", () => {
    expect(rollFromHex("0000000000000" + "f".repeat(51))).toBe(0);
    expect(rollFromHex("fffffffffffff" + "0".repeat(51))).toBe(WEIGHT_TOTAL - 1);
  });

  it("assigns cumulative boundaries correctly", () => {
    const t = [{ id: "a", weight: 34_000 }, { id: "b", weight: 66_000 }];
    expect(pickByRoll(t, 0).id).toBe("a");
    expect(pickByRoll(t, 33_999).id).toBe("a");
    expect(pickByRoll(t, 34_000).id).toBe("b");
    expect(pickByRoll(t, 99_999).id).toBe("b");
  });

  it("every roll produced is in range", () => {
    for (let n = 0; n < 10_000; n++) {
      const r = computeRoll("s", "c", n);
      expect(r >= 0 && r < WEIGHT_TOTAL).toBe(true);
    }
  });
});

describe("1,000,000 simulated openings match the configured odds", () => {
  const N = 1_000_000;
  it.each(tables)("$name", ({ table, price }) => {
    const counts = simulate(table, N);
    let paid = 0;
    for (const item of table) {
      const p = item.weight / WEIGHT_TOTAL;
      const observed = (counts.get(item.id) ?? 0) / N;
      // 5 standard deviations of a binomial proportion – a false failure has probability ~1e-6 per item.
      const tolerance = 5 * Math.sqrt((p * (1 - p)) / N) + 1e-9;
      expect(Math.abs(observed - p), `${item.name}: observed ${observed}, expected ${p}`).toBeLessThanOrEqual(tolerance);
      paid += (counts.get(item.id) ?? 0) * item.value;
    }
    const rtp = paid / (N * price);
    const expected = table.reduce((s, i) => s + (i.value * i.weight) / WEIGHT_TOTAL, 0) / price;
    expect(Math.abs(rtp - expected)).toBeLessThan(0.02);
  });
});

describe("reel", () => {
  const { table } = tables[2];
  it("places the winner at the win index and includes the top prize as a near miss", () => {
    const winner = table[0];
    const reel = buildReel(table, winner.id);
    expect(reel.ids).toHaveLength(REEL_LENGTH);
    expect(reel.ids[WIN_INDEX]).toBe(winner.id);
    const top = table[table.length - 1].id;
    expect([reel.ids[WIN_INDEX - 1], reel.ids[WIN_INDEX + 1]]).toContain(top);
    expect(Math.abs(reel.offset)).toBeLessThanOrEqual(0.42);
  });

  it("server result decides the reel – the reel never changes the winner", () => {
    const { entry } = resolveOpening(table, "seed", "client", 3);
    for (let i = 0; i < 100; i++) expect(buildReel(table, entry.id).ids[WIN_INDEX]).toBe(entry.id);
  });
});
