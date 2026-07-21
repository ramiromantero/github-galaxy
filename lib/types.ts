/** Nivel de intensidad de contribuciones que devuelve la API (0 = nada, 4 = máximo). */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

/** Un día del año de contribuciones. */
export interface ContributionDay {
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  count: number;
  level: ContributionLevel;
}

/** Respuesta de https://github-contributions-api.jogruber.de/v4/<user>?y=last */
export interface ContributionsApiResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

/** Subconjunto de campos que usamos de la API de repos de GitHub. */
export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
}

/** Dataset completo que consume la escena. */
export interface GalaxyData {
  days: ContributionDay[];
  repos: Repo[];
  /** true si se está usando el fallback embebido (sin red). */
  demo: boolean;
}
