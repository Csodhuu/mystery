import Link from "next/link";
import { RARITY, type RarityKey } from "@/lib/rarity";
import { mnt } from "@/lib/format";

type Prize = { name: string; value: number; rarity: RarityKey; image: string };

/** Fan positions for the top prizes: best in the middle, the next two tilted behind it. */
const FAN = [
  { x: 0, r: 0, z: 3, s: 1 },
  { x: -58, r: -12, z: 2, s: 0.82 },
  { x: 58, r: 12, z: 1, s: 0.82 },
];

export function CaseCard({ slug, name, price, image, color, top = [] }: { slug: string; name: string; price: number; image: string; color: string; top?: Prize[] }) {
  const best = top[0];
  return (
    <Link
      href={`/case/${slug}`}
      className="group card relative flex flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: `0 24px 70px -34px ${color}` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 transition group-hover:opacity-70" style={{ background: `radial-gradient(circle at 50% 35%, ${color}55, transparent 62%)` }} />

      <div className="relative grid h-52 place-items-center">
        {/* the case sits behind; its top prizes fan out in front */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="absolute -top-2 h-36 w-36 transition duration-500 group-hover:-translate-y-2 group-hover:rotate-[-6deg]" />
        {top.map((p, i) => {
          const f = FAN[i];
          const r = RARITY[p.rarity];
          return (
            <div
              key={i}
              className="absolute h-28 w-28 overflow-hidden rounded-2xl border-2 bg-panel2 transition-transform duration-500 ease-out"
              style={{
                zIndex: f.z,
                borderColor: r.color,
                boxShadow: `0 10px 30px -8px ${r.glow}`,
                transform: `translateX(${f.x}px) translateY(18px) rotate(${f.r}deg) scale(${f.s})`,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-full w-full object-cover" />
            </div>
          );
        })}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-white">{name}</h3>
          <div className="text-lg font-black" style={{ color }}>
            {mnt(price)}
          </div>
        </div>
        <span className="btn-primary pointer-events-none">Нээх</span>
      </div>
      {best && (
        <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-2" style={{ borderBottom: `2px solid ${RARITY[best.rarity].color}` }}>
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Гол шагнал</div>
          <div className="min-w-0 flex-1 truncate text-sm font-bold text-white">{best.name}</div>
          <div className="text-sm font-black" style={{ color: RARITY[best.rarity].color }}>
            {mnt(best.value)}
          </div>
        </div>
      )}
    </Link>
  );
}
