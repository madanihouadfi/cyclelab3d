# PROGRESS: source of truth

If this file and HANDOFF.md disagree, **this file wins**.

## Current state

- **Current module:** M9 Polish, deploy, demo (Done)
- **Next module:** None (v0.1 complete)
- **Overall:** 10/10 modules done

## Modules

| Module | Name | Builder (tool + model) | Status | Tag | Notes |
| --- | --- | --- | --- | --- | --- |
| M0 | Project setup | Antigravity + Gemini 4 Argon | Done | v0.1-M0 | Vite + TS + React + Vitest + ESLint + EN/FR |
| M1 | Gas side physics (Brayton) | Antigravity + Gemini 4 Argon | Done | v0.1-physics | Pure TS, <0.1% First-Law closure |
| M2 | Steam side physics (Rankine, HRSG, combined) | Antigravity + Gemini 4 Argon | Done | v0.1-physics | iapws-if97 2.8.0 (<0.5% error), pinch detection |
| M3 | 3D plant scene (M3 + M3b + M3c) | Antigravity + Gemini 4 Argon | Done | v0.1-M3c | Single-shaft layout (ST-Gen-Comp-Comb-GT->HRSG), LatheGeometry casings, elevated filter house, orthogonal 90° piping, merged static geometry (<150 draw calls) |
| M4 | Laws data and info panel | Antigravity + Gemini 4 Argon | Done | v0.1-ui | All 10 laws in EN/FR with live equations, FR terms listed |
| M5 | Sliders connected to physics | Antigravity + Gemini 4 Argon | Done | v0.1-ui | Instant T3 and rp sliders, error alert on pinch violation |
| M6 | T-s diagram + UI/UX redesign (M6 + M6b) | Antigravity + Gemini 4 Argon | Done | v0.1-M6b | Dark graphite + light theme (WCAG AA), left sidebar + SVG logo, topbar breadcrumb/reset, round viewport tools, GizmoHelper, Realistic/X-ray/Temperature modes, full-page T-s diagram, 5 KPI cards, mobile bottom tab bar + sheet |
| M7 | Flow animation and colors (M7 + M7b + M3c) | Antigravity + Gemini 4 Argon | Done | v0.1-M3c | Dense streamline pulses, multi-stage bladed rotors, HRSG tube bank glow in gas order, cooling tower plume, heat shimmer, combustor cutaway |
| M8 | Validation and full audit | Antigravity + Gemini 4 Argon | Done | v0.1-audit-fix | Audit fixes (combustor mass ratio, LHV/eta_comb, entropy datum, economizer note) |
| M9 | Polish, deploy, demo | Antigravity + Gemini 4 Argon | Done | v0.1-M9 | Code-split production chunks (<5s load), SVG favicon, bilingual README.md + docs/DEMO.md, GitHub Pages (.github/workflows/deploy.yml) & Netlify (netlify.toml) configs |

Status values: Not started, Plan approved, Building, Testing, Done.

## Decisions

- Version 1 = simplified single-pressure combined cycle with 8 components, procedural 3D shapes, EN/FR, two main sliders, full-page interactive T-s diagram.
- Audience: students first, engineers second.
- Only the 10 laws a graduate student should know (see SPEC section 5).
- Browser app only. No backend, no database.
- Static hosting configured for both GitHub Pages (`.github/workflows/deploy.yml`) and Netlify (`netlify.toml`).
- Builder tools available: Antigravity agent (Gemini models) and Claude Opus 5.5.

## Known issues / future polish

- See `docs/AUDIT.md` (Section 6: Known Limitations of v1 Model).

## Open questions

- All v0.1 questions resolved.
