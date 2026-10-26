# PROGRESS: source of truth

If this file and HANDOFF.md disagree, **this file wins**.

## Current state

- **Current module:** M0 Project setup (Done)
- **Next module:** M1 Gas side physics (Brayton)
- **Overall:** 1/10 modules done

## Modules

| Module | Name | Builder (tool + model) | Status | Tag | Notes |
| --- | --- | --- | --- | --- | --- |
| M0 | Project setup | Antigravity + Gemini 4 Argon | Done | v0.1-M0 | Vite + TS + React + Vitest + ESLint + EN/FR |
| M1 | Gas side physics (Brayton) | Claude Code or Claude extension (Opus 5.5) | Not started | m1 | Critical |
| M2 | Steam side physics (Rankine, HRSG, combined) | Claude Code or Claude extension (Opus 5.5) | Not started | m2 | Critical |
| M3 | 3D plant scene | Antigravity agent (Gemini) | Not started | m3 | |
| M4 | Laws data and info panel | Antigravity agent (Gemini), physics text reviewed by Claude | Not started | m4 | Review French terms |
| M5 | Sliders connected to physics | Claude Code (Opus 5.5) | Not started | m5 | Critical |
| M6 | T-s diagram | Antigravity agent (Gemini) | Not started | m6 | |
| M7 | Flow animation and colors | Antigravity agent (Gemini) | Not started | m7 | |
| M8 | Validation and full audit | Claude Code (Opus 5.5) | Not started | m8 | Critical |
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
