import { topWins } from "@/server/live";
import { RARITY } from "@/lib/rarity";
import { mnt, timeAgo } from "@/lib/format";

export async function TopWins() {
  const [day, week] = await Promise.all([topWins("day"), topWins("week")]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[
        { title: "Өнөөдрийн топ хожлууд", rows: day },
        { title: "Долоо хоногийн топ хожлууд", rows: week },
      ].map(({ title, rows }) => (
        <div key={title} className="card p-4">
          <h3 className="mb-3 font-bold text-white">🏆 {title}</h3>
          {rows.length === 0 ? (
            <p className="muted">Одоогоор хожил алга.</p>
          ) : (
            <ol className="space-y-2">
              {rows.map((o, i) => {
                const r = RARITY[o.item.rarity];
                return (
                  <li key={o.id} className="flex items-center gap-3 rounded-xl bg-panel2 p-2" style={{ borderLeft: `3px solid ${r.color}` }}>
                    <span className="w-5 text-center text-sm font-black text-gray-500">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.item.image} alt="" className="h-10 w-10 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{o.item.name}</div>
                      <div className="truncate text-xs text-gray-400">
                        {o.user.name} · {o.case.name} · {timeAgo(o.createdAt)}
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: r.color }}>
                      {mnt(o.itemValue)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
