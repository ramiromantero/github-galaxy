"use client";

import { useEffect, useMemo, useState } from "react";
import GalaxyScene from "@/components/GalaxyScene";
import Hud from "@/components/Hud";
import StatsPanel from "@/components/StatsPanel";
import Legend from "@/components/Legend";
import Footer from "@/components/Footer";
import { fetchContributions, fetchRepos } from "@/lib/api";
import { fallbackContributions, fallbackRepos } from "@/lib/fallback";
import { computeStats } from "@/lib/stats";
import type { ContributionDay, GalaxyData } from "@/lib/types";

export default function Page() {
  const [data, setData] = useState<GalaxyData | null>(null);
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  // Carga client-side con fallback embebido si cualquier fetch falla
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [contributions, repos] = await Promise.allSettled([
        fetchContributions(),
        fetchRepos(),
      ]);
      if (cancelled) return;
      if (contributions.status === "fulfilled" && repos.status === "fulfilled") {
        setData({ days: contributions.value, repos: repos.value, demo: false });
      } else {
        setData({ days: fallbackContributions(), repos: fallbackRepos, demo: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => (data ? computeStats(data.days) : null), [data]);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {data ? (
        <GalaxyScene days={data.days} repos={data.repos} onDayHover={setHoveredDay} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="loader-ring" aria-hidden="true" />
          <p className="text-sm text-slate-400">{"Generando galaxia…"}</p>
        </div>
      )}

      {/* Capa de UI por encima de la escena */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Hud hoveredDay={hoveredDay} demo={data?.demo ?? false} />
        {stats && <StatsPanel stats={stats} />}
        <Legend />
        <Footer />
      </div>
    </main>
  );
}
