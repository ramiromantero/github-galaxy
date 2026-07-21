"use client";

/** Leyenda: qué representa cada elemento de la galaxia. */
export default function Legend() {
  return (
    <div className="glass pointer-events-auto absolute bottom-6 left-6 hidden rounded-2xl p-4 fade-up md:block">
      <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
        {"cómo leer la galaxia"}
      </h2>
      <ul className="mt-3 space-y-2.5 text-xs text-slate-300">
        <li className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="2.5" fill="#7dd3fc" />
          </svg>
          <span>{"cada estrella es un día del año"}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="5" fill="#fde68a" opacity="0.35" />
            <circle cx="7" cy="7" r="3" fill="#fde68a" />
          </svg>
          <span>{"más brillo y tamaño = más commits ese día"}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="7" cy="7" r="6" fill="none" stroke="#8b9bd8" strokeWidth="0.75" opacity="0.6" />
            <circle cx="12" cy="5.5" r="2" fill="#3572a5" />
          </svg>
          <span>{"cada planeta en órbita es un repo"}</span>
        </li>
      </ul>
    </div>
  );
}
