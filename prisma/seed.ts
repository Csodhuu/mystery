import "dotenv/config";
import { randomInt, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/server/db";
import { openCase } from "../src/server/opening";
import { createSeedPair, rotateSeed } from "../src/server/seeds";
import { hashPassword } from "../src/server/password";
import { AppError } from "../src/server/errors";
import { percentToWeight, WEIGHT_TOTAL } from "../src/lib/fairness";
import { itemSvg, caseSvg } from "../src/lib/svg";
import { UB_DISTRICTS } from "../src/lib/format";
import { SEED_CASES } from "./data/cases";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DAY = 86_400_000;
const now = Date.now();

const SURNAME_INITIALS = ["Б", "Г", "Э", "Д", "Н", "О", "Т", "С", "Ж", "Ц", "М", "А", "П", "Х", "У"];
const GIVEN_NAMES = [
  "Болд", "Сараа", "Тэмүүлэн", "Анужин", "Бат-Эрдэнэ", "Номин", "Ганзориг", "Энхжин", "Мөнх-Очир", "Солонго",
  "Тэлмэн", "Оюунчимэг", "Билгүүн", "Мишээл", "Хулан", "Төгөлдөр", "Ариунаа", "Эрдэнэбат", "Цэцэгээ", "Дөлгөөн",
  "Мандах", "Нарантуяа", "Сүхбат", "Уянга", "Тэнгис", "Гэрэлмаа", "Баясгалан", "Золзаяа", "Отгонбаяр", "Индра",
  "Хонгор", "Мөнхзул", "Батзориг", "Сэлэнгэ", "Амар", "Гантулга", "Энхтуул", "Ширээ", "Лхагва", "Түвшин",
  "Пүрэв", "Эгшиглэн", "Ууганбаяр", "Нандин", "Чинзориг", "Есүй", "Жавхлан", "Марал", "Анхбаяр", "Сондор",
];
const STREETS = ["Энхтайвны өргөн чөлөө", "Чингисийн өргөн чөлөө", "Их тойруу", "Сөүлийн гудамж", "Жуковын гудамж", "Нарны зам", "Зайсангийн гудамж", "Токиогийн гудамж"];
const KHOROO_MAX: Record<string, number> = {
  Баянгол: 34, Баянзүрх: 43, Сонгинохайрхан: 43, Сүхбаатар: 20, "Хан-Уул": 25, Чингэлтэй: 24, Налайх: 8, Багануур: 5, Багахангай: 2,
};

const pick = <T,>(a: readonly T[]) => a[randomInt(a.length)];

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function wipe() {
  await prisma.liveDrop.deleteMany();
  await prisma.order.deleteMany();
  await prisma.opening.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.serverSeed.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.item.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();
}

function writeImages() {
  const dir = path.join(process.cwd(), "public", "generated");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(path.join(dir, "items"), { recursive: true });
  mkdirSync(path.join(dir, "cases"), { recursive: true });
  const paths = new Map<string, string>();
  for (const c of SEED_CASES) {
    writeFileSync(path.join(dir, "cases", `${c.slug}.svg`), caseSvg(c.color, c.icon));
    c.items.forEach((it, i) => {
      const file = `${c.slug}-${i + 1}.svg`;
      writeFileSync(path.join(dir, "items", file), itemSvg(it.icon, it.rarity));
      paths.set(`${c.slug}:${i}`, `/generated/items/${file}`);
    });
  }
  return paths;
}

async function seedCases(images: Map<string, string>) {
  for (const [ci, c] of SEED_CASES.entries()) {
    const weights = c.items.map((i) => percentToWeight(i.percent));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total !== WEIGHT_TOTAL) throw new Error(`${c.name}: probabilities sum to ${total / 1000}%, expected 100%`);
    const ev = c.items.reduce((s, i, k) => s + (i.value * weights[k]) / WEIGHT_TOTAL, 0);
    await prisma.case.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        price: c.price,
        color: c.color,
        image: `/generated/cases/${c.slug}.svg`,
        sortOrder: ci,
        items: {
          create: c.items.map((it, i) => ({
            name: it.name,
            value: it.value,
            rarity: it.rarity,
            weight: weights[i],
            stock: it.stock,
            image: images.get(`${c.slug}:${i}`)!,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`  📦 ${c.name.padEnd(14)} ${c.price.toLocaleString()}₮  EV ${Math.round(ev).toLocaleString()}₮ (${((ev / c.price) * 100).toFixed(1)}%)`);
  }
}

async function seedAdmin() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!phone || !password) {
    console.warn("  ⚠️  ADMIN_PHONE/ADMIN_PASSWORD тохируулаагүй тул админ үүсгэсэнгүй");
    return;
  }
  const admin = await prisma.user.create({
    data: { phone, name: "Админ", role: "ADMIN", passwordHash: hashPassword(password), ageConfirmedAt: new Date() },
  });
  await createSeedPair(prisma, admin.id);
  console.log(`  🛡️  Админ: ${phone} (нууц үг .env-ээс)`);
}

async function seedDemo() {
  // 50 dummy users. 9999xxxx numbers are reserved test numbers (isDemo = true).
  const users: { id: string; balance: number; target: number; last: number }[] = [];
  for (let i = 0; i < 50; i++) {
    const u = await prisma.user.create({
      data: {
        phone: `9999${String(i + 1).padStart(4, "0")}`,
        name: `${SURNAME_INITIALS[i % SURNAME_INITIALS.length]}.${GIVEN_NAMES[i]}`,
        isDemo: true,
        ageConfirmedAt: new Date(now - 31 * DAY),
        createdAt: new Date(now - 31 * DAY + randomInt(DAY)),
      },
    });
    await createSeedPair(prisma, u.id);
    users.push({ id: u.id, balance: 0, target: randomInt(0, 50) * 10_000, last: 0 });
  }
  console.log(`  👥 ${users.length} demo хэрэглэгч (99990001–99990050)`);

  // 500 openings over the last 30 days, run through the REAL openCase transaction.
  const caseBySlug = Object.fromEntries((await prisma.case.findMany()).map((c) => [c.slug, c]));
  const plan = Array.from({ length: 500 }, () => {
    const r = randomInt(100);
    return {
      user: pick(users),
      slug: r < 55 ? "starter" : r < 85 ? "premium" : "gaming",
      at: now - randomInt(30 * DAY - 3_600_000) - 60_000,
    };
  }).sort((a, b) => a.at - b.at);

  const TOPUP_STEPS = [20_000, 50_000, 100_000, 200_000, 300_000, 500_000];
  let payments = 0;
  let opened = 0;
  for (const p of plan) {
    const price = caseBySlug[p.slug].price;
    if (p.user.balance < price) {
      const options = TOPUP_STEPS.filter((a) => p.user.balance + a >= price && p.user.balance + a <= 500_000);
      const amount = pick(options);
      const at = new Date(p.at - randomInt(60_000, 3_600_000));
      // Occasionally a failed attempt right before the successful one.
      if (randomInt(10) === 0) {
        await prisma.payment.create({
          data: { userId: p.user.id, amount, provider: "qpay-mock", status: "FAILED", invoiceId: `MOCK-SEED-${randomUUID().slice(0, 8)}`, createdAt: new Date(at.getTime() - 120_000), settledAt: at },
        });
        payments++;
      }
      await prisma.payment.create({
        data: { userId: p.user.id, amount, provider: "qpay-mock", status: "PAID", invoiceId: `MOCK-SEED-${randomUUID().slice(0, 8)}`, createdAt: at, settledAt: new Date(at.getTime() + 3000) },
      });
      await prisma.user.update({ where: { id: p.user.id }, data: { balance: { increment: amount } } });
      p.user.balance += amount;
      payments++;
    }
    try {
      const res = await openCase({ userId: p.user.id, slug: p.slug, idempotencyKey: randomUUID(), at: new Date(p.at) });
      p.user.balance = res.balance;
      p.user.last = p.at;
      opened++;
    } catch (e) {
      if (e instanceof AppError && e.code === "OUT_OF_STOCK") continue; // e.g. the single Gaming Setup was won
      throw e;
    }
  }
  console.log(`  🎰 ${opened} нээлт (бодит RNG + магадлалын хүснэгтээр)`);

  // Final top-ups so balances land on a random 0–500,000₮ target; reveal the seeds used for history.
  for (const u of users) {
    if (u.balance < u.target) {
      const amount = u.target - u.balance;
      const from = u.last || now - 30 * DAY;
      const at = new Date(from + randomInt(30_000, Math.max(60_000, now - from)));
      await prisma.payment.create({
        data: { userId: u.id, amount, provider: "qpay-mock", status: "PAID", invoiceId: `MOCK-SEED-${randomUUID().slice(0, 8)}`, createdAt: at, settledAt: at },
      });
      await prisma.user.update({ where: { id: u.id }, data: { balance: { increment: amount } } });
      u.balance += amount;
      payments++;
    }
    await rotateSeed(u.id);
  }
  console.log(`  💳 ${payments} QPay mock гүйлгээ (үлдэгдэлтэй тохирсон)`);

  // Order statuses: 40% inventory, 25% requested, 20% shipped, 15% delivered.
  const orders = shuffle(await prisma.order.findMany({ include: { user: true } }));
  const n = orders.length;
  const cut = [Math.round(n * 0.4), Math.round(n * 0.65), Math.round(n * 0.85)];
  for (const [i, o] of orders.entries()) {
    if (i < cut[0]) continue;
    const district = pick(UB_DISTRICTS.slice(0, 6));
    const requestedAt = new Date(Math.min(now - 3_600_000, o.createdAt.getTime() + randomInt(600_000, 2 * DAY)));
    const shippedAt = new Date(Math.min(now - 1_800_000, requestedAt.getTime() + randomInt(3_600_000, DAY)));
    const deliveredAt = new Date(Math.min(now - 600_000, shippedAt.getTime() + randomInt(3_600_000, 2 * DAY)));
    const status = i < cut[1] ? "DELIVERY_REQUESTED" : i < cut[2] ? "SHIPPED" : "DELIVERED";
    await prisma.order.update({
      where: { id: o.id },
      data: {
        status,
        fullName: o.user.name,
        phone: o.user.phone,
        district,
        khoroo: String(1 + randomInt(KHOROO_MAX[district])),
        address: `${pick(STREETS)}, ${1 + randomInt(120)}-р байр, ${1 + randomInt(12)}-р орц, ${1 + randomInt(200)} тоот`,
        requestedAt,
        shippedAt: status === "SHIPPED" || status === "DELIVERED" ? shippedAt : null,
        deliveredAt: status === "DELIVERED" ? deliveredAt : null,
      },
    });
  }
  console.log(`  🚚 ${n} захиалга: ${cut[0]} агуулахад / ${cut[1] - cut[0]} хүссэн / ${cut[2] - cut[1]} илгээсэн / ${n - cut[2]} хүргэгдсэн`);
}

async function main() {
  // --if-empty: used by the Vercel build, never wipes an already seeded database
  if (process.argv.includes("--if-empty") && (await prisma.case.count()) > 0) {
    console.log("ℹ️  Өгөгдөл байгаа тул seed алгаслаа");
    return;
  }
  console.log(`🌱 Seed эхэллээ (DEMO_MODE=${DEMO_MODE})`);
  await wipe();
  const images = writeImages();
  await seedCases(images);
  await seedAdmin();
  if (DEMO_MODE) await seedDemo();
  else console.log("  ℹ️  DEMO_MODE=false: demo хэрэглэгч, түүх үүсгэсэнгүй");
  console.log("✅ Дууслаа");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
