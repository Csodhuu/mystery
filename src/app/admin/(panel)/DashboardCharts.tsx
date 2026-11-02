"use client";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Day = { day: string; revenue: number; payout: number; opened: number };

// Validated (dark surface): CVD ΔE 13.6, normal-vision ΔE 26.4.
const REVENUE = "#0891b2";
const PAYOUT = "#9333ea";
const AXIS = { stroke: "#6b7280", fontSize: 11 };
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}сая` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

const tooltipStyle = { contentStyle: { background: "#151826", border: "1px solid #232739", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "#e5e7eb" } };

export function DashboardCharts({ days }: { days: Day[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card p-4">
        <h2 className="mb-1 font-bold text-white">Орлого ба олгосон барааны үнэ (₮, өдрөөр)</h2>
        <p className="mb-3 text-xs text-gray-500">Сүүлийн 30 хоног</p>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={days} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="#232739" vertical={false} />
              <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: "#232739" }} interval={4} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={short} width={48} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => `${v.toLocaleString()}₮`} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
              <Line type="monotone" dataKey="revenue" name="Орлого" stroke={REVENUE} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="payout" name="Барааны үнэ" stroke={PAYOUT} strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <h2 className="mb-1 font-bold text-white">Нээгдсэн хайрцаг (өдрөөр)</h2>
        <p className="mb-3 text-xs text-gray-500">Сүүлийн 30 хоног</p>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={days} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="#232739" vertical={false} />
              <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: "#232739" }} interval={4} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: number) => [v, "Нээлт"]} />
              <Bar dataKey="opened" fill={REVENUE} radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
