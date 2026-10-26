# CycleLab 3D — Combined Cycle Power Plant Simulator / Simulateur 3D de Centrale à Cycle Combiné

> **Disclaimer / Avertissement :**
> - **EN:** *Simplified educational model, not for plant design.*
> - **FR :** *Modèle pédagogique simplifié, non destiné au dimensionnement industriel.*

---

## 🇬🇧 English Documentation

### 1. Overview
**CycleLab 3D** is an interactive 3D web simulator of a single-shaft Combined Cycle Gas Turbine (CCGT) power plant coupling a **Brayton gas topping cycle** (state points `1–5`) with a **Rankine steam bottoming cycle** (`6–9`) through a single-pressure **Heat Recovery Steam Generator (HRSG)**.

- **Audience:** Graduate and undergraduate engineering students first; practicing engineers second.
- **100% Browser-Based:** Runs entirely client-side with zero backend, zero database, and zero external 3D asset downloads.
- **Verified Thermodynamics:** Pure TypeScript physics engine (`src/physics/`) using SI units (`K`, `kPa`, `kJ/kg`, `kJ/(kg·K)`, `MW`) and `iapws-if97` (`2.8.0`) steam tables, verified within `< 0.1%` First-Law energy closure.
- **Bilingual & Accessible:** Instant switch between **English (`EN`)** and **French (`FR`)**, plus **Dark Graphite** and **Light** themes verified for **WCAG AA** (`>= 4.5:1`) text contrast.

### 2. The 8 Plant Components & 10 Governing Laws
Single-shaft arrangement: **Steam Turbine – Generator – Compressor – Combustor – Gas Turbine → Axial Exhaust Diffuser → HRSG**, with the **Surface Condenser** and **Feedwater Pump** on the auxiliary bay:
1. **First Law of Thermodynamics (Steady Flow):** $\dot{Q} - \dot{W} = \dot{m}(h_{\text{out}} - h_{\text{in}})$
2. **Second Law & Isentropic Efficiency:** $\eta_t, \eta_c, \eta_p$
3. **Ideal Gas Law & Specific Heat Relations:** $p v = R T$, $c_p - c_v = R$, $k = c_p / c_v$
4. **Isentropic Pressure–Temperature Relations:** $T_{2s}/T_1 = (p_2/p_1)^{(k-1)/k}$
5. **Air-Standard Brayton Cycle Efficiency:** $\eta_{\text{Brayton,ideal}} = 1 - r_p^{-(k-1)/k}$
6. **Rankine Vapor Power Cycle Efficiency:** $\eta_{\text{ST}} = (w_{\text{st}} - w_p) / q_{\text{HRSG}}$
7. **HRSG Energy Balance & Pinch Point:** $\Delta T_{\text{pinch}} = T_{g,\text{pinch}} - T_{\text{sat}}(p_{\text{steam}}) \ge 15\text{ K}$
8. **Combustion Heat Input:** $\dot{Q}_{\text{in}} = \dot{m}_f \cdot \text{LHV} \cdot \eta_{\text{comb}}$
9. **Combined Cycle Thermal Efficiency:** $\eta_{\text{CC}} = (\dot{W}_{\text{GT,net}} + \dot{W}_{\text{ST,net}}) / \dot{Q}_{\text{in}}$
10. **Conservation of Mass (Continuity):** $\sum \dot{m}_{\text{in}} = \sum \dot{m}_{\text{out}}$ (with explicit fuel-to-air mass ratio shown at the combustor)

### 3. Local Development & Commands
```bash
# Install locked dependencies
npm install

# Start local development server (http://127.0.0.1:5173)
npm run dev

# Run ESLint, TypeScript type-check, and Vitest unit test suite
npm run lint
npm run typecheck
npm test

# Build production static bundle into ./dist
npm run build

# Preview production static build locally
npm run preview
```

### 4. URL Deep-Link Query Parameters
- `?lang=fr` or `?lang=en` — Start in French or English
- `?theme=light` or `?theme=dark` — Start in Light or Dark Graphite theme
- `?view=realistic`, `?view=xray`, or `?view=temperature` — Set 3D viewport rendering mode
- `?section=plant`, `parameters`, `laws`, `calculations`, `diagram`, or `results` — Open a specific workspace in the main stage
- `?focus=gasTurbine` (`compressor`, `combustor`, `hrsg`, `steamTurbine`, `condenser`, `pump`, `generator`) — Focus camera and inspector on a specific component
- `?quality=low` or `?quality=high` — Set rendering quality mode

### 5. Deployment (GitHub Pages & Netlify)
- **GitHub Pages (`.github/workflows/deploy.yml`):**
  1. Push this repository to GitHub (`main` branch).
  2. In GitHub **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
  3. Every push to `main` automatically runs `lint`, `typecheck`, `test`, and `build`, then publishes `./dist` to your GitHub Pages URL.
