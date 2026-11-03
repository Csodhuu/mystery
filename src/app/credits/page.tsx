import Link from "next/link";
import credits from "../../../prisma/data/image-credits.json";

export const metadata = { title: "Зургийн эх сурвалж – Хайрцаг.mn" };

/** Product photos come from Wikimedia Commons under free licenses; CC BY / BY-SA require this attribution. */
export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Зургийн эх сурвалж</h1>
        <p className="muted mt-1">
          Барааны зургууд{" "}
          <a href="https://commons.wikimedia.org" className="text-neon hover:underline" target="_blank" rel="noreferrer">
            Wikimedia Commons
          </a>
          -оос чөлөөт лицензээр авсан бөгөөд зарим нь яг тухайн загвар биш, төлөөлөх зураг юм. Зохиогчдод баярлалаа!
        </p>
      </div>
      <div className="card overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th />
              <th>Бараа</th>
              <th>Зохиогч</th>
              <th>Лиценз</th>
              <th>Эх файл</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c) => (
              <tr key={c.image}>
                <td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                </td>
                <td className="whitespace-nowrap text-white">{c.item}</td>
                <td className="max-w-[220px] truncate text-gray-400" title={c.author}>
                  {c.author}
                </td>
                <td className="whitespace-nowrap text-gray-400">{c.license}</td>
                <td className="max-w-[260px] truncate">
                  <a href={c.source} className="text-neon hover:underline" target="_blank" rel="noreferrer">
                    {c.title}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/" className="text-sm text-gray-500 hover:text-white">
        ← Нүүр хуудас
      </Link>
    </div>
  );
}
