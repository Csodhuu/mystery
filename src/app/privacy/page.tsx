export const metadata = { title: "Нууцлалын бодлого – Хайрцаг.mn" };

export default function Privacy() {
  return (
    <article className="card mx-auto max-w-3xl space-y-4 p-6 leading-relaxed text-gray-300 sm:p-10">
      <h1 className="h1">Нууцлалын бодлого</h1>
      <h2 className="text-lg font-bold text-white">Цуглуулах мэдээлэл</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Утасны дугаар (нэвтрэх, SMS баталгаажуулалт)</li>
        <li>Нэр, хүргэлтийн хаяг (дүүрэг, хороо, хаяг) – зөвхөн хүргэлтэд</li>
        <li>Хэтэвчийн гүйлгээ, нээлтийн түүх</li>
      </ul>
      <h2 className="text-lg font-bold text-white">Ашиглах зорилго</h2>
      <p>Таны мэдээллийг зөвхөн үйлчилгээ үзүүлэх, бараа хүргэх, залилангаас сэргийлэх, хууль ёсны шаардлагыг биелүүлэхэд ашиглана. Гуравдагч этгээдэд худалдахгүй.</p>
      <h2 className="text-lg font-bold text-white">Гуравдагч тал</h2>
      <p>Төлбөрийг QPay, SMS-ийг үүрэн холбооны оператор, хүргэлтийг хүргэлтийн түнш гүйцэтгэнэ. Тэдэнд зөвхөн шаардлагатай мэдээллийг дамжуулна.</p>
      <h2 className="text-lg font-bold text-white">Хадгалах хугацаа, эрх</h2>
      <p>Гүйлгээний мэдээллийг хуулийн дагуу хадгална. Та өөрийн мэдээллийг харах, засах, бүртгэлээ устгуулах хүсэлт гаргах эрхтэй.</p>
      <h2 className="text-lg font-bold text-white">Cookie</h2>
      <p>Нэвтрэлтийг хадгалах httpOnly cookie болон дууны тохиргоо, 18+ баталгаажуулалтыг браузерт хадгална.</p>
    </article>
  );
}
