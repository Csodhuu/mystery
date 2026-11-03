"use client";
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion";
import { useEffect, useState } from "react";

/** Тарваа – the site's marmot mascot. Each mood changes the face and how the body moves. */
export type Mood = "idle" | "excited" | "nervous" | "happy" | "ecstatic" | "sad" | "sleepy";

const BODY: Record<Mood, TargetAndTransition> = {
  idle: { y: [0, -3, 0], rotate: 0, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  excited: { y: [0, -14, 0], rotate: [0, -4, 4, 0], transition: { duration: 0.55, repeat: Infinity, ease: "easeOut" } },
  nervous: { x: [0, -1.5, 1.5, -1, 1, 0], rotate: 0, transition: { duration: 0.35, repeat: Infinity } },
  happy: { y: [0, -10, 0], rotate: [0, 3, -3, 0], transition: { duration: 0.8, repeat: Infinity, ease: "easeOut" } },
  ecstatic: { y: [0, -26, 0], rotate: [0, -10, 10, 0], scale: [1, 1.06, 1], transition: { duration: 0.6, repeat: Infinity, ease: "easeOut" } },
  sad: { y: 4, rotate: -4, transition: { duration: 0.6 } },
  sleepy: { y: [2, 4, 2], rotate: 5, transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } },
};

const C = { fur: "#c98a4b", furDark: "#9a6332", belly: "#f6dcb4", nose: "#5b3a22", ink: "#24160d", blush: "#ff8fa3", tooth: "#fffaf0" };

