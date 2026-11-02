# Хайрцаг.mn: mystery box (case opening) platform

A mystery box website for the Mongolian market: users top up an MNT wallet, open a case with a 3D-box + CS2-style reel animation, win a real product and have it delivered in Ulaanbaatar. The UI is in Mongolian; amounts are whole tögrög (₮).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · Framer Motion · PostgreSQL · Prisma · Recharts · Vitest

---

## Quick start

Requirements: Node 20+ and a PostgreSQL 14+ server (local install, Docker, Postgres.app, any of them).

```bash
cp .env.example .env          # then set DATABASE_URL to your Postgres
npm install
npm run seed                  # creates tables + seeds everything
npm run dev                   # http://localhost:3000
```

If you don't have Postgres yet: `docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`
(this matches the default `DATABASE_URL` in `.env.example`; create the db with `createdb hairtsag` or let Prisma create it).

| Command | What it does |
|---|---|
| `npm run seed` | Pushes the schema, wipes app data and seeds everything |
| `npm run reset` | Drops and recreates all tables, then seeds |
| `npm test` | Unit tests (includes 3 × 1,000,000 simulated openings) |
| `npm run build && npm start` | Production build |

### Logging in (demo)

- **User:** any 8-digit number starting with 6–9 on `/login`, OTP **`1234`**. Or open `/dev` and log in as any of the 50 dummy users with one click.
- **Admin:** `/admin/login` with `ADMIN_PHONE` / `ADMIN_PASSWORD` from `.env` (default `88000000` / `admin-demo-pass`). Change them, then rerun `npm run seed`.

---

## DEMO_MODE

`DEMO_MODE=true` in `.env` makes the app run with **no external accounts at all**. Setting it to `false` disables every mock, fake user and bot drop:

| Feature | `DEMO_MODE=true` | `DEMO_MODE=false` |
|---|---|---|
| SMS OTP | `MockSmsProvider`: code is always `1234`, printed to the server console | `GatewaySmsProvider`: random code, needs a real SMS gateway (stub throws until implemented) |
| QPay | `MockQPayProvider`: fake QR, auto-pays after 3 s, callback buttons in the payment modal and on `/dev` | `QPayProvider` stub (`src/server/payments/qpay.ts`) with the integration steps documented |
| Delivery | Background job: requested → shipped after 1 min → delivered 3 min after the request (only for orders requested at runtime) | Admin moves statuses manually in `/admin/orders` |
| Live drops bot | A fake drop every 5–15 s from a random dummy user, rolled with the real probability tables, labelled **DEMO** in the ticker. It never touches stock or balances. | Off. The ticker shows only real drops |
| Dummy users (`isDemo`) | 50 users with test numbers `99990001`–`99990050` | Can't log in, hidden from the ticker and top wins, not created by the seed |
| `/dev` page and dev APIs | Available | 404 |
| Banner | Striped **DEMO MODE** bar on every page | None |

The background jobs start from `src/instrumentation.ts` and only when `DEMO_MODE=true`.

### What the seed creates (`prisma/seed.ts`)

- The 3 cases exactly as specified (`prisma/data/cases.ts`). Probabilities are validated to sum to 100%, and EV/RTP is printed.
- Local placeholder SVG images (rarity gradient + icon) in `public/generated/`. No external image URLs.
- 1 admin from `.env`.
- Demo mode only:
  - 50 dummy users with Mongolian names.
  - **500 openings over the last 30 days, run through the real `openCase()` transaction** (same HMAC RNG, probability table, stock decrement and balance debit as production). Their server seeds are revealed afterwards, so every seeded opening can be checked on `/fairness/verify`.
  - QPay mock top-ups created just in time so a balance never goes negative. Final balances land between 0 and 500,000₮ and always equal top-ups minus spending.
  - Order statuses split exactly 40% inventory / 25% requested / 20% shipped / 15% delivered, with Ulaanbaatar addresses.

### `/dev` tools

Add balance to the current user · log in as any dummy user · create a pending invoice and fire the QPay **Амжилттай / Амжилтгүй** callbacks · simulate 10,000 openings of a case and compare actual vs configured drop rates and RTP.

---

## Fairness & security

- **Server-decided outcome.** `POST /api/cases/:slug/open` picks the item. The response contains the winner plus a reel layout (60 cards, winner at index 52, random stop offset ±42% of a card, rarity-weighted fillers, the top prize placed as a near miss). The client only animates to that answer.
- **Provably fair** (`src/lib/fairness.ts`):
  - Each user has a server seed (32 random bytes). Its SHA-256 hash is shown **before** opening.
  - The user can set their own client seed. The nonce increases by one per opening.
  - `roll = floor(int(first 13 hex of HMAC_SHA256(serverSeed, "clientSeed:nonce")) × 100000 / 2^52)`, mapped onto the cumulative table. Weights are stored as integers in units of 0.001%, so 100% = 100,000.
  - Rotating the seed reveals the old one. `/fairness/verify` recomputes everything in the browser with Web Crypto and checks it against the stored hash, roll and the probability table snapshot saved with each opening.
- **Atomic transaction:** the case's item rows are locked (`FOR UPDATE`), every item must have stock > 0, the balance is debited with a conditional `UPDATE … WHERE balance >= price`, the nonce is reserved, and the stock is decremented, all in one DB transaction.
- **Idempotency:** each click sends an `Idempotency-Key`, backed by a unique `(userId, idempotencyKey)` constraint. Repeated or concurrent requests with the same key return the original result and are charged once.
- **Payments:** `settlePayment()` only moves a `PENDING` payment, so the balance is credited exactly once whatever the callback order.
- Sessions are HMAC-signed httpOnly cookies. The admin password is hashed with scrypt. OTPs are hashed, expire after 5 minutes and lock after 5 failed attempts.

### Plugging in real services

- **QPay:** implement `QPayProvider` (`src/server/payments/qpay.ts`, which follows the `PaymentProvider` interface in `provider.ts`) and set the `QPAY_*` env vars.
- **SMS:** implement `GatewaySmsProvider.send()` in `src/server/sms.ts`.

---

## Project layout

```
prisma/schema.prisma        data model
prisma/seed.ts              seed (uses the real opening logic)
prisma/data/cases.ts        the 3 seeded cases
src/lib/fairness.ts         RNG + probability mapping (shared by server, seed, tests, /dev)
src/lib/reel.ts             reel layout builder
src/server/opening.ts       the opening transaction
src/server/payments/        PaymentProvider, MockQPayProvider, QPayProvider stub
src/server/demo-jobs.ts     delivery mock + live-drop bot
src/app/api/live            SSE live-drop stream
src/components/opening/     BoxAnimation, Reel, WinModal, Web Audio sounds
src/app/admin/              dashboard, case/item CRUD + probability editor, orders, users, top-ups
tests/fairness.test.ts      RNG/probability unit tests
```

## Tests

`npm test` covers:

- every seeded table sums to 100% and matches the specified EV;
- the HMAC-SHA256 known vector and the roll mapping, including both ends of the 52-bit range and the cumulative boundaries;
- **1,000,000 simulated openings per case**, with each item's observed rate within 5σ of its configured odds (including the 0.02% Gaming Setup) and RTP within 2 percentage points;
- the reel always puts the server's winner under the marker.

## Legal note

Paid loot boxes with real prizes can count as gambling or lotteries under Mongolian law. Get legal advice and any licence you need before running this for real money. The 18+ gate, Terms and Privacy pages included here are templates.
# mystery
