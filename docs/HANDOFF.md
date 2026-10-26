# HANDOFF: CycleLab 3D (v0.1 — All 10 Modules Complete)

If `docs/PROGRESS.md` and this file disagree, **`docs/PROGRESS.md` wins**.

## 1. Pinned Stack & Versions
- **Runtime / Build:** Vite `6.0.6`, TypeScript `5.7.2` (strict mode), React `18.3.1`, React DOM `18.3.1`
- **3D Engine:** Three.js `0.170.0`, `@react-three/fiber` `8.17.10`, `@react-three/drei` `9.121.4`
- **Steam Properties:** `iapws-if97` `2.8.0`
- **Testing & Linting:** Vitest `2.1.8`, ESLint `9.17.0`, `typescript-eslint` `8.18.2`

## 2. Repository Structure
- `src/physics/` — 100% pure TypeScript thermodynamic engine (`constants.ts`, `types.ts`, `brayton.ts`, `rankine.ts`, `combined.ts`, `laws.ts`, `viewModel.ts`, `index.ts`). Zero UI/3D dependencies.
- `src/scene/` — 3D layout, animation mapping (`animationParams.ts`), procedural textures & static geometry merging (`proceduralMaterials.ts`), and 8 LatheGeometry/contoured industrial assets with multi-stage bladed rotors (`ProceduralEquipment.tsx`).
- `src/components/` — React UI components (`Sidebar.tsx`, `TopBar.tsx`, `CycleLabLogo.tsx`, `PlantScene3D.tsx`, `ViewportSettings.tsx`, `TsDiagram.tsx`, `ResultsPanel.tsx`, `SliderPanel.tsx`, `ComponentInspector.tsx`, `CalculationsPlaceholder.tsx`).
- `src/ui/theme.ts` — Dark Graphite and Light theme palettes + WCAG 2.1 luminance & contrast ratio calculator.
- `src/i18n/` — Complete bilingual dictionaries (`en.json`, `fr.json`) and `LanguageContext.tsx`.
- `tests/` — Vitest unit tests (`brayton.test.ts`, `steam.test.ts`, `combined.test.ts`, `audit.test.ts`, `contrast.test.ts`, `setup.test.ts`).
- `docs/` — `SPEC.md`, `RULES.md`, `PROGRESS.md`, `AUDIT.md`, `DEMO.md`, `FR_TERMS_TO_REVIEW.md`.
- Deployment configs: `.github/workflows/deploy.yml` (GitHub Pages) and `netlify.toml` (Netlify).
