# AUDIT REPORT — CycleLab 3D v0.1 (Modules M0–M8)

**Auditor / Builder:** Antigravity + Gemini 4 Argon  
**Tag:** `v0.1-audit`

---

## 1. Automated Verification & Test Results

- **ESLint (`npm run lint`):** Passed (`0` errors, `0` warnings).
- **TypeScript Strict Type-Check (`npm run typecheck`):** Passed (`0` errors).
- **Production Bundle (`npm run build`):** Passed (`dist/` generated cleanly).
- **Vitest Test Suite (`npm test`):** `5` active test files passed (`16 passed | 2 todo (18)`):
  - `tests/setup.test.ts`: EN/FR dictionary structure parity and educational disclaimer verification.
  - `tests/steam.test.ts`: IAPWS-IF97 (`iapws-if97@2.8.0`) verification against benchmark tables (`< 0.5%` tolerance; actual error `< 0.02%`):
    - Saturated at $10\text{ kPa}$: $T_{sat} = 45.81\text{ °C}$, $h_f = 191.81\text{ kJ/kg}$, $s_f = 0.6492\text{ kJ/(kg}\cdot\text{K)}$, $h_g = 2583.9\text{ kJ/kg}$, $s_g = 8.1488\text{ kJ/(kg}\cdot\text{K)}$.
    - Superheated at $5\text{ MPa}, 450\text{ °C}$: $h = 3317.0\text{ kJ/kg}$ (benchmark $3317.2\text{ kJ/kg}$, relative diff $0.006\%$), $s = 6.8208\text{ kJ/(kg}\cdot\text{K)}$ (benchmark $6.8210\text{ kJ/(kg}\cdot\text{K)}$, relative diff $0.003\%$).
  - `tests/brayton.test.ts`: Ideal Brayton efficiency formula, isentropic temperature-pressure relations, ideal gas constant relations, and First-Law energy balance closure (`< 0.1%` required; `0.000%` actual) on compressor, combustor, and gas turbine.
  - `tests/combined.test.ts`: All 9 state points at default sliders, First-Law energy balance and mass conservation closure on all 8 plant components, Law 9 combined efficiency identity ($\eta_{cc} = \eta_{GT} + (1 - \eta_{GT})\cdot\eta_{HRSG}\cdot\eta_{ST}$), HRSG pinch point violation detection (`PINCH_POINT_VIOLATION`), and extreme slider boundary checks.
  - `tests/audit.test.ts`: Recursive EN/FR key parity, T-s diagram SVG coordinate generation, and 3D pipe segment generation.
  - `tests/textbook-brayton.test.ts` & `tests/textbook-combined.test.ts`: Created with `test.todo` and marked `TEXTBOOK_PENDING` awaiting the user's textbook worked examples.

---

## 2. Default Operating Parameters (`SPEC.md` Section 4)

| Parameter | Symbol | Default Value | Unit |
| --- | --- | --- | --- |
| Ambient Air Temperature | $T_1$ | $288.15$ ($15.00\text{ °C}$) | K |
| Ambient Air Pressure | $p_1$ | $101.325$ | kPa |
| Turbine Inlet Temperature (TIT) | $T_3$ | $1400.00$ ($1126.85\text{ °C}$) | K |
| Compressor Pressure Ratio | $r_p$ | $15.0$ | - |
| Air $c_{p,a}$ / $k_a$ | $c_{p,a}, k_a$ | $1.005$ / $1.40$ | kJ/(kg·K) / - |
| Hot Gas $c_{p,g}$ / $k_g$ | $c_{p,g}, k_g$ | $1.150$ / $1.33$ | kJ/(kg·K) / - |
| Isentropic Efficiencies | $\eta_c, \eta_{GT}, \eta_{ST}, \eta_p$ | $0.85, 0.88, 0.85, 0.85$ | - |
| Live Steam Pressure & Temp | $p_8, T_8$ | $5000\text{ kPa}$ ($5\text{ MPa}$), $723.15\text{ K}$ ($450\text{ °C}$) | kPa, K |
| Condenser Pressure | $p_6 = p_9$ | $10.0$ | kPa |
| HRSG Pinch Point | $\Delta T_{pinch}$ | $15.0$ | K |
| Reference Gas Mass Flow Rate | $\dot{m}_{air}$ | $100.00$ | kg/s |

---

## 3. Computed Values for All 9 State Points at Default Sliders

