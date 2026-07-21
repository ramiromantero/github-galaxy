/**
 * Datos embebidos de respaldo ("modo demo"): si la API de contribuciones
 * o la de repos fallan, la galaxia se genera igual con estos datos.
 */
import { mulberry32 } from "./galaxyMath";
import type { ContributionDay, ContributionLevel, Repo } from "./types";

const FALLBACK_SEED = 20260721;
const TARGET_TOTAL = 1065; // ≈ contribuciones reales del último año

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function levelFor(count: number): ContributionLevel {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 8) return 3;
  return 4;
}

/**
 * Genera 365 días terminando hoy, con un PRNG de seed fija.
 * Semanas más y menos activas (onda senoidal + ruido), fines de semana
 * más tranquilos, y total exactamente TARGET_TOTAL.
 */
export function fallbackContributions(): ContributionDay[] {
  const rng = mulberry32(FALLBACK_SEED);
  const days = 365;
  const today = new Date();

  // 1) Peso relativo de cada día
  const weights: number[] = [];
  for (let i = 0; i < days; i++) {
    const week = Math.floor(i / 7);
    // Ciclo de semanas intensas / tranquilas
    const weekFactor = 0.4 + 0.9 * (0.5 + 0.5 * Math.sin(week * 0.85 + 1.3)) + rng() * 0.5;
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    const dow = date.getDay();
    const weekdayFactor = dow === 0 ? 0.2 : dow === 6 ? 0.35 : 1;
    // Algunos días directamente sin actividad
    const idle = rng() < 0.24;
    weights.push(idle ? 0 : weekFactor * weekdayFactor * (0.3 + rng() * 1.4));
  }

  // 2) Repartir TARGET_TOTAL proporcional a los pesos
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((TARGET_TOTAL * w) / totalWeight));

  // 3) Corregir el redondeo para clavar el total exacto
  let diff = TARGET_TOTAL - counts.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (diff !== 0 && idx < days * 4) {
    const i = idx % days;
    if (diff > 0 && counts[i] > 0) {
      counts[i] += 1;
      diff -= 1;
    } else if (diff < 0 && counts[i] > 1) {
      counts[i] -= 1;
      diff += 1;
    }
    idx++;
  }

  return counts.map((count, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    return { date: toIsoDate(date), count, level: levelFor(count) };
  });
}

/** Repos de respaldo: el repo público estrella + genéricos plausibles. */
export const fallbackRepos: Repo[] = [
  {
    name: "FCI-dashboard",
    description:
      "Dashboard interactivo de fondos comunes de inversión argentinos, con Dash y Plotly.",
    language: "Python",
    stargazers_count: 14,
    html_url: "https://github.com/ramiromantero/FCI-dashboard",
  },
  {
    name: "github-galaxy",
    description: "Este proyecto: un año de commits renderizado como galaxia 3D con Three.js.",
    language: "TypeScript",
    stargazers_count: 6,
    html_url: "https://github.com/ramiromantero",
  },
  {
    name: "react-mini-charts",
    description: "Componentes de charts livianos en React + SVG, sin dependencias.",
    language: "TypeScript",
    stargazers_count: 4,
    html_url: "https://github.com/ramiromantero",
  },
  {
    name: "fastapi-starter",
    description: "Template de API con FastAPI, PostgreSQL y tests con pytest.",
    language: "Python",
    stargazers_count: 3,
    html_url: "https://github.com/ramiromantero",
  },
  {
    name: "automation-scripts",
    description: "Scripts de automatización varios: scraping, reportes y tareas repetitivas.",
    language: "Python",
    stargazers_count: 2,
    html_url: "https://github.com/ramiromantero",
  },
  {
    name: "dotfiles",
    description: "Configuración personal de terminal y editor.",
    language: "Shell",
    stargazers_count: 1,
    html_url: "https://github.com/ramiromantero",
  },
];
