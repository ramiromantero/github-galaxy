# GitHub Galaxy

Un año de contribuciones de GitHub de [@ramiromantero](https://github.com/ramiromantero) (~1065 commits) renderizado como una **galaxia 3D navegable** con Three.js. Cada día del año es una estrella sobre brazos espirales; los repos son planetas orbitando el núcleo galáctico.

## Stack

- **Next.js 15** (App Router) + **TypeScript** estricto
- **Three.js** directo (sin react-three-fiber): `THREE.Points` con `BufferGeometry`, additive blending y texturas radiales generadas en runtime con canvas
- **Tailwind CSS 3.4** para la UI (paneles glassmorphism, gradientes, glow)
- 100% client-side: sin API routes ni variables de entorno

## Features

- **Galaxia espiral**: 365 estrellas (una por día) en 3 brazos con dispersión gaussiana; a más commits, más grande y brillante la estrella (azul tenue → cian → blanco-dorado)
- **Núcleo galáctico** con glow en capas + 500 partículas de polvo de fondo
- **Planetas-repo** orbitando en anillos, con color por lenguaje; hover muestra un tooltip con nombre, descripción, lenguaje y estrellas; click abre el repo
- **Controles orbit manuales**: drag para orbitar con inercia suave, rueda/pinch para zoom con límites, rotación automática lenta
- **Raycasting** sobre las estrellas: el HUD muestra el día y la cantidad de commits bajo el puntero
- **Animación de entrada**: travel-in de cámara de ~2.5s (interrumpible al interactuar)
- **HUD de stats**: total de contribuciones (contador animado), racha más larga, mejor día y promedio semanal
- **Responsive**: en mobile la escena ocupa el viewport y los paneles se colapsan a una barra inferior
- Cleanup completo al desmontar (dispose de geometrías, materiales, texturas y renderer) y `devicePixelRatio` limitado a 2

## Correr localmente

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

1. Importar el repo en [vercel.com](https://vercel.com) (New Project → Import).
2. Deploy. Sin configuración extra: no hay variables de entorno.

## Fuentes de datos

- **Contribuciones**: [github-contributions-api.jogruber.de](https://github-contributions-api.jogruber.de) (`/v4/ramiromantero?y=last`), client-side.
- **Repos**: API pública de GitHub (`/users/ramiromantero/repos?sort=updated&per_page=12`).
- **Fallback embebido**: si cualquiera de los dos fetch falla, la galaxia se genera igual con datos determinísticos (PRNG mulberry32 con seed fija, total exacto de 1065 contribuciones) y 6 repos de muestra. En ese caso aparece un badge sutil de **modo demo**.

---

Hecho por **Ramiro Mantero** · [GitHub](https://github.com/ramiromantero) · [LinkedIn](https://linkedin.com/in/ramiro-mantero-319931186)