| State | Location | Fluid | $T$ (K) | $T$ (°C) | $p$ (kPa) | $h$ (kJ/kg) | $s$ (kJ/(kg·K)) | $\dot{m}$ (kg/s) | Quality $x$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | Compressor Air Inlet | Air | $288.15$ | $15.00$ | $101.3$ | $289.6$ | $1.0000$ | $100.00$ | — |
| **2** | Compressor Outlet | Air | $684.05$ | $410.90$ | $1519.9$ | $687.5$ | $1.0913$ | $100.00$ | — |
| **3** | Gas Turbine Inlet (TIT) | Flue Gas | $1400.00$ | $1126.85$ | $1519.9$ | $1510.8$ | $1.9149$ | $100.00$ | — |
| **4** | GT Exhaust / HRSG Gas Inlet | Flue Gas | $797.21$ | $524.06$ | $101.3$ | $817.6$ | $2.0400$ | $100.00$ | — |
| **5** | HRSG Stack Exhaust | Flue Gas | $443.64$ | $170.49$ | $101.3$ | $411.0$ | $1.3660$ | $100.00$ | — |
| **6** | Condenser Saturated Liquid Outlet | Liquid Water | $318.96$ | $45.81$ | $10.0$ | $191.8$ | $0.6492$ | $13.04$ | $0.000$ |
| **7** | Feedwater Pump Outlet / HRSG Inlet | Liquid Water | $319.34$ | $46.19$ | $5000.0$ | $197.7$ | $0.6520$ | $13.04$ | — |
| **8** | HRSG Superheated Steam Outlet | Steam | $723.15$ | $450.00$ | $5000.0$ | $3317.0$ | $6.8208$ | $13.04$ | — |
| **9** | Steam Turbine Exhaust | Steam | $318.96$ | $45.81$ | $10.0$ | $2333.8$ | $7.3648$ | $13.04$ | $0.895$ |

*Additional HRSG internal benchmarks at default sliders:*
- Boiler Drum Saturation Temperature ($T_{sat}$ at $5\text{ MPa}$): $537.09\text{ K}$ ($263.94\text{ °C}$)
- Flue Gas Temperature at Evaporator Pinch ($T_{g,pinch} = T_{sat} + 15\text{ K}$): $552.09\text{ K}$ ($278.94\text{ °C}$)
- HRSG Thermal Power Recovered ($\dot{Q}_{HRSG}$): $40.66\text{ MW}$

---

## 4. Plant Performance Summary at Default Sliders

| Metric | Symbol | Computed Value | Unit |
| --- | --- | --- | --- |
| Compressor Power Absorbed | $\dot{W}_c$ | $39.79$ | MW |
| Gas Turbine Gross Power | $\dot{W}_{GT,gross}$ | $69.32$ | MW |
| **Gas Turbine Net Power** | $\dot{W}_{GT,net}$ | **$29.53$** | **MW** |
| Feedwater Pump Power Absorbed | $\dot{W}_p$ | $0.077$ | MW |
| Steam Turbine Gross Power | $\dot{W}_{ST,gross}$ | $12.82$ | MW |
| **Steam Turbine (Rankine) Net Power** | $\dot{W}_{ST,net}$ | **$12.74$** | **MW** |
| **Combined Cycle Net Power** | $\dot{W}_{net}$ | **$42.27$** | **MW** |
| Combustor Fuel Heat Input | $\dot{Q}_{in}$ | $82.33$ | MW |
| Condenser Heat Rejected | $\dot{Q}_{cond}$ | $27.92$ | MW |
| Fuel Mass Flow Rate | $\dot{m}_f$ | $1.66$ | kg/s |
| Steam Mass Flow Rate | $\dot{m}_s$ | $13.04$ | kg/s |
| Cold-Air-Standard Ideal Brayton Efficiency | $\eta_{Brayton,ideal}$ | $53.87$ | % |
| **Actual Gas Turbine (Brayton) Efficiency** | $\eta_{GT}$ | **$35.87$** | **%** |
| Rankine Cycle Thermal Efficiency | $\eta_{ST}$ | $31.33$ | % |
| HRSG Heat Recovery Effectiveness | $\eta_{HRSG}$ | $77.01$ | % |
| **Combined Cycle Thermal Efficiency** | $\eta_{cc}$ | **$51.34$** | **%** |

---

## 5. Known Limitations (Version 1 Scope)

1. **Constant Specific Heats on Gas Side:** Air ($c_{p,a} = 1.005\text{ kJ/(kg}\cdot\text{K)}, k_a = 1.4$) and flue gas ($c_{p,g} = 1.15\text{ kJ/(kg}\cdot\text{K)}, k_g = 1.33$) use constant specific heats rather than temperature-dependent NASA polynomials.
2. **Constant Gas-Path Mass Flow Rate:** Following the 9-state-point steady-flow model where $\Sigma \dot{m}_{in} = \Sigma \dot{m}_{out}$ and $\dot{Q} - \dot{W} = \dot{m}(h_{out} - h_{in})$ apply directly between each component's inlet and outlet state points (`1→2→3→4→5`), the gas path uses a constant reference flow rate $\dot{m}_g = 100\text{ kg/s}$, while fuel mass flow $\dot{m}_f$ is computed from Law 8 ($\dot{Q}_{in} = \dot{m}_f \cdot \text{LHV} \cdot \eta_{comb}$).
3. **Negligible Pressure Drops:** Combustor, HRSG, and condenser pressure drops are neglected ($p_3 = p_2$, $p_5 = p_4 = p_1$, $p_8 = p_7$, $p_6 = p_9$).
4. **Single-Pressure Unfired HRSG:** Only one boiler pressure ($5\text{ MPa}$) without reheat or supplemental duct firing is modeled in v1.
5. **Pending Textbook Validation:** `tests/textbook-brayton.test.ts` and `tests/textbook-combined.test.ts` contain `test.todo` placeholders (`TEXTBOOK_PENDING`) awaiting the user's specific textbook worked problem inputs.
