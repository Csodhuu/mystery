/** Browser re-implementation of the provably-fair roll (Web Crypto), used by the verify page. */
export const WEIGHT_TOTAL = 100_000;

export async function hmacHexBrowser(serverSeed: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(serverSeed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256HexBrowser(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function rollFromHex(hex: string): number {
  const n = BigInt("0x" + hex.slice(0, 13));
  return Number((n * BigInt(WEIGHT_TOTAL)) >> BigInt(52));
}
