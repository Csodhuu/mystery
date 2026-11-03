"use client";
import { useEffect, useState } from "react";
import { Mascot, pickLine, type Mood } from "./Mascot";

/** Big Тарваа in the home hero: chats on its own, gets excited when hovered. */
export function HeroMascot() {
  const [mood, setMood] = useState<Mood>("idle");
  const [line, setLine] = useState<string | null>(null);
  useEffect(() => {
    setLine("Сайн уу! Би Тарваа 👋");
    const t = setInterval(() => setLine(pickLine("idle")), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className="pointer-events-auto absolute bottom-4 right-4 hidden md:block lg:right-16"
      onMouseEnter={() => {
        setMood("excited");
        setLine(pickLine("excited"));
      }}
      onMouseLeave={() => setMood("idle")}
    >
      <Mascot mood={mood} say={line} size={190} />
    </div>
  );
}
