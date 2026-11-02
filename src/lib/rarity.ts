export type RarityKey = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export const RARITIES: RarityKey[] = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

export const RARITY: Record<RarityKey, { label: string; color: string; glow: string; rank: number }> = {
  COMMON: { label: "Энгийн", color: "#9ca3af", glow: "rgba(156,163,175,0.45)", rank: 0 },
  UNCOMMON: { label: "Ховорвтор", color: "#3b82f6", glow: "rgba(59,130,246,0.55)", rank: 1 },
  RARE: { label: "Ховор", color: "#a855f7", glow: "rgba(168,85,247,0.6)", rank: 2 },
  EPIC: { label: "Эпик", color: "#ec4899", glow: "rgba(236,72,153,0.65)", rank: 3 },
  LEGENDARY: { label: "Домогт", color: "#f59e0b", glow: "rgba(245,158,11,0.75)", rank: 4 },
};
