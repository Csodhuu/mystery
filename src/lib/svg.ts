import { RARITY, type RarityKey } from "./rarity";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Placeholder product image: rarity-colored radial gradient + icon. */
export function itemSvg(icon: string, rarity: RarityKey): string {
  const c = RARITY[rarity].color;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <radialGradient id="g" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="${c}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#0b0d14" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="28" fill="#0b0d14"/>
  <rect width="256" height="256" rx="28" fill="url(#g)"/>
  <circle cx="128" cy="118" r="78" fill="none" stroke="${c}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="6 8"/>
  <text x="128" y="150" font-size="104" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${esc(icon)}</text>
  <rect x="0" y="0" width="256" height="128" rx="28" fill="url(#s)" opacity="0.4"/>
  <rect x="24" y="226" width="208" height="6" rx="3" fill="${c}"/>
</svg>`;
}

/** Placeholder case image: 3/4 view box in the case color. */
export function caseSvg(color: string, icon: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#07080d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="front" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>
  <rect width="320" height="320" fill="url(#bg)"/>
  <polygon points="160,70 270,115 160,160 50,115" fill="${color}" opacity="0.95"/>
  <polygon points="50,115 160,160 160,270 50,225" fill="url(#front)" opacity="0.85"/>
  <polygon points="270,115 160,160 160,270 270,225" fill="${color}" opacity="0.55"/>
  <polygon points="105,92 215,137 215,150 105,105" fill="#ffffff" opacity="0.35"/>
  <line x1="160" y1="160" x2="160" y2="270" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2"/>
  <text x="105" y="215" font-size="54" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${esc(icon)}</text>
</svg>`;
}
