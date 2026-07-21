"use client";

/**
 * GalaxyScene — el corazón del proyecto.
 * Three.js directo (sin react-three-fiber): galaxia espiral de estrellas-día,
 * núcleo con glow, polvo de fondo, planetas-repo en órbita, controles orbit
 * manuales con inercia, zoom con límites, raycasting para hover/click y
 * animación de entrada de cámara.
 */

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import {
  LEVEL_OPACITIES,
  LEVEL_SIZES,
  clamp,
  easeOutCubic,
  languageColor,
  lerp,
  mulberry32,
  spiralLayout,
  starColor,
} from "@/lib/galaxyMath";
import type { ContributionDay, Repo } from "@/lib/types";

interface GalaxySceneProps {
  days: ContributionDay[];
  repos: Repo[];
  /** Día más cercano al puntero (para el HUD), o null. */
  onDayHover: (day: ContributionDay | null) => void;
}

interface RepoTooltip {
  repo: Repo;
  x: number;
  y: number;
  /** Si el tooltip se dibuja hacia la izquierda del puntero. */
  flip: boolean;
}

interface PlanetData {
  mesh: THREE.Mesh;
  orbitRadius: number;
  speed: number;
  baseAngle: number;
}

const MIN_RADIUS = 18;
const MAX_RADIUS = 110;
const INTRO_SECONDS = 2.5;

/** Textura radial suave generada en runtime (para estrellas y glows). */
function makeRadialTexture(stops: Array<[number, string]>): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [offset, color] of stops) grad.addColorStop(offset, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(canvas);
}

