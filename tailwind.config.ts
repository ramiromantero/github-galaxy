import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#030308",
          900: "#0a0c18",
          800: "#141830",
        },
        nebula: "#a78bfa",
        starlight: "#7dd3fc",
      },
    },
  },
  plugins: [],
};
export default config;
