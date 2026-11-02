import Link from "next/link";
import { getUser } from "@/server/auth";
import { FairnessPanel } from "./FairnessPanel";

export default async function FairnessPage() {
  const user = await getUser();
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <article className="card space-y-4 p-6 leading-relaxed text-gray-300">
        <h1 className="h1">Шударга байдал (Provably Fair)</h1>
        <p>
          Хайрцаг бүрийн үр дүнг <b className="text-white">зөвхөн сервер</b> тодорхойлдог бөгөөд таны дэлгэц дээрх анимэйшн нь серверийн шийдвэрийг л харуулдаг. Харин
          сервер үр дүнг дараа нь өөрчлөөгүй гэдгийг та өөрөө математикаар шалгаж болно.
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <b className="text-white">Амлалт (commit).</b> Сервер 256-бит санамсаргүй <code className="text-neon">server seed</code> үүсгээд, нээхээс өмнө түүний{" "}
            <code className="text-neon">SHA-256</code> hash-ийг танд харуулна. Seed өөрөө нууц хэвээр.
          </li>
          <li>
            <b className="text-white">Таны оролцоо.</b> Та өөрийн <code className="text-neon">client seed</code>-ийг хүссэнээрээ сольж болно. Нээлт бүрт{" "}
            <code className="text-neon">nonce</code> 1-ээр нэмэгдэнэ.
          </li>
          <li>
            <b className="text-white">Үр дүн.</b> <code className="break-all text-neon">HMAC_SHA256(serverSeed, clientSeed:nonce)</code> hash-ийн эхний 13 hex тэмдэгтийг (52 бит)
            0–99,999 хоорондох тоо (roll) болгоно. Энэ тоо барааны магадлалын хүснэгтийн аль хэсэгт орсноор хожил тодорхойлогдоно (жишээ нь 0.2% = 200 нэгж).
          </li>
          <li>
            <b className="text-white">Илчлэх (reveal).</b> Та seed-ээ солиход хуучин server seed илчлэгдэнэ. Түүний hash нь өмнө харуулсан hash-тай таарч, бүх нээлтийн roll дахин
            бодоход ижил гарвал үр дүн өөрчлөгдөөгүй гэсэн үг.
          </li>
        </ol>
        <p>
          Үүнээс гадна төлбөр нь өгөгдлийн сангийн нэг transaction дотор атомаар хасагдаж, давхар дарахаас idempotency key хамгаалдаг. Хайрцагны бүх бараа нөөцтэй үед л нээгдэнэ.
        </p>
        <Link href="/fairness/verify" className="btn-primary">
          Нээлт шалгах →
        </Link>
      </article>
      {user ? (
        <FairnessPanel />
      ) : (
        <div className="card p-6 text-gray-400">
          Өөрийн seed-ийг харах, солихын тулд{" "}
          <Link href="/login?next=/fairness" className="text-neon underline">
            нэвтэрнэ үү
          </Link>
          .
        </div>
      )}
    </div>
  );
}
