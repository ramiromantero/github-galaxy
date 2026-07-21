/**
 * Matemática de la galaxia: PRNG determinístico, layout espiral
 * y rampas de color para estrellas y planetas.
 */

/** PRNG mulberry32 — determinístico a partir de una seed fija. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Muestra gaussiana (Box-Muller) usando un rng uniforme. */
export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Cantidad de brazos espirales de la galaxia. */
const ARMS = 3;
/** Radio interno (núcleo) y externo del disco. */
const R_MIN = 4;
const R_MAX = 30;
/** Cuánto "gira" cada brazo a lo largo del año (en radianes). */
const TWIST = Math.PI * 4.2;

/**
 * Posiciones (x, y, z) de las n estrellas-día a lo largo de brazos
 * espirales con dispersión gaussiana. Determinístico por seed.
 */
export function spiralLayout(n: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const positions = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0; // progreso del año 0..1
    const arm = i % ARMS;
    const radius = lerp(R_MIN, R_MAX, Math.sqrt(t));
    const angle = arm * ((Math.PI * 2) / ARMS) + t * TWIST;

    // Dispersión: más apretado cerca del núcleo, más difuso en la periferia
    const spread = lerp(0.6, 2.0, t);
    const dr = gaussian(rng) * spread;
    const da = (gaussian(rng) * spread) / radius;
    const r = radius + dr;
    const a = angle + da;

    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = gaussian(rng) * lerp(1.1, 0.5, t); // disco fino
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  return positions;
}

/** Tamaño en unidades de mundo de las estrellas, por level 0..4. */
export const LEVEL_SIZES: readonly number[] = [0.45, 0.85, 1.25, 1.7, 2.3];
/** Opacidad del material de puntos, por level 0..4. */
export const LEVEL_OPACITIES: readonly number[] = [0.3, 0.6, 0.75, 0.9, 1];

type Rgb = readonly [number, number, number];

const RAMP: readonly Rgb[] = [
  [0.22, 0.32, 0.85], // azul tenue
  [0.25, 0.85, 1.0], // cian
  [1.0, 0.93, 0.72], // blanco-dorado
];

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/**
 * Color de una estrella según sus commits: azul tenue → cian → blanco-dorado.
 * Devuelve componentes RGB en 0..1 listas para un BufferAttribute.
 */
export function starColor(count: number): Rgb {
  const t = clamp(count / 12, 0, 1);
  if (t <= 0.5) return mixRgb(RAMP[0], RAMP[1], t * 2);
  return mixRgb(RAMP[1], RAMP[2], (t - 0.5) * 2);
}

/** Colores por lenguaje (aproximados a los de GitHub) para los planetas-repo. */
const LANGUAGE_COLORS: Record<string, number> = {
  Python: 0x3572a5,
  TypeScript: 0x3178c6,
  JavaScript: 0xf1e05a,
  HTML: 0xe34c26,
  CSS: 0x663399,
  Shell: 0x89e051,
  Go: 0x00add8,
  Rust: 0xdea584,
  Java: 0xb07219,
  "Jupyter Notebook": 0xda5b0b,
};

export function languageColor(language: string | null): number {
  if (language && language in LANGUAGE_COLORS) return LANGUAGE_COLORS[language];
  return 0x8b949e; // gris neutro de GitHub
}
