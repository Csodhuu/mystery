import { RARITY, type RarityKey } from "@/lib/rarity";
import { mnt, pct } from "@/lib/format";

export function RarityBadge({ rarity }: { rarity: RarityKey }) {
  const r = RARITY[rarity];
  return (
    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: r.color, background: `${r.color}1f` }}>
      {r.label}
    </span>
  );
}

export function ItemCard({
  name,
  value,
  rarity,
  image,
  weight,
  stock,
  compact,
}: {
  name: string;
  value: number;
  rarity: RarityKey;
  image: string;
  weight?: number;
  stock?: number;
  compact?: boolean;
}) {
  const r = RARITY[rarity];
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-panel2 transition hover:-translate-y-1"
      style={{ borderBottom: `3px solid ${r.color}`, boxShadow: `0 8px 28px -14px ${r.glow}` }}
    >
      {weight !== undefined && (
        <span className="absolute right-2 top-2 z-10 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">{pct(weight)}</span>
      )}
      <div className="relative aspect-square p-2" style={{ background: `radial-gradient(circle at 50% 60%, ${r.glow}, transparent 70%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} loading="lazy" className="h-full w-full rounded-xl object-cover transition duration-300 group-hover:scale-105" draggable={false} />
      </div>
      <div className={compact ? "p-2" : "p-3"}>
        <div className="line-clamp-2 min-h-[2.5em] text-xs font-semibold leading-tight text-white sm:text-sm">{name}</div>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-xs font-bold" style={{ color: r.color }}>
            {mnt(value)}
          </span>
          {!compact && <RarityBadge rarity={rarity} />}
        </div>
        {stock !== undefined && stock <= 0 && <div className="mt-1 text-[11px] font-semibold text-rose-400">Дууссан</div>}
      </div>
    </div>
  );
}
