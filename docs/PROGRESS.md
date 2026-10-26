# PROGRESS: source of truth

If this file and HANDOFF.md disagree, **this file wins**.

## Current state

- **Current module:** M8 Validation and full audit (Done)
- **Next module:** M9 Polish, deploy, demo
- **Overall:** 9/10 modules done

## Modules

| Module | Name | Builder (tool + model) | Status | Tag | Notes |
| --- | --- | --- | --- | --- | --- |
| M0 | Project setup | Antigravity + Gemini 4 Argon | Done | v0.1-M0 | Vite + TS + React + Vitest + ESLint + EN/FR |
| M1 | Gas side physics (Brayton) | Antigravity + Gemini 4 Argon | Done | v0.1-physics | Pure TS, <0.1% First-Law closure |
| M2 | Steam side physics (Rankine, HRSG, combined) | Antigravity + Gemini 4 Argon | Done | v0.1-physics | iapws-if97 2.8.0 (<0.5% error), pinch detection |
| M3 | 3D plant scene | Antigravity + Gemini 4 Argon | Done | v0.1-ui | 8 procedural 3D components, orbit/zoom, click highlight |
| M4 | Laws data and info panel | Antigravity + Gemini 4 Argon | Done | v0.1-ui | All 10 laws in EN/FR with live equations, FR terms listed |
| M5 | Sliders connected to physics | Antigravity + Gemini 4 Argon | Done | v0.1-ui | Instant T3 and rp sliders, error alert on pinch violation |
| M6 | T-s diagram | Antigravity + Gemini 4 Argon | Done | v0.1-ui | Interactive SVG T-s diagram with saturation dome and 9 points |
| M7 | Flow animation and colors | Antigravity + Gemini 4 Argon | Done | v0.1-ui | Animated flow spheres, cold-to-hot pipe colors, play/pause |
| M8 | Validation and full audit | Antigravity + Gemini 4 Argon | Done | v0.1-audit | Full audit in docs/AUDIT.md, 16 unit tests passing, 2 todo |
| M9 | Polish, deploy, demo | Antigravity agent (Gemini) | Not started | m9 | |

Status values: Not started, Plan approved, Building, Testing, Done.

## Decisions

- Version 1 = simplified single-pressure combined cycle with 8 components, simple 3D shapes, EN/FR, two main sliders, T-s diagram.
- Audience: students first, engineers second.
- Only the 10 laws a graduate student should know (see SPEC section 5).
- Browser app only. No backend, no database.
- Builder tools available: Antigravity agent (Gemini models) and Claude Opus 5.5.

## Known issues / future polish

- (empty)

## Open questions

- See SPEC section 11.
