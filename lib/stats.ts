/** Estadísticas derivadas del año de contribuciones. */
import type { ContributionDay } from "./types";

export interface GalaxyStats {
  total: number;
  longestStreak: number;
  bestDay: ContributionDay | null;
  weeklyAverage: number;
}

export function computeStats(days: ContributionDay[]): GalaxyStats {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let total = 0;
  let longestStreak = 0;
  let currentStreak = 0;
  let bestDay: ContributionDay | null = null;

  for (const day of sorted) {
    total += day.count;
    if (day.count > 0) {
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
    if (!bestDay || day.count > bestDay.count) bestDay = day;
  }

  const weeks = sorted.length > 0 ? sorted.length / 7 : 1;
  const weeklyAverage = Math.round((total / weeks) * 10) / 10;

  return { total, longestStreak, bestDay, weeklyAverage };
}

/** "2026-07-21" → "21 jul 2026" (parseo local, sin corrimiento de zona horaria). */
export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
