/**
 * Fetch client-side con validación defensiva. Si algo no cierra,
 * se tira un error y quien llama cae al fallback embebido.
 */
import type { ContributionDay, ContributionLevel, Repo } from "./types";

const CONTRIBUTIONS_URL =
  "https://github-contributions-api.jogruber.de/v4/ramiromantero?y=last";
const REPOS_URL =
  "https://api.github.com/users/ramiromantero/repos?sort=updated&per_page=12";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLevel(value: unknown): ContributionLevel | null {
  if (value === 0 || value === 1 || value === 2 || value === 3 || value === 4) {
    return value;
  }
  return null;
}

function parseContributionDay(value: unknown): ContributionDay | null {
  if (!isRecord(value)) return null;
  const { date, count, level } = value;
  if (typeof date !== "string" || !DATE_RE.test(date)) return null;
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return null;
  const parsedLevel = parseLevel(level);
  if (parsedLevel === null) return null;
  return { date, count: Math.round(count), level: parsedLevel };
}

export async function fetchContributions(): Promise<ContributionDay[]> {
  const res = await fetch(CONTRIBUTIONS_URL);
  if (!res.ok) throw new Error(`Contributions API respondió ${res.status}`);
  const json: unknown = await res.json();

  if (!isRecord(json) || !Array.isArray(json.contributions)) {
    throw new Error("Respuesta de contribuciones con forma inesperada");
  }
  const days = json.contributions
    .map(parseContributionDay)
    .filter((d): d is ContributionDay => d !== null);

  // Un año razonable de datos; si vino roto o a medias, mejor el fallback
  if (days.length < 300) throw new Error("Contribuciones insuficientes o inválidas");
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

function parseRepo(value: unknown): Repo | null {
  if (!isRecord(value)) return null;
  const { name, description, language, stargazers_count, html_url } = value;
  if (typeof name !== "string" || typeof html_url !== "string") return null;
  return {
    name,
    description: typeof description === "string" ? description : null,
    language: typeof language === "string" ? language : null,
    stargazers_count:
      typeof stargazers_count === "number" && Number.isFinite(stargazers_count)
        ? stargazers_count
        : 0,
    html_url,
  };
}

export async function fetchRepos(): Promise<Repo[]> {
  const res = await fetch(REPOS_URL);
  if (!res.ok) throw new Error(`GitHub API respondió ${res.status}`);
  const json: unknown = await res.json();

  if (!Array.isArray(json)) throw new Error("Respuesta de repos con forma inesperada");
  const repos = json.map(parseRepo).filter((r): r is Repo => r !== null).slice(0, 12);

  if (repos.length === 0) throw new Error("Sin repos válidos");
  return repos;
}
