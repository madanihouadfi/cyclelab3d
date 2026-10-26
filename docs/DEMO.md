# CycleLab 3D — 3-Minute Demo Script / Script de Démonstration (3 minutes)

---

## 🇬🇧 English Demo Script (3 Minutes)

### Minute 1 — Single-Shaft 3D Plant & Internal Turbomachinery (`0:00 – 1:00`)
1. **Open the Simulator (`?theme=dark`):**
   - Point out the **5 KPI cards** beneath the 3D viewport at default operating conditions ($T_3 = 1400\text{ K}$, $r_p = 15$): Gas Turbine Net Power (`29.53 MW`), Steam Cycle Net Power (`12.74 MW`), Combined Cycle Net Power (`42.27 MW`), Brayton Efficiency (`35.87%`), and Combined Cycle Efficiency (`51.34%`).
2. **Walk the Single-Shaft Powertrain:**
   - Trace the continuous 3000 rpm synchronous shaft from left to right: **Steam Turbine → Synchronous Generator → Axial Compressor** (with elevated air intake filter house) **→ Can-Annular Combustor** (with educational flame cutaway) **→ Gas Turbine → Axial Exhaust Diffuser → HRSG**.
3. **Switch View Modes (`Realistic` → `X-ray` → `Temperature`):**
   - Click **X-ray** at the top-center of the 3D viewport and click the **Gas Turbine**: show students the spinning multi-stage bladed compressor and turbine rotors inside the semi-transparent wireframe casing and the dense streamline pulses flowing from the combustor into the HRSG.
   - Click **Temperature** to show the live thermodynamic temperature gradient (`288 K` to `1700 K`) across all equipment and piping.

### Minute 2 — Inspecting Component Physics & The 10 Laws (`1:00 – 2:00`)
1. **Click the Combustion Chamber (`combustor`):**
   - In the right-hand **Equipment Inspector**, highlight **State 2** (compressor discharge) and **State 3** (turbine inlet), then scroll to **Law 8 (Combustion Heat Input)** and **Law 10 (Mass Conservation)** showing live $\dot{m}_{\text{air}}$, $\dot{m}_{\text{fuel}}$, the fuel-to-air mass ratio in `%`, and the air-standard assumption note.
2. **Click the HRSG (`hrsg`):**
   - Point out the 3 glowing tube banks in gas flow order: **Superheater** (hottest, red-orange) → **Evaporator + Top Steam Drum** (amber) → **Economizer** (coolest, green-blue near the stack), and inspect **Law 7 (HRSG Energy Balance & Pinch Point)**.

### Minute 3 — Full-Page T–s Diagram, Sliders & Pinch Violation (`2:00 – 3:00`)
1. **Open the Full-Page T–s Diagram:**
   - Click **T–s Diagram** in the left sidebar. The interactive **Temperature–Entropy ($T\text{–}s$) Diagram** expands to fill the center workspace, showing the orange **Brayton Topping Cycle (`1–5`)**, the teal **Rankine Bottoming Cycle (`6–9`)**, and the **Water Saturation Dome**.
2. **Drag the Sliders Live:**
   - Increase **Turbine Inlet Temperature ($T_3$)** from `1400 K` to `1600 K`: watch point `3` rise on the T–s diagram and Combined Cycle Net Power jump to `59.43 MW` (`54.73%` efficiency).
   - Now lower $T_3$ to `1150 K` and push **Compressor Pressure Ratio ($r_p$)** to `28`: show how the gas turbine exhaust ($T_4$) becomes too cool to boil steam at `5 MPa`, triggering the clear **HRSG Pinch-Point Violation** alert and pausing the shaft/flow animation.
3. **Reset & Language/Theme Switch:**
   - Click **Reset to defaults** in the top bar, toggle **Light Mode (`☀`)**, and switch **EN → FR** to show the complete French engineering interface.

---

## 🇫🇷 Script de Démonstration en Français (3 Minutes)

### Minute 1 — Visite de la centrale 3D mono-arbre et vue Rayons X (`0:00 – 1:00`)
1. **Vue d'ensemble (`?lang=fr`) :**
   - Présenter les **5 cartes de résultats** sous la scène 3D aux conditions nominales ($T_3 = 1400\text{ K}$, $r_p = 15$) : Puissance nette TAG (`29,53 MW`), Puissance nette TAV (`12,74 MW`), Puissance nette du cycle combiné (`42,27 MW`), Rendement Brayton (`35,87 %`) et Rendement global du cycle combiné (`51,34 %`).
2. **Ligne d'arbre synchrone (3000 tr/min, 50 Hz) :**
   - Suivre la ligne d'arbre de gauche à droite : **Turbine à vapeur → Alternateur synchrone → Compresseur axial** (avec caisson de filtration d'air surélevé) **→ Chambre de combustion** (avec vue en coupe pédagogique) **→ Turbine à gaz → Diffuseur d'échappement axial → Chaudière de récupération (CRV / HRSG)**.
3. **Modes d'affichage (`Réaliste` → `Rayons X` → `Température`) :**
   - Cliquer sur **Rayons X** en haut de la vue 3D : observer à travers les carters en fil de fer semi-transparents les rotors multi-étagés à aubes en rotation et les impulsions d'écoulement internes.

### Minute 2 — Inspection des équipements et des 10 lois (`1:00 – 2:00`)
1. **Sélectionner la Chambre de combustion :**
   - Dans le panneau **Inspecteur d'équipement** à droite, montrer les états d'entrée (`2`) et de sortie (`3`), la **Loi 8 (Apport thermique de combustion avec PCI)** et la **Loi 10 (Conservation de la masse)** affichant le rapport $\dot{m}_{\text{carburant}}/\dot{m}_{\text{air}}$ en `%` et la note sur l'hypothèse gaz standard à l'air.
2. **Sélectionner la Chaudière de récupération (CRV / HRSG) :**
   - Montrer les 3 faisceaux tubulaires dans le sens des gaz : **Surchauffeur** (le plus chaud) → **Évaporateur + Ballon supérieur** → **Économiseur** (près de la cheminée), ainsi que la **Loi 7 (Bilan énergétique CRV et pincement)**.

### Minute 3 — Diagramme T–s pleine page, curseurs et violation du pincement (`2:00 – 3:00`)
1. **Ouvrir le Diagramme T–s en pleine page :**
   - Cliquer sur **Diagramme T–s** dans la barre latérale gauche : le diagramme Température–Entropie occupe toute la scène centrale avec les points d'état `1` à `9` cliquables.
2. **Faire varier les curseurs en temps réel :**
   - Augmenter **$T_3$** de `1400 K` à `1600 K` : observer la déformation instantanée du cycle de Brayton et la hausse du rendement global à `54,73 %`.
   - Abaisser $T_3$ à `1150 K` et monter **$r_p$** à `28` : montrer l'alerte pédagogique de **violation de l'écart de pincement dans la CRV** lorsque les gaz d'échappement deviennent trop froids.
3. **Réinitialisation et Thème Clair :**
   - Cliquer sur **Réinitialiser** en haut à droite et basculer entre le mode **Sombre (`☾`)** et **Clair (`☀`)**.
