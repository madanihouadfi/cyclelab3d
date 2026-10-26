# SPEC: CycleLab 3D (working name)

An interactive 3D web simulator of a combined cycle power plant (Brayton gas cycle + Rankine steam cycle). The user clicks each piece of equipment, sees the law that works there, and moves sliders to see real thermodynamic results.

## 1. Goal

- Teach graduate-level thermodynamics through a 3D plant the user can explore.
- Show correct formulas and correct numbers, not only animation.
- Free, runs in any browser, easy to share by link.
- Languages: English and French.

## 2. Users and permissions

- One role only: **visitor**. No login, no accounts, no personal data.
- Main audience: engineering students. Second audience: engineers who want to check numbers.
- The app is read-only for the visitor: they change sliders and click, nothing is saved on a server.

## 3. Tech stack (versions are pinned in M0 and written in HANDOFF.md)

- Web app that runs fully in the browser. **No backend, no database, no secrets.**
- Vite + TypeScript + React.
- 3D: Three.js with React Three Fiber (and drei helpers).
- Tests: Vitest (for the physics code).
- Texts: separate JSON dictionaries `en` and `fr` (no hard-coded text in components).
- Diagrams (T-s): drawn with SVG by our own component.
- Hosting: free static hosting (GitHub Pages, Netlify or Vercel). Decided in M9.

## 4. Physics model for version 1

Units: SI. Temperature in K, pressure in kPa, enthalpy in kJ/kg, entropy in kJ/(kg·K), power in MW.

**Gas side (Brayton)**
- Constant specific heats. Starting values (confirm against the course textbook in the M1 plan): air cp = 1.005 kJ/(kg·K), k = 1.4; hot gas cp = 1.15 kJ/(kg·K), k = 1.33.
- Ambient: T1 = 288.15 K, p1 = 101.325 kPa.
- Combustion: heat input from fuel flow and LHV, with a combustion efficiency. Simplified (no chemical equilibrium).

**Steam side (Rankine)**
- Single-pressure HRSG, one steam turbine, one condenser, one pump.
- Water and steam properties from a verified free library, chosen in the M2 plan. Fallback: a small table checked against a textbook.

**State points**
- Gas: 1 air inlet, 2 compressor outlet, 3 turbine inlet, 4 turbine outlet and HRSG inlet, 5 stack.
- Steam: 6 condenser outlet, 7 pump outlet, 8 HRSG outlet (superheated), 9 steam turbine outlet.

**Slider ranges and defaults (can be tuned in the plan of M1/M2)**
- Turbine inlet temperature: 1100 to 1700 K, default 1400 K.
- Pressure ratio: 8 to 30, default 15.
- Isentropic efficiencies: compressor 0.85, gas turbine 0.88, steam turbine 0.85, pump 0.85.
- Steam: 5 MPa, 450 °C. Condenser: 10 kPa. HRSG pinch point: 15 K.

## 5. The 10 laws to highlight (each one is shown at the right component)

| # | Law | Main formula | Where shown |
| --- | --- | --- | --- |
| 1 | First law, steady flow | Q − W = ṁ(h2 − h1) | Every component |
| 2 | Second law, isentropic efficiency | η_t = (h_in − h_out) / (h_in − h_out,s) | Compressor, turbines, pump |
| 3 | Ideal gas | p·v = R·T ; cp − cv = R ; k = cp/cv | Compressor, combustor, gas turbine |
| 4 | Isentropic relations | T2s/T1 = (p2/p1)^((k−1)/k) | Compressor, gas turbine |
| 5 | Brayton cycle | η = 1 − 1 / r_p^((k−1)/k) (ideal) | Gas cycle panel |
| 6 | Rankine cycle | η = (w_t − w_p) / q_in | Steam cycle panel |
| 7 | HRSG energy balance and pinch point | ṁ_g·cp_g·ΔT_g = ṁ_s·Δh_s ; ΔT_pinch = T_g − T_sat | HRSG |
| 8 | Combustion heat input | Q_in = ṁ_f · LHV · η_comb | Combustor |
| 9 | Combined cycle efficiency | η_cc = η_GT + (1 − η_GT)·η_HRSG·η_ST | Plant summary |
| 10 | Mass conservation | Σṁ_in = Σṁ_out | Every component |