- **Netlify (`netlify.toml`):**
  1. In Netlify, click **Add new site → Import an existing project** and select your GitHub repository (or drag-and-drop the `./dist` folder directly to [app.netlify.com/drop](https://app.netlify.com/drop)).
  2. Netlify automatically reads `netlify.toml` (`command = "npm run build"`, `publish = "dist"`, immutable asset caching) and deploys in under 60 seconds.

---

## 🇫🇷 Documentation en Français

### 1. Présentation
**CycleLab 3D** est un simulateur web 3D interactif d'une centrale thermique à cycle combiné gaz-vapeur (CCGT) mono-arbre couplant un **cycle gaz de Brayton** (états `1–5`) et un **cycle vapeur de Rankine** (`6–9`) via une **chaudière de récupération (CRV / HRSG)** à un niveau de pression.

- **Public visé :** Étudiants en écoles d'ingénieurs et universités (niveau Master), ainsi qu'ingénieurs thermiciens souhaitant vérifier rapidement des ordres de grandeur.
- **100 % Navigateur :** Fonctionne intégralement dans le navigateur sans serveur, sans base de données et sans téléchargement de modèles 3D externes.
- **Thermodynamique vérifiée :** Moteur physique pur en TypeScript (`src/physics/`) en unités SI (`K`, `kPa`, `kJ/kg`, `kJ/(kg·K)`, `MW`) avec tables d'eau/vapeur `iapws-if97` (`2.8.0`) et bouclage énergétique du premier principe `< 0,1 %`.
- **Bilingue et accessible :** Bascule instantanée **Anglais (`EN`) / Français (`FR`)**, thèmes **Graphite sombre** et **Clair** conformes aux critères d'accessibilité **WCAG AA** (`>= 4,5:1`).

### 2. Les 8 équipements et les 10 lois thermodynamiques
Ligne d'arbre unique : **Turbine à vapeur (TAV) – Alternateur – Compresseur – Chambre de combustion – Turbine à gaz (TAG) → Diffuseur axial → Chaudière de récupération (CRV)**, avec le **Condenseur par surface** et la **Pompe alimentaire** :
1. **Premier principe en système ouvert :** $\dot{Q} - \dot{W} = \dot{m}(h_{\text{sortie}} - h_{\text{entrée}})$
2. **Deuxième principe et rendement isentropique :** $\eta_t, \eta_c, \eta_p$
3. **Loi des gaz parfaits et capacités thermiques :** $p v = R T$, $c_p - c_v = R$, $k = c_p / c_v$
4. **Relations isentropiques des gaz parfaits :** $T_{2s}/T_1 = (p_2/p_1)^{(k-1)/k}$
5. **Rendement théorique du cycle de Brayton :** $\eta_{\text{Brayton,idéal}} = 1 - r_p^{-(k-1)/k}$
6. **Rendement du cycle vapeur de Rankine :** $\eta_{\text{TAV}} = (w_{\text{tav}} - w_p) / q_{\text{CRV}}$
7. **Bilan énergétique de la CRV et pincement (Pinch Point) :** $\Delta T_{\text{pincement}} = T_{g,\text{pincement}} - T_{\text{sat}}(p_{\text{vapeur}}) \ge 15\text{ K}$
8. **Apport thermique de combustion :** $\dot{Q}_{\text{entrant}} = \dot{m}_f \cdot \text{PCI} \cdot \eta_{\text{comb}}$
9. **Rendement global du cycle combiné :** $\eta_{\text{CC}} = (\dot{W}_{\text{TAG,net}} + \dot{W}_{\text{TAV,net}}) / \dot{Q}_{\text{entrant}}$
10. **Conservation de la masse (Continuité) :** $\sum \dot{m}_{\text{entrée}} = \sum \dot{m}_{\text{sortie}}$

### 3. Développement local et commandes
```bash
npm install        # Installer les dépendances verrouillées
npm run dev        # Lancer le serveur de développement (http://127.0.0.1:5173)
npm run lint       # Vérifier le code avec ESLint
npm run typecheck  # Vérifier le typage TypeScript strict
npm test           # Exécuter les tests unitaires Vitest
npm run build      # Générer le build statique de production dans ./dist
npm run preview    # Prévisualiser le build de production localement
```

### 4. Déploiement (GitHub Pages & Netlify)
- **GitHub Pages :** Le fichier `.github/workflows/deploy.yml` compile, teste et déploie automatiquement le dossier `./dist` sur GitHub Pages à chaque `git push` sur la branche `main`.
- **Netlify :** Le fichier `netlify.toml` configure automatiquement la commande `npm run build` et le dossier de publication `dist` (ou glissez-déposez directement `./dist` sur [app.netlify.com/drop](https://app.netlify.com/drop)).