export default function GalaxyScene({ days, repos, onDayHover }: GalaxySceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<RepoTooltip | null>(null);
  const onDayHoverRef = useRef(onDayHover);
  onDayHoverRef.current = onDayHover;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const disposables: Array<{ dispose: () => void }> = [];

    // ---------- Renderer / escena / cámara ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.touchAction = "none"; // habilita pointer events en mobile
    canvas.style.cursor = "grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      500
    );

    const softTexture = makeRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.3, "rgba(255,255,255,0.8)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    disposables.push(softTexture);

    // ---------- Galaxia espiral: cada día del año es una estrella ----------
    const galaxy = new THREE.Group();
    scene.add(galaxy);

    const layout = spiralLayout(days.length, 20260721);
    const starPoints: THREE.Points[] = [];

    for (let level = 0; level <= 4; level++) {
      const indices: number[] = [];
      for (let i = 0; i < days.length; i++) {
        if (days[i].level === level) indices.push(i);
      }
      if (indices.length === 0) continue;

      const positions = new Float32Array(indices.length * 3);
      const colors = new Float32Array(indices.length * 3);
      indices.forEach((dayIdx, j) => {
        positions[j * 3] = layout[dayIdx * 3];
        positions[j * 3 + 1] = layout[dayIdx * 3 + 1];
        positions[j * 3 + 2] = layout[dayIdx * 3 + 2];
        const [r, g, b] = starColor(days[dayIdx].count);
        colors[j * 3] = r;
        colors[j * 3 + 1] = g;
        colors[j * 3 + 2] = b;
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: LEVEL_SIZES[level],
        map: softTexture,
        transparent: true,
        opacity: LEVEL_OPACITIES[level],
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      points.userData.dayIndices = indices;
      galaxy.add(points);
      starPoints.push(points);
      disposables.push(geometry, material);
    }

    // ---------- Núcleo galáctico: glow central en dos capas ----------
    const coreTexture = makeRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.2, "rgba(190,215,255,0.85)"],
      [0.5, "rgba(150,120,255,0.25)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    disposables.push(coreTexture);

    const coreMaterial = new THREE.SpriteMaterial({
      map: coreTexture,
      color: 0xdfeaff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMaterial);
    core.scale.set(13, 13, 1);
    scene.add(core);
    disposables.push(coreMaterial);

    const hazeMaterial = new THREE.SpriteMaterial({
      map: coreTexture,
      color: 0x7c5cff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haze = new THREE.Sprite(hazeMaterial);
    haze.scale.set(36, 36, 1);
    scene.add(haze);
    disposables.push(hazeMaterial);

    // ---------- Polvo de fondo: 500 puntos tenues en una esfera grande ----------
    const dustRng = mulberry32(99);
    const dustCount = 500;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const r = 45 + dustRng() * 50;
      const theta = dustRng() * Math.PI * 2;
      const phi = Math.acos(2 * dustRng() - 1);
      dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPositions[i * 3 + 1] = r * Math.cos(phi);
      dustPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      size: 0.7,
      map: softTexture,
      color: 0x8a7bd8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);
    disposables.push(dustGeometry, dustMaterial);

    // ---------- Planetas-repo: esferas orbitando el núcleo ----------
    const planetsRoot = new THREE.Group();
    scene.add(planetsRoot);

    const planetRng = mulberry32(777);
    const sphereGeometry = new THREE.SphereGeometry(0.55, 24, 24);
    disposables.push(sphereGeometry);

    const planetMeshes: THREE.Mesh[] = [];
    const planetData: PlanetData[] = [];

    repos.forEach((repo, i) => {
      const orbitRadius = 7 + i * 1.9;
      const orbit = new THREE.Group();
      orbit.rotation.x = ((i % 3) - 1) * 0.14;
      orbit.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.05;
      planetsRoot.add(orbit);

      // Anillo de órbita, apenas visible
      const segments = 96;
      const ringPositions = new Float32Array(segments * 3);
      for (let s = 0; s < segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        ringPositions[s * 3] = Math.cos(a) * orbitRadius;
        ringPositions[s * 3 + 1] = 0;
        ringPositions[s * 3 + 2] = Math.sin(a) * orbitRadius;
      }
      const ringGeometry = new THREE.BufferGeometry();
      ringGeometry.setAttribute("position", new THREE.BufferAttribute(ringPositions, 3));
      const ringMaterial = new THREE.LineBasicMaterial({
        color: 0x8b9bd8,
        transparent: true,
        opacity: 0.13,
      });
      orbit.add(new THREE.LineLoop(ringGeometry, ringMaterial));
      disposables.push(ringGeometry, ringMaterial);

      // Planeta con color por lenguaje + glow propio
      const color = languageColor(repo.language);
      const planetMaterial = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(sphereGeometry, planetMaterial);
      const scale = 1 + Math.min(repo.stargazers_count, 20) * 0.03;
      mesh.scale.setScalar(scale);
      mesh.userData.repoIndex = i;
      mesh.userData.baseScale = scale;
      disposables.push(planetMaterial);

      const glowMaterial = new THREE.SpriteMaterial({
        map: softTexture,
        color,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.set(3.4, 3.4, 1);
      mesh.add(glow);
      disposables.push(glowMaterial);

      orbit.add(mesh);
      planetMeshes.push(mesh);
      planetData.push({
        mesh,
        orbitRadius,
        speed: 0.35 / Math.sqrt(orbitRadius) + planetRng() * 0.05,
        baseAngle: planetRng() * Math.PI * 2,
      });
    });

    // ---------- Estado de cámara: orbit manual con inercia ----------
    let yaw = 0.6;
    let pitch = 1.15; // arranca alto y baja con el travel-in
    let velYaw = 0;
    let velPitch = 0;
    let radius = 150;
    let targetRadius = 55;
    let introT = 0;

    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let movedDistance = 0;
    let pinchDistance = 0;
    let hoveredRepoIndex = -1;
    let hoveredDayIndex = -1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 1.5 };
    const ndc = new THREE.Vector2();

    const setHoveredRepo = (index: number, x: number, y: number, width: number) => {
      if (index === hoveredRepoIndex) return;
      // Restaurar escala del planeta anterior
      if (hoveredRepoIndex >= 0) {
        const prev = planetMeshes[hoveredRepoIndex];
        prev.scale.setScalar(prev.userData.baseScale as number);
      }
      hoveredRepoIndex = index;
      if (index >= 0) {
        const mesh = planetMeshes[index];
        mesh.scale.setScalar((mesh.userData.baseScale as number) * 1.3);
        setTooltip({ repo: repos[index], x, y, flip: x > width * 0.55 });
      } else {
        setTooltip(null);
      }
    };

    const raycastAt = (clientX: number, clientY: number): number => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(planetMeshes, false);
      if (hits.length > 0) return hits[0].object.userData.repoIndex as number;
      return -1;
    };

    const handleHover = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ndc.x = (x / rect.width) * 2 - 1;
      ndc.y = -(y / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      // 1) Planetas-repo
      const planetHits = raycaster.intersectObjects(planetMeshes, false);
      if (planetHits.length > 0) {
        setHoveredRepo(planetHits[0].object.userData.repoIndex as number, x, y, rect.width);
        canvas.style.cursor = "pointer";
        if (hoveredDayIndex !== -1) {
          hoveredDayIndex = -1;
          onDayHoverRef.current(null);
        }
        return;
      }
      setHoveredRepo(-1, x, y, rect.width);
      canvas.style.cursor = "grab";

      // 2) Estrellas-día (la más cercana al puntero)
      const starHits = raycaster.intersectObjects(starPoints, false);
      let dayIndex = -1;
      const hit = starHits.length > 0 ? starHits[0] : null;
      if (hit && hit.index !== undefined) {
        const indices = hit.object.userData.dayIndices as number[];
        dayIndex = indices[hit.index];
      }
      if (dayIndex !== hoveredDayIndex) {
        hoveredDayIndex = dayIndex;
        onDayHoverRef.current(dayIndex >= 0 ? days[dayIndex] : null);
      }
    };

    // ---------- Eventos pointer: drag para orbitar, pinch para zoom ----------
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      introT = 1; // interacción corta la animación de entrada
      if (pointers.size === 1) {
        dragging = true;
        movedDistance = 0;
        velYaw = 0;
        velPitch = 0;
        canvas.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        const [p1, p2] = Array.from(pointers.values());
        pinchDistance = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (prev) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        // Pinch para zoom
        const [p1, p2] = Array.from(pointers.values());
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (pinchDistance > 0) {
          targetRadius = clamp(targetRadius * (pinchDistance / dist), MIN_RADIUS, MAX_RADIUS);
        }
        pinchDistance = dist;
        return;
      }

      if (dragging && prev) {
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        movedDistance += Math.abs(dx) + Math.abs(dy);
        yaw -= dx * 0.005;
        pitch = clamp(pitch + dy * 0.005, -0.15, 1.35);
        velYaw = -dx * 0.005;
        velPitch = dy * 0.005;
        return;
      }

      handleHover(e);
    };

    const endPointer = (e: PointerEvent) => {
      const wasDragging = dragging && pointers.size === 1;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDistance = 0;
      if (pointers.size === 0) {
        dragging = false;
        canvas.style.cursor = "grab";
        // Tap/click corto sobre un planeta → abrir el repo
        if (wasDragging && movedDistance < 6) {
          const repoIndex = raycastAt(e.clientX, e.clientY);
          if (repoIndex >= 0) {
            window.open(repos[repoIndex].html_url, "_blank", "noopener,noreferrer");
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      introT = 1;
      targetRadius = clamp(targetRadius + e.deltaY * 0.05, MIN_RADIUS, MAX_RADIUS);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ---------- Loop de animación (rAF con cleanup) ----------
    const clock = new THREE.Clock();
    let rafId = 0;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;

      // Travel-in de entrada (~2.5s), interrumpible por el usuario
      if (introT < 1) {
        introT = Math.min(1, introT + dt / INTRO_SECONDS);
        const e = easeOutCubic(introT);
        radius = lerp(150, targetRadius, e);
        pitch = lerp(1.15, 0.45, e);
      } else {
        radius += (targetRadius - radius) * Math.min(1, dt * 6);
      }

      // Inercia al soltar el drag
      if (!dragging) {
        yaw += velYaw;
        pitch = clamp(pitch + velPitch, -0.15, 1.35);
        velYaw *= 0.94;
        velPitch *= 0.94;
      }

      // Rotación automática lenta de la galaxia y el polvo
      galaxy.rotation.y += dt * 0.04;
      dust.rotation.y -= dt * 0.008;

      // Órbitas de los planetas
      for (const p of planetData) {
        const a = p.baseAngle + elapsed * p.speed;
        p.mesh.position.set(Math.cos(a) * p.orbitRadius, 0, Math.sin(a) * p.orbitRadius);
      }

      camera.position.set(
        radius * Math.cos(pitch) * Math.sin(yaw),
        radius * Math.sin(pitch),
        radius * Math.cos(pitch) * Math.cos(yaw)
      );
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // ---------- Cleanup completo ----------
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("wheel", onWheel);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) container.removeChild(canvas);
      onDayHoverRef.current(null);
    };
  }, [days, repos]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {tooltip && (
        <div
          className="glass pointer-events-none absolute z-20 w-64 rounded-xl p-4 fade-in"
          style={{
            left: tooltip.flip ? undefined : tooltip.x + 16,
            right: tooltip.flip ? `calc(100% - ${tooltip.x - 16}px)` : undefined,
            top: Math.max(8, tooltip.y - 20),
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: `#${languageColor(tooltip.repo.language).toString(16).padStart(6, "0")}`,
              }}
            />
            <span className="font-semibold text-sky-100">{tooltip.repo.name}</span>
          </div>
          {tooltip.repo.description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {tooltip.repo.description}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{tooltip.repo.language ?? "—"}</span>
            <span className="font-mono-num">★ {tooltip.repo.stargazers_count}</span>
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-violet-300/80">
            {"Click para abrir el repo"}
          </p>
        </div>
      )}
    </div>
  );
}
