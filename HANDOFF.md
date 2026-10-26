# HANDOFF: CycleLab 3D (working name)

Short summary for any new chat. If it disagrees with `docs/PROGRESS.md`, PROGRESS.md wins.

## Who the user is

- Hatem, mechanical engineer, beginner at vibe coding. Strong in thermodynamics and rotating equipment, new to coding.
- Writes in English (French is a target language of the app, so French checks are needed).

## How to help

- Simple numbered steps, one thing at a time. Short replies.
- Exact English prompts for the builder agent, in code blocks.
- Never ask for secrets. Do only what is asked. Always give the exact next action.
- End every coach reply with the status line:
  `📍 Module: [Mx name] | Progress: [%] | Overall: [done/10 modules] | Builder: [tool + model] | Next: [exact action]`

## The project

An interactive 3D web simulator of a combined cycle power plant (Brayton + Rankine). Click equipment, see the law that applies, move sliders (turbine inlet temperature, pressure ratio), see real thermodynamic results and a T-s diagram. English and French. For students and engineers. Free, browser only.

## Key decisions

- Version 1 is small: 8 components (compressor, combustor, gas turbine, HRSG, steam turbine, condenser, pump, generator), simple 3D shapes.
- 10 laws only (first law, second law and isentropic efficiency, ideal gas, isentropic relations, Brayton, Rankine, HRSG pinch point, combustion, combined cycle efficiency, mass conservation).
- Real calculations with constant specific heats on the gas side; a verified library for steam.
- No backend, no database, no secrets.
- Biggest risk: wrong numbers. Every formula is unit tested against a textbook example.

## Stack

Vite, TypeScript, React, Three.js with React Three Fiber, Vitest, JSON dictionaries for EN/FR.

### Pinned Package Versions (M0)

- **Runtime dependencies:**
  - `react`: `18.3.1`
  - `react-dom`: `18.3.1`
  - `three`: `0.170.0`
  - `@react-three/fiber`: `8.17.10`
  - `@react-three/drei`: `9.121.4`
  - `iapws-if97`: `2.8.0` (License: **MIT** — IAPWS-IF97 industrial water and steam property library)
- **Dev dependencies:**
  - `vite`: `6.0.6`
  - `typescript`: `5.7.2`
  - `vitest`: `2.1.8`
  - `eslint`: `9.17.0`
  - `@eslint/js`: `9.17.0`
  - `typescript-eslint`: `8.18.2`
  - `eslint-plugin-react-hooks`: `5.1.0`
  - `eslint-plugin-react-refresh`: `0.4.16`
  - `globals`: `15.14.0`
  - `@vitejs/plugin-react`: `4.3.4`
  - `@types/react`: `18.3.18`
  - `@types/react-dom`: `18.3.5`
  - `@types/three`: `0.170.0`

## Tools and limits

- Antigravity agent (Gemini models): routine work, screens, 3D shapes, small fixes.
- Claude Opus 5.5 (Claude Code or the Claude extension in the IDE): physics, wiring, final audit.
- Check quota before each module. Write the tool and model used in `docs/PROGRESS.md`.

## Progress

| Module | Name | Status |
| --- | --- | --- |
| M0 | Project setup | Done (`v0.1-M0`) |
| M1 | Gas side physics | Done (`v0.1-physics`) |
| M2 | Steam side physics | Done (`v0.1-physics`) |
| M3 | 3D plant scene | Done (`v0.1-ui`) |
| M4 | Laws and info panel | Done (`v0.1-ui`) |
| M5 | Sliders connected | Done (`v0.1-ui`) |
| M6 | T-s diagram | Done (`v0.1-ui`) |
| M7 | Flow animation | Done (`v0.1-ui`) |
| M8 | Validation and audit | Done (`v0.1-audit`) |
| M9 | Polish and deploy | Not started |

Overall: 9/10.

## Next steps

1. Put these 4 files in the project folder (see below).
2. Create the build-coach Claude Project.
3. Start M0 in a new builder chat.

## Files in the project root

```
HANDOFF.md
docs/SPEC.md
docs/RULES.md
docs/PROGRESS.md
```

## Prompt templates

**Plan (no code):**
```
Read docs/SPEC.md, docs/RULES.md and docs/PROGRESS.md.
Task: module [NAME].
Scope: see the module row in docs/SPEC.md section 9.
Do not write any code yet. Show me:
1) Files to create or modify
2) Any new packages (ask for approval)
3) Screens and components
4) Manual test steps for me
5) Risks or questions that need my decision
Wait for my approval.
```

**Build:**
```
Approved. Implement the plan fully, then: run lint, type-check, tests and the production build and fix any errors; explain what you did in 5 lines; give me manual test steps; update docs/PROGRESS.md.
Also run the dev server, open the app in the browser, check English and French (and a phone-size window if the UI changed), and report what you checked with screenshots.
Do not start another module.
```

**Commit:**
```
Everything works. Commit all changes with the message "[MESSAGE]" and create a tag [TAG]. Show me each command before running it. Do not start another module.
```

## Habits

- One module, one chat, one commit, one tag.
- Never share secret keys in chat or Git.
- Read every plan, every command and every diff.
- Review French physics terms yourself.
- If the same error repeats 3 times, open a new chat with only the error and the relevant file.
- Keep SPEC.md and PROGRESS.md updated. They are the real memory.
