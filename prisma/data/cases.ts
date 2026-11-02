import type { RarityKey } from "../../src/lib/rarity";

export type SeedItem = { name: string; value: number; rarity: RarityKey; percent: number; stock: number; icon: string };
export type SeedCase = { slug: string; name: string; description: string; price: number; color: string; icon: string; items: SeedItem[] };

export const SEED_CASES: SeedCase[] = [
  {
    slug: "starter",
    name: "Starter Case",
    description: "Эхлэгчдэд зориулсан хямд хайрцаг. AirPods 4 хожих боломжтой!",
    price: 10_000,
    color: "#22d3ee",
    icon: "🎁",
    items: [
      { name: "Стикер багц", value: 2_000, rarity: "COMMON", percent: 34, stock: 5000, icon: "🏷️" },
      { name: "Түлхүүрийн оосор", value: 3_000, rarity: "COMMON", percent: 24, stock: 3000, icon: "🔑" },
      { name: "USB-C кабель", value: 5_000, rarity: "COMMON", percent: 15, stock: 2000, icon: "🔌" },
      { name: "Утасны холдер", value: 6_000, rarity: "UNCOMMON", percent: 10, stock: 1000, icon: "📲" },
      { name: "Утасны гэр", value: 8_000, rarity: "UNCOMMON", percent: 7, stock: 800, icon: "📱" },
      { name: "Хурдан цэнэглэгч", value: 15_000, rarity: "RARE", percent: 5, stock: 500, icon: "⚡" },
      { name: "Power bank 10000mAh", value: 35_000, rarity: "RARE", percent: 2.6, stock: 200, icon: "🔋" },
      { name: "Утасгүй чихэвч", value: 60_000, rarity: "EPIC", percent: 1.4, stock: 100, icon: "🎧" },
      { name: "Ухаалаг бугуйвч", value: 80_000, rarity: "EPIC", percent: 0.8, stock: 50, icon: "⌚" },
      { name: "AirPods 4", value: 600_000, rarity: "LEGENDARY", percent: 0.2, stock: 5, icon: "🎧" },
    ],
  },
  {
    slug: "premium",
    name: "Premium Case",
    description: "Илүү үнэ цэнтэй бараа. iPhone 18 хүртэл хожих боломжтой.",
    price: 50_000,
    color: "#a855f7",
    icon: "💎",
    items: [
      { name: "Премиум утасны гэр", value: 15_000, rarity: "COMMON", percent: 49.25, stock: 3000, icon: "📱" },
      { name: "Power bank 20000mAh", value: 35_000, rarity: "COMMON", percent: 30, stock: 2000, icon: "🔋" },
      { name: "Bluetooth чанга яригч", value: 60_000, rarity: "UNCOMMON", percent: 9, stock: 500, icon: "🔊" },
      { name: "Gaming хулгана", value: 70_000, rarity: "UNCOMMON", percent: 7, stock: 400, icon: "🖱️" },
      { name: "Механик гар", value: 120_000, rarity: "RARE", percent: 3, stock: 150, icon: "⌨️" },
      { name: "Ухаалаг цаг", value: 250_000, rarity: "RARE", percent: 1.2, stock: 60, icon: "⌚" },
      { name: "AirPods 4", value: 600_000, rarity: "EPIC", percent: 0.4, stock: 20, icon: "🎧" },
      { name: "iPad", value: 1_500_000, rarity: "EPIC", percent: 0.1, stock: 5, icon: "📲" },
      { name: "iPhone 18", value: 4_500_000, rarity: "LEGENDARY", percent: 0.05, stock: 2, icon: "📱" },
    ],
  },
  {
    slug: "gaming",
    name: "Gaming Case",
    description: "Тоглоомчдын хайрцаг. Бүтэн Gaming Setup хожих боломжтой!",
    price: 100_000,
    color: "#f59e0b",
    icon: "🎮",
    items: [
      { name: "XL хулганы дэвсгэр", value: 25_000, rarity: "COMMON", percent: 44.88, stock: 3000, icon: "🟫" },
      { name: "Gaming хулгана", value: 70_000, rarity: "COMMON", percent: 30, stock: 2000, icon: "🖱️" },
      { name: "Gaming чихэвч", value: 120_000, rarity: "UNCOMMON", percent: 12, stock: 600, icon: "🎧" },
      { name: "Механик гар", value: 150_000, rarity: "UNCOMMON", percent: 8, stock: 400, icon: "⌨️" },
      { name: "Controller", value: 180_000, rarity: "RARE", percent: 4, stock: 200, icon: "🎮" },
      { name: '27" 165Hz монитор', value: 700_000, rarity: "EPIC", percent: 0.6, stock: 20, icon: "🖥️" },
      { name: "Gaming сандал", value: 900_000, rarity: "EPIC", percent: 0.4, stock: 15, icon: "💺" },
      { name: "PlayStation 5", value: 2_000_000, rarity: "EPIC", percent: 0.1, stock: 5, icon: "🕹️" },
      { name: "Бүтэн Gaming Setup (PC + монитор + сандал)", value: 12_000_000, rarity: "LEGENDARY", percent: 0.02, stock: 1, icon: "🏆" },
    ],
  },
];
