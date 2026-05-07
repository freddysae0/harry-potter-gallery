# Harry Potter Gallery

<video src="docs/demo.mov" width="100%" controls></video>

An interactive 3D gallery of Harry Potter-themed images, built with Three.js (WebGPU) and TypeScript.

## Tech Stack

- **Vite** + **TypeScript** — fast dev server and type safety
- **Three.js** (WebGPU) — 3D rendering with `WebGPURenderer` and `RenderPipeline`
- **TSL** (Three.js Shading Language) — custom post-processing effects
- **NodeMaterial** — visible shader objects (glowing orbs)
- **lil-gui** — interactive controls panel
- **Zustand** (vanilla) — global state management

## Features

- **Infinite gallery wall** — 97 images scattered on an invisible wall with organic, non-grid layout
- **Drag-to-pan** — click and drag anywhere to slide the gallery; smooth inertia on release
- **Scroll zoom** — scroll up to zoom in (capped at 1000%), scroll down to zoom out (capped at 100%)
- **Image tilt on drag** — pictures tilt in the direction you drag, simulating inertia
- **Infinite tiling** — the gallery repeats seamlessly in all directions for an endless canvas
- **Post-processing effects** (velocity-driven):
  - **Pixelation** — image breaks into larger blocks at higher drag speed
  - **Chromatic aberration** — R/B channels split along drag direction
  - **Edge particle dissolve** — screen edges disintegrate into particles
  - **Bloom** — glow triggered by zooming in/out
- **Glowing orbs** (NodeMaterial / TSL) — two shimmering orbs flank the gallery with pulse and sparkle effects
- **GUI panel** — tweak effect intensity, bloom, pixelation, chromatic aberration, tilt speed, and orb color in real-time
- **Zoom HUD** — current zoom level displayed at the bottom of the screen

## Controls

| Input | Action |
|---|---|
| Click + drag | Pan the gallery |
| Scroll | Zoom in / out |
| R | Reset camera to center |
| H | Toggle the GUI panel |
| GUI sliders | Tweak post-processing effects |

## Getting Started

```bash
npm install
npm run dev
```

The app requires a browser with **WebGPU** support (Chrome 113+, Edge 113+, Opera 99+). If unavailable, the renderer automatically falls back to **WebGL 2**.

## Build

```bash
npm run build
```

Output in `dist/`.

## Project Structure

```
src/
  main.ts       — entry point
  scene.ts      — WebGPU renderer, camera, drag/zoom logic, infinite wall
  gallery.ts    — image loading, scatter layout, wall positioning
  post.ts       — TSL post-processing shader (pixelation, CA, bloom, edge dissolve)
  orb.ts        — glowing orb with NodeMaterial shader (pulse + sparkle)
  store.ts      — Zustand store (loading state, wall dimensions)
  assets/
    gallery/    — 97 Harry Potter-themed images
```
