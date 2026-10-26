# French Physics & Turbomachinery Terms to Review (`src/i18n/fr.json`)

Every French technical and thermodynamic term in `src/i18n/fr.json` is listed below with its JSON key, English equivalent, and engineering note for review by Hatem.

| JSON Key | English Term (`en.json`) | French Term (`fr.json`) | Engineering Review Note |
| --- | --- | --- | --- |
| `appSubtitle` | Combined Cycle Power Plant Simulator (Brayton + Rankine) | Simulateur de centrale à cycle combiné (Brayton + Rankine) | Standard term: *centrale à cycle combiné* (CCGT / CCPP). |
| `disclaimer` | Simplified educational model, not for plant design. | Modèle pédagogique simplifié, non destiné au dimensionnement industriel. | Required educational disclaimer. |
| `animation.play` / `pause` | Play Flow / Pause Flow | Animer l'écoulement / Pause écoulement | *Écoulement* = fluid flow. |
| `sliders.titLabel` | Turbine Inlet Temperature (T3) | Température d'entrée turbine (T3) | Abbreviated TET in French (*Température d'Entrée Turbine*) / TIT in English. |
| `sliders.rpLabel` | Compressor Pressure Ratio (rp) | Taux de compression (rp) | Also called *rapport de pression*. |
| `sliders.etaComp` | Compressor Isentropic Eff. (η_c) | Rendement isentropique compresseur (η_c) | *Rendement isentropique* is the standard thermodynamic term. |
| `sliders.etaGt` | Gas Turbine Isentropic Eff. (η_GT) | Rendement isentropique turbine à gaz (η_GT) | TAG = *Turbine à gaz*. |
| `sliders.etaSt` | Steam Turbine Isentropic Eff. (η_ST) | Rendement isentropique turbine à vapeur (η_ST) | TAV = *Turbine à vapeur*. |
| `sliders.etaPump` | Feedwater Pump Isentropic Eff. (η_p) | Rendement isentropique pompe alimentaire (η_p) | *Pompe alimentaire* = boiler feedwater pump. |
| `sliders.steamPress` | Live Steam Pressure (p8) | Pression de vapeur vive (p8) | *Vapeur vive* = main/live superheated steam entering the turbine. |
| `sliders.steamTemp` | Live Steam Temperature (T8) | Température de vapeur vive (T8) | Live steam temperature at HRSG superheater outlet. |
| `sliders.condPress` | Condenser Pressure (p6 = p9) | Pression au condenseur (p6 = p9) | Vacuum pressure in the surface condenser. |
| `sliders.pinchPoint` | HRSG Pinch Point (ΔT_pinch) | Pincement CRV / HRSG (ΔT_pinch) | *Point de pincement* or *pincement*; CRV = *Chaudière de Récupération de Vapeur*. |
| `sliders.airMassFlow` | Air Mass Flow Rate (ṁ_air) | Débit massique d'air (ṁ_air) | *Débit massique* = mass flow rate (kg/s). |
| `results.gtPower` | Gas Turbine Net Power | Puissance nette turbine à gaz | Net shaft power of the Brayton topping cycle. |
| `results.stPower` | Steam Cycle Net Power | Puissance nette cycle vapeur | Net shaft power of the Rankine bottoming cycle. |
| `results.netPower` | Combined Cycle Net Power | Puissance nette du cycle combiné | Total net plant power output. |
| `results.gtEfficiency` | Brayton (GT) Thermal Efficiency | Rendement thermique Brayton (TAG) | First-law thermal efficiency of the gas turbine cycle. |
| `results.stEfficiency` | Rankine (ST) Thermal Efficiency | Rendement thermique Rankine (TAV) | First-law thermal efficiency of the steam cycle. |
| `results.hrsgEfficiency` | HRSG Heat Recovery Effectiveness | Efficacité de récupération (CRV) | Ratio of heat absorbed by steam to sensible heat above ambient in GT exhaust. |
| `results.ccEfficiency` | Combined Cycle Efficiency | Rendement global du cycle combiné | Overall net efficiency $\eta_{cc}$. |
| `results.fuelMassFlow` | Fuel Mass Flow Rate | Débit massique de combustible | Fuel mass flow rate $\dot{m}_f$. |
| `results.steamMassFlow` | Steam Mass Flow Rate | Débit massique de vapeur | Steam mass flow rate $\dot{m}_s$. |
| `results.heatInput` | Fuel Heat Input (Q_in) | Puissance thermique apportée (Q_in) | Thermal power released by fuel combustion. |
| `results.pinchTempGas` | HRSG Gas Evaporator Exit (T_pinch,g) | Température gaz au pincement (T_pinch,g) | Flue gas temperature leaving the evaporator section ($T_{sat} + \Delta T_{pinch}$). |
| `results.satTempSteam` | HRSG Drum Saturation Temp (T_sat) | Température de saturation ballon (T_sat) | *Ballon* = steam drum; saturation temperature at boiler pressure. |
| `components.compressor.name` | Axial Air Compressor | Compresseur axial d'air | Standard turbomachinery term. |
| `components.combustor.name` | Combustion Chamber | Chambre de combustion | Standard term. |
| `components.gasTurbine.name` | Gas Turbine | Turbine à gaz (TAG) | Standard term. |
| `components.hrsg.name` | Heat Recovery Steam Generator (HRSG) | Chaudière de récupération (CRV / HRSG) | Both CRV and HRSG are commonly used in French power engineering. |
| `components.steamTurbine.name` | Steam Turbine | Turbine à vapeur (TAV) | Standard term. |
| `components.condenser.name` | Surface Condenser | Condenseur par surface | Shell-and-tube water-cooled steam condenser. |
| `components.pump.name` | Feedwater Pump | Pompe alimentaire | Boiler feedwater pump (*pompe alimentaire*). |
| `components.generator.name` | Synchronous Electric Generator | Alternateur synchrone | *Alternateur synchrone* is preferred in French over *générateur*. |
| `statePoints.fluids.air` | Air | Air | Working fluid at states 1–2. |
| `statePoints.fluids.gas` | Flue Gas | Gaz brûlés | Also called *gaz de combustion* or *fumées* at states 3–5. |
| `statePoints.fluids.water` | Liquid Water | Eau liquide | Subcooled/saturated liquid water at states 6–7. |
| `statePoints.fluids.steam` | Steam | Vapeur d'eau | Superheated or wet steam at states 8–9. |
| `statePoints.labels.1` | Compressor Air Inlet | Admission d'air compresseur | *Admission* = inlet/suction. |
| `statePoints.labels.2` | Compressor Outlet | Refoulement compresseur | *Refoulement* = compressor/pump discharge. |
| `statePoints.labels.3` | Gas Turbine Inlet (TIT) | Entrée turbine à gaz (TET / TIT) | Combustor exit / turbine inlet. |
| `statePoints.labels.4` | Gas Turbine Exhaust / HRSG Gas Inlet | Échappement TAG / Entrée gaz CRV | *Échappement* = exhaust. |
| `statePoints.labels.5` | HRSG Stack Exhaust | Cheminée d'échappement CRV | *Cheminée* = stack. |
| `statePoints.labels.6` | Condenser Saturated Liquid Outlet | Sortie liquide saturé du condenseur | *Liquide saturé* = saturated liquid ($x = 0$). |
| `statePoints.labels.7` | Feedwater Pump Outlet / HRSG Water Inlet | Refoulement pompe alimentaire / Entrée eau CRV | Subcooled compressed water entering the economizer. |
| `statePoints.labels.8` | HRSG Superheated Steam Outlet | Sortie vapeur surchauffée CRV | *Vapeur surchauffée* = superheated steam. |
| `statePoints.labels.9` | Steam Turbine Exhaust | Échappement turbine à vapeur | Wet steam (*vapeur humide*) entering the condenser. |
| `laws.law1.title` | First Law of Thermodynamics (Steady Flow) | Premier principe en régime permanent (système ouvert) | *Premier principe en système ouvert / régime stationnaire*. |
| `laws.law2.title` | Second Law & Isentropic Efficiency | Second principe et rendement isentropique | *Second principe de la thermodynamique*. |
| `laws.law3.title` | Ideal Gas Equation of State | Loi des gaz parfaits | *Gaz parfait* = ideal gas; *capacités thermiques massiques* = specific heats. |
| `laws.law4.title` | Isentropic Relations for Ideal Gases | Relations isentropiques des gaz parfaits | Laplace/isentropic relations for ideal gases. |
| `laws.law5.title` | Ideal Brayton Cycle Efficiency | Rendement théorique du cycle de Brayton | Cold-air-standard Brayton efficiency. |
| `laws.law6.title` | Rankine Cycle Thermal Efficiency | Rendement thermique du cycle de Rankine | Vapour power cycle efficiency. |
| `laws.law7.title` | HRSG Energy Balance & Pinch Point | Bilan énergétique de la CRV et point de pincement | Heat recovery balance and evaporator pinch point. |
| `laws.law8.title` | Combustion Heat Input | Apport thermique de combustion | Note: LHV in French is *PCI (Pouvoir Calorifique Inférieur)*, noted in explanation. |
| `laws.law9.title` | Combined Cycle Thermal Efficiency | Rendement thermique du cycle combiné | Combined topping + bottoming efficiency. |
| `laws.law10.title` | Conservation of Mass (Continuity) | Conservation de la masse (équation de continuité) | Steady-state mass balance. |
| `diagram.satDomeLegend` | Water/Steam Saturation Dome | Cloche de saturation eau/vapeur | *Cloche de saturation* = saturation dome on T-s diagram. |
| `diagram.xAxis` | Specific Entropy s [kJ/(kg·K)] | Entropie massique s [kJ/(kg·K)] | *Entropie massique* = specific entropy. |
