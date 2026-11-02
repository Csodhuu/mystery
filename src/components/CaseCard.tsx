import Link from "next/link";
import { RARITY, type RarityKey } from "@/lib/rarity";
import { mnt } from "@/lib/format";

export function CaseCard({
  slug,
  name,
  price,
  image,
  color,
  top,
}: {
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  top?: { name: string; value: number; rarity: RarityKey; image: string };
}) {
  return (
    <Link
      href={`/case/${slug}`}
      className="group card relative flex flex-col overflow-hidden p-5 transition hover:-translate-y-1"
      style={{ boxShadow: `0 20px 60px -30px ${color}` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 transition group-hover:opacity-60" style={{ background: `radial-gradient(circle at 50% 30%, ${color}55, transparent 60%)` }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={name} className="relative mx-auto aspect-square w-48 transition duration-500 group-hover:rotate-[-4deg] group-hover:scale-110" />
      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-extrabold text-white">{name}</h3>
          <div className="text-lg font-black" style={{ color }}>
            {mnt(price)}
          </div>
        </div>
        <span className="btn-primary pointer-events-none">Нээх</span>
      </div>
      {top && (
        <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-line bg-black/30 p-2" style={{ borderBottom: `2px solid ${RARITY[top.rarity].color}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={top.image} alt="" className="h-10 w-10 rounded-lg" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Гол шагнал</div>
            <div className="truncate text-sm font-semibold text-white">{top.name}</div>
          </div>
          <div className="ml-auto text-sm font-bold" style={{ color: RARITY[top.rarity].color }}>
            {mnt(top.value)}
          </div>
        </div>
      )}
    </Link>
  );
}
