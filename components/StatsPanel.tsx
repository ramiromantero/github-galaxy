"use client";

import { useEffect, useState } from "react";
import type { GalaxyStats } from "@/lib/stats";
import { formatDateEs } from "@/lib/stats";

interface StatsPanelProps {
  stats: GalaxyStats;
}

/** Contador animado con easing (rAF, con cleanup). */
function useCountUp(target: number, duration = 1600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
}

/**
 * Estadísticas del año: total animado, racha más larga, mejor día
 * y promedio semanal. Panel glass a la derecha en desktop; barra
 * inferior compacta en mobile.
 */
export default function StatsPanel({ stats }: StatsPanelProps) {
  const animatedTotal = useCountUp(stats.total);

  const items: Array<{ label: string; value: string; accent?: boolean }> = [
    { label: "contribuciones", value: animatedTotal.toLocaleString("es-AR"), accent: true },
    { label: "racha más larga", value: `${stats.longestStreak} días` },
    {
      label: "mejor día",
      value: stats.bestDay
        ? `${stats.bestDay.count} · ${formatDateEs(stats.bestDay.date)}`
        : "—",
    },
    { label: "promedio semanal", value: stats.weeklyAverage.toLocaleString("es-AR") },
  ];

  return (
    <>
      {/* Desktop: panel glass arriba a la derecha */}
      <div className="glass pointer-events-auto absolute right-6 top-6 hidden w-60 rounded-2xl p-5 fade-up md:block">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
          {"último año"}
        </h2>
        <div className="mt-3 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <p
                className={`font-mono-num ${
                  item.accent
                    ? "text-3xl font-bold text-amber-200 stat-glow"
                    : "text-lg font-semibold text-sky-100"
                }`}
              >
                {item.value}
              </p>
              <p className="text-[11px] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: barra inferior colapsada */}
      <div className="glass pointer-events-auto absolute inset-x-0 bottom-0 flex justify-between gap-2 border-x-0 border-b-0 px-4 py-2.5 md:hidden">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 text-center">
            <p
              className={`font-mono-num truncate text-sm font-semibold ${
                item.accent ? "text-amber-200" : "text-sky-100"
              }`}
            >
              {item.value}
            </p>
            <p className="truncate text-[9px] text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
