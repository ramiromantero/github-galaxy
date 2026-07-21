import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Galaxy — Ramiro Mantero",
  description:
    "Un año de contribuciones de GitHub de @ramiromantero renderizado como una galaxia 3D navegable con Three.js.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
