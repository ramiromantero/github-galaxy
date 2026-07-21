"use client";

import type { ContributionDay } from "@/lib/types";
import { formatDateEs } from "@/lib/stats";

interface HudProps {
  hoveredDay: ContributionDay | null;
  demo: boolean;
}

/**
 * HUD principal: título con estética espacial, badge de modo demo,
 * lectura del día bajo el puntero e instrucciones de navegación.
 */
export default function Hud({ hoveredDay, demo }: HudProps) {
  return (
    <div className="pointer-events-auto absolute left-4 top-4 max-w-[calc(100vw-6rem)] fade-up md:left-6 md:top-6 md:max-w-sm">
      <h1 className="title-glow text-2xl font-bold tracking-tight md:text-4xl">
        GitHub Galaxy
      </h1>
      <p className="mt-1 text-xs text-slate-400 md:text-sm">
        {"un año de commits de "}
        <a
          href="https://github.com/ramiromantero"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-300 transition-colors hover:text-sky-200"
        >
          @ramiromantero
        </a>
        {" como galaxia"}
      </p>

      {demo && (
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-violet-300">
          <span className="demo-dot h-1.5 w-1.5 rounded-full bg-violet-400" />
          modo demo
        </span>
      )}

      {/* Día bajo el puntero */}
      <div className="glass mt-3 hidden rounded-lg px-3 py-2 md:block">
        {hoveredDay ? (
          <p className="font-mono-num text-sm text-sky-100">
            {formatDateEs(hoveredDay.date)}
            <span className="text-slate-500">{" — "}</span>
            <span className="text-amber-200">
              {hoveredDay.count}
              {hoveredDay.count === 1 ? " commit" : " commits"}
            </span>
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            {"Pasá el mouse por una estrella para ver ese día…"}
          </p>
        )}
      </div>

      {/* Instrucciones discretas */}
      <p className="mt-3 hidden text-[11px] leading-relaxed text-slate-500 md:block">
        {"arrastrá para orbitar · scroll para zoom · click en un planeta abre el repo"}
      </p>
      <p className="mt-2 text-[10px] text-slate-500 md:hidden">
        {"arrastrá para orbitar · pinch para zoom"}
      </p>
    </div>
  );
}
