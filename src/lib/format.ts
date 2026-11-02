export function mnt(n: number): string {
  return `${Math.round(n).toLocaleString("en-US")}₮`;
}

export function pct(weight: number): string {
  const p = weight / 1000;
  return `${p.toLocaleString("en-US", { maximumFractionDigits: 3 })}%`;
}

export function dateTime(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}.${pad(x.getMonth() + 1)}.${pad(x.getDate())} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

export function timeAgo(d: Date | string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s} сек өмнө`;
  if (s < 3600) return `${Math.floor(s / 60)} мин өмнө`;
  if (s < 86400) return `${Math.floor(s / 3600)} цаг өмнө`;
  return `${Math.floor(s / 86400)} өдрийн өмнө`;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  IN_INVENTORY: "Агуулахад",
  DELIVERY_REQUESTED: "Хүргэлт хүссэн",
  SHIPPED: "Илгээсэн",
  DELIVERED: "Хүргэгдсэн",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  IN_INVENTORY: "#22d3ee",
  DELIVERY_REQUESTED: "#f59e0b",
  SHIPPED: "#a855f7",
  DELIVERED: "#22c55e",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PAID: "Амжилттай",
  FAILED: "Амжилтгүй",
};

export const UB_DISTRICTS = [
  "Баянгол",
  "Баянзүрх",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Хан-Уул",
  "Чингэлтэй",
  "Налайх",
  "Багануур",
  "Багахангай",
];