export function Mascot({
  mood = "idle",
  size = 120,
  say,
  bubble = "center",
  className = "",
}: {
  mood?: Mood;
  size?: number;
  say?: string | null;
  /** "right" keeps the speech bubble on-screen when Тарваа sits in a right-hand corner */
  bubble?: "center" | "right";
  className?: string;
}) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (mood === "sleepy" || mood === "ecstatic") return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 2600);
    };
    loop();
    return () => clearTimeout(t);
  }, [mood]);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`} style={{ width: size }}>
      <AnimatePresence mode="wait">
        {say && (
          <motion.div
            key={say}
            className={`absolute bottom-full z-10 mb-1 w-max max-w-[220px] rounded-2xl border border-line bg-white px-3 py-2 text-center text-xs font-bold leading-snug text-gray-900 ${bubble === "right" ? "right-0" : ""}`}
            style={{ boxShadow: "0 12px 30px -10px rgba(0,0,0,.6)" }}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
          >
            {say}
            <span
              className={`absolute top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[8px] border-x-transparent border-t-white ${bubble === "right" ? "right-[18%]" : "left-1/2"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.svg viewBox="0 0 120 120" width={size} height={size} animate={BODY[mood]} style={{ originY: 1 }} aria-hidden>
        {/* shadow */}
        <ellipse cx="60" cy="114" rx="30" ry="4" fill="#000" opacity="0.25" />
        {/* ears */}
        <ellipse cx="33" cy="30" rx="9" ry="8" fill={C.furDark} />
        <ellipse cx="87" cy="30" rx="9" ry="8" fill={C.furDark} />
        <ellipse cx="33" cy="31" rx="4.5" ry="4" fill={C.blush} opacity="0.7" />
        <ellipse cx="87" cy="31" rx="4.5" ry="4" fill={C.blush} opacity="0.7" />
        {/* body */}
        <path d="M60 18c-27 0-40 22-40 50 0 26 14 44 40 44s40-18 40-44c0-28-13-50-40-50z" fill={C.fur} />
        <path d="M60 56c-16 0-23 14-23 28 0 16 9 25 23 25s23-9 23-25c0-14-7-28-23-28z" fill={C.belly} />
        {/* forehead stripe */}
        <path d="M52 22c3 6 13 6 16 0" stroke={C.furDark} strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* paws */}
        <Paws mood={mood} />
        {/* feet */}
        <ellipse cx="45" cy="110" rx="9" ry="4.5" fill={C.furDark} />
        <ellipse cx="75" cy="110" rx="9" ry="4.5" fill={C.furDark} />
        {/* cheeks */}
        <ellipse cx="36" cy="58" rx="6" ry="4" fill={C.blush} opacity={mood === "sad" ? 0.25 : 0.55} />
        <ellipse cx="84" cy="58" rx="6" ry="4" fill={C.blush} opacity={mood === "sad" ? 0.25 : 0.55} />
        <Face mood={mood} blink={blink} />
        {mood === "sleepy" && (
          <motion.text x="92" y="26" fontSize="14" fontWeight="900" fill="#9ca3af" animate={{ opacity: [0, 1, 0], y: [26, 14, 6] }} transition={{ duration: 2.4, repeat: Infinity }}>
            z
          </motion.text>
        )}
        {mood === "ecstatic" && <Sparkles />}
        {mood === "nervous" && (
          <motion.path d="M96 34c3 5 3 9 0 11-3-2-3-6 0-11z" fill="#7dd3fc" animate={{ y: [0, 10], opacity: [1, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />
        )}
      </motion.svg>
    </div>
  );
}

function Face({ mood, blink }: { mood: Mood; blink: boolean }) {
  const eye = (cx: number) => {
    if (mood === "sleepy" || blink) return <path d={`M${cx - 6} 46q6 4 12 0`} stroke={C.ink} strokeWidth="3" strokeLinecap="round" fill="none" />;
    if (mood === "happy" || mood === "ecstatic") return <path d={`M${cx - 6} 48q6 -8 12 0`} stroke={C.ink} strokeWidth="3.4" strokeLinecap="round" fill="none" />;
    const big = mood === "excited" || mood === "nervous";
    return (
      <g>
        <ellipse cx={cx} cy="46" rx={big ? 7 : 6} ry={big ? 8 : 7} fill={C.ink} />
        <circle cx={cx + 2} cy="43" r="2.4" fill="#fff" />
        <circle cx={cx - 2} cy="49" r="1.1" fill="#fff" />
      </g>
    );
  };
  return (
    <g>
      {mood === "sad" && (
        <>
          {/* inner ends raised = worried/sad (lowered would read as angry) */}
          <path d="M37 39l10 -4" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M83 39l-10 -4" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" />
          <motion.ellipse cx="38" cy="56" rx="2.2" ry="3" fill="#7dd3fc" animate={{ cy: [54, 66], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
        </>
      )}
      {mood === "nervous" && (
        <>
          <path d="M37 35l10 -2" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M83 35l-10 -2" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {eye(44)}
      {eye(76)}
      {/* muzzle */}
      <ellipse cx="60" cy="60" rx="11" ry="8" fill={C.belly} />
      <path d="M56 55h8l-4 4z" fill={C.nose} strokeLinejoin="round" stroke={C.nose} strokeWidth="2" />
      <Mouth mood={mood} />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  const s = { stroke: C.ink, strokeWidth: 2.2, strokeLinecap: "round" as const, fill: "none" };
  switch (mood) {
    case "ecstatic":
    case "excited":
      return (
        <g>
          <path d="M51 62q9 11 18 0z" fill={C.ink} />
          <rect x="57" y="62" width="6" height="4" rx="1" fill={C.tooth} />
        </g>
      );
    case "happy":
      return <path d="M53 62q7 7 14 0" {...s} />;
    case "sad":
      return <path d="M54 68q6 -6 12 0" {...s} />;
    case "nervous":
      return <path d="M53 65q2.5 -3 5 0t5 0t4 0" {...s} />;
    case "sleepy":
      return <ellipse cx="60" cy="65" rx="2.4" ry="2" fill={C.ink} />;
    default:
      return (
        <g>
          <path d="M60 59v3M60 62q-4 4 -7 1M60 62q4 4 7 1" {...s} />
          <rect x="57.5" y="62" width="5" height="4" rx="1" fill={C.tooth} />
        </g>
      );
  }
}

function Paws({ mood }: { mood: Mood }) {
  const paw = (cx: number, cy: number) => (
    <g>
      <ellipse cx={cx} cy={cy} rx="6.5" ry="7.5" fill={C.furDark} />
      <ellipse cx={cx} cy={cy + 2.5} rx="3.2" ry="2.6" fill={C.belly} opacity="0.8" />
    </g>
  );
  if (mood === "ecstatic" || mood === "excited")
    return (
      <motion.g animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ originX: "50%", originY: "60%" }}>
        {paw(24, 50)}
        {paw(96, 50)}
      </motion.g>
    );
  // nervous: paws clasped under the chin; sad: arms hanging low
  if (mood === "nervous") return <g>{paw(53, 74)}{paw(67, 74)}</g>;
  if (mood === "sad") return <g>{paw(31, 94)}{paw(89, 94)}</g>;
  return <g>{paw(33, 80)}{paw(87, 80)}</g>;
}

function Sparkles() {
  const star = (x: number, y: number, d: number) => (
    <motion.path
      key={`${x}${y}`}
      d={`M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z`}
      fill="#fbbf24"
      animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, repeat: Infinity, delay: d }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    />
  );
  return <g>{[star(14, 22, 0), star(106, 18, 0.3), star(10, 70, 0.6), star(110, 64, 0.15)]}</g>;
}

/** Lines Тарваа says, picked at random per mood. */
export const LINES: Record<Mood, string[]> = {
  idle: ["Азаа үзэх үү? 🍀", "Өнөөдөр таны өдөр байж магадгүй!", "Аль хайрцгийг нээх вэ?"],
  excited: ["Нээгдэж байна!!", "Ооо, юу гарах бол?!", "Зүрх минь хүчтэй цохилж байна!"],
  nervous: ["Би харж чадахгүй нь...", "Алив, алив, алив...", "Домогт, домогт... 🙏"],
  happy: ["Ёооо, гоё юм гарлаа!", "Ашигтай боллоо! 😄", "Хөөх, сайн байна!"],
  ecstatic: ["ЮУУУ?! ДОМОГТ!!! 🤯", "Би итгэхгүй байна!!!", "Азтан шүү та! 🏆"],
  sad: ["Ээ, дараагийнх нь гарна даа...", "Зүгээр ээ, дахиад оролдъё 🥲", "Энэ удаа азгүйтлээ..."],
  sleepy: ["Энд юу ч алга... 💤", "Хайрцаг нээвэл сэрнэ ээ..."],
};

export function pickLine(mood: Mood) {
  const l = LINES[mood];
  return l[Math.floor(Math.random() * l.length)];
}
