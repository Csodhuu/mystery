import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { AgeGate } from "@/components/AgeGate";
import { DEMO_MODE } from "@/lib/env";

export const metadata: Metadata = {
  title: "Хайрцаг.mn – Mystery box",
  description: "Хайрцаг нээж, бодит бараа хожоорой. Шударга байдал баталгаатай (provably fair).",
};

const nunito = Nunito({ subsets: ["latin", "cyrillic", "cyrillic-ext"], weight: ["400", "600", "700", "800", "900"], variable: "--font-nunito", display: "swap" });

export const viewport: Viewport = { themeColor: "#07080d", width: "device-width", initialScale: 1 };

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={nunito.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {DEMO_MODE && (
          <div className="bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_12px,#d97706_12px,#d97706_24px)] py-1 text-center text-xs font-black uppercase tracking-widest text-black">
            DEMO MODE · Бүх өгөгдөл, төлбөр, SMS нь хуурамч · OTP код: 1234 ·{" "}
            <Link href="/dev" className="underline">
              /dev
            </Link>
          </div>
        )}
        <Header />
        <LiveTicker />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-line py-8 text-sm text-gray-500">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Хайрцаг.mn · 18+ · Хариуцлагатай тоглоорой</div>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="hover:text-white">
                Үйлчилгээний нөхцөл
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Нууцлалын бодлого
              </Link>
              <Link href="/fairness" className="hover:text-white">
                Шударга байдал
              </Link>
              <Link href="/fairness/verify" className="hover:text-white">
                Шалгах
              </Link>
              <Link href="/credits" className="hover:text-white">
                Зургийн эх сурвалж
              </Link>
            </div>
          </div>
        </footer>
        <AgeGate />
      </body>
    </html>
  );
}