## 6. Data model (no database, only data files in the code)

- **Component:** id, name_en, name_fr, 3D position, list of law ids, inlet and outlet state point ids.
- **StatePoint:** id, fluid (air, gas, water, steam), T, p, h, s, ṁ. Values come from the physics code.
- **Law:** id, title_en, title_fr, formula (text), explanation_en, explanation_fr, variables list.
- **Parameters:** the slider values and fixed efficiencies.

## 7. Screens and interactions

1. **Main screen:** 3D plant (orbit, zoom), language switch (EN/FR), slider panel, results panel.
2. **Component selected:** the component is highlighted. A side panel shows its name, its laws, the live formula with the current numbers, and its inlet and outlet values.
3. **Results panel:** gas turbine power, steam turbine power, net power, GT efficiency, combined cycle efficiency.
4. **T-s diagram:** both cycles, with the state points marked. Hover on a point shows its values.
5. **Animation:** flow moving along the pipes. Pipe color shows temperature (simple cold-to-hot scale).
6. **Mobile:** usable on a phone (panel becomes a bottom sheet).

## 8. Quality and security

- No secret keys anywhere. No external scripts except npm packages that we install and lock.
- Physics code is separate from UI code and covered by unit tests.
- Every number shown must come from the physics code, never typed by hand in the UI.
- Results are checked against a worked combined cycle example from a standard thermodynamics textbook (the one the user owns).
- Only our own simple 3D shapes. No downloaded models with unclear licenses.
- Show a clear note: "Simplified educational model, not for plant design."

## 9. Modules and acceptance criteria

| Module | Content | Strongest model needed? | Acceptance criteria |
| --- | --- | --- | --- |
| **M0** | Project setup | No | Empty app runs; build, lint and test commands work; EN/FR switch works on one sample text; repo and first tag exist |
| **M1** | Gas side physics (Brayton engine) | **Yes** | Pure functions for compressor, combustor, gas turbine, cycle; unit tests pass; one textbook Brayton example matches within 1% |
| **M2** | Steam side physics (Rankine, HRSG, combined cycle) | **Yes** | Pump, HRSG with pinch point, steam turbine, condenser, combined efficiency; one textbook combined cycle example matches within 1%; pinch violation is detected and reported |
| **M3** | 3D plant scene | No | 8 components as simple shapes, connected by pipes; orbit and zoom; click highlights a component; works on phone |
| **M4** | Laws data and info panel | No (physics text reviewed by a strong Claude model) | Click shows the laws of that component in EN and FR with formula; the 10 laws all appear at least once; French terms reviewed by the user |
| **M5** | Sliders connected to the physics | **Yes** | Moving a slider updates results and the live numbers in the panel in under 200 ms; values match M1/M2 tests; invalid combinations show a clear message |
| **M6** | T-s diagram | No | Both cycles drawn correctly from the state points; hover shows values; updates with sliders |
| **M7** | Flow animation and temperature colors | No | Flow moves along all pipes in the right direction; colors follow temperature; animation can be paused |
| **M8** | Validation and full audit | **Yes** | All tests pass; second textbook example checked; edge cases (extreme sliders) handled; no hard-coded numbers or texts; accessibility basics; written audit report |
| **M9** | Polish, deploy, demo | No | Public link works; loads in under 5 seconds on a normal connection; README in EN and FR; short demo script |

Sub-modules use letters (M3a, M3b) when a module grows.

## 10. LATER (not in version 1)

- Detailed internals (blade stages, cooling, bearings).
- Auxiliary systems (lube oil, fuel gas, cooling water).
- Multi-pressure HRSG, reheat, duct firing.
- Part-load operation, ambient temperature effect, degradation.
- Failures and trips.
- Variable specific heats, real combustion chemistry.
- Quiz mode, teacher mode, saved scenarios.
- More languages (Arabic).

## 11. Open questions (they do not block the start)

1. Gas properties: constant cp (default for v1) or a library with variable cp later?
2. Which steam property library to use? Decided in the M2 plan.
3. Animation: flow plus temperature colors is the default. Confirm in M7.
4. Which textbook will be used for validation examples?
5. Final project name.
6. Hours per week available (this sets the speed, not the plan).
