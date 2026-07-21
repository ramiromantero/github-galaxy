"use client";

/** Footer con autoría y links (según scaffold del portfolio). */
export default function Footer() {
  return (
    <footer className="pointer-events-auto absolute right-4 top-4 text-right text-[10px] text-slate-500 md:bottom-6 md:right-6 md:top-auto md:text-xs">
      <p>{"Hecho por Ramiro Mantero"}</p>
      <p className="mt-0.5 space-x-2">
        <a
          href="https://github.com/ramiromantero"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 transition-colors hover:text-sky-300"
        >
          GitHub
        </a>
        <a
          href="https://linkedin.com/in/ramiro-mantero-319931186"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 transition-colors hover:text-sky-300"
        >
          LinkedIn
        </a>
      </p>
    </footer>
  );
}
