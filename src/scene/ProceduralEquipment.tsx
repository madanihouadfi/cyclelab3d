import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { ComponentMeta } from '../physics';
import type {
  CombustorGlowParams,
  HrsgTubeBankParams,
  QualityMode,
} from './animationParams';
import type { ViewMode } from '../ui/theme';
import { getProceduralTextures, mergeStaticParts } from './proceduralMaterials';

export interface ProceduralEquipmentProps {
  meta: ComponentMeta;
  position: [number, number, number];
  isSelected: boolean;
  colorHex: string;
  label: string;
  cutawayLabel: string;
  shaftAngularSpeed: number;
  combustorGlow: CombustorGlowParams;
  hrsgTubeBanks: HrsgTubeBankParams;
  qualityMode: QualityMode;
  viewMode: ViewMode;
  cutawayOpen?: boolean;
  speedMultiplier?: number;
  onSelect: () => void;
}

/**
 * Helper to create a revolved LatheGeometry aligned along the horizontal X-axis
 * from an array of [xOffset, radius] profile points.
 * Supports partial revolution (phiStart, phiLength) to create true open cutaway windows
 * with zero transparency depth-sorting artifacts.
 */
function createHorizontalLatheGeometry(
  profileXR: [number, number][],
  radialSegments: number,
  phiStart = 0,
  phiLength = Math.PI * 2,
): THREE.BufferGeometry {
  const pts = profileXR.map(([x, r]) => new THREE.Vector2(r, x));
  const geom = new THREE.LatheGeometry(pts, radialSegments, phiStart, phiLength);
  geom.rotateZ(-Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a multi-stage bladed turbomachinery rotor (hub drum + discs + twisted airfoil blade rows)
 * merged into a single BufferGeometry so the entire multi-stage rotor spins in 1 draw call.
 */
function createMultiStageRotorGeometry(
  stages: { x: number; rHub: number; rTip: number; blades: number; twistRad?: number }[],
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  if (stages.length >= 2) {
    const minX = stages[0].x;
    const maxX = stages[stages.length - 1].x;
    const avgHub =
      stages.reduce((acc, s) => acc + s.rHub, 0) / Math.max(1, stages.length);
    const drum = new THREE.CylinderGeometry(
      avgHub * 0.88,
      avgHub * 0.88,
      Math.max(0.2, maxX - minX + 0.18),
      18,
    );
    drum.rotateZ(Math.PI / 2);
    drum.translate((minX + maxX) * 0.5, 0, 0);
    parts.push(drum);
  }

  for (const st of stages) {
    const disc = new THREE.CylinderGeometry(st.rHub, st.rHub, 0.065, 18);
    disc.rotateZ(Math.PI / 2);
    disc.translate(st.x, 0, 0);
    parts.push(disc);

    const bladeSpan = Math.max(0.08, st.rTip - st.rHub);
    const midR = st.rHub + bladeSpan * 0.5;
    const twist = st.twistRad ?? 0.38;

    for (let b = 0; b < st.blades; b++) {
      const angle = (b / st.blades) * Math.PI * 2;
      const blade = new THREE.BoxGeometry(0.032, bladeSpan, 0.088);
      blade.rotateY(twist);
      blade.translate(0, midR, 0);
      blade.rotateX(angle);
      blade.translate(st.x, 0, 0);
      parts.push(blade);
    }
  }

  return mergeStaticParts(parts);
}

/**
 * Builds stationary inter-stage stator vane / diaphragm rings mounted in the lower/rear casing
 * so rotating blades visibly pass between fixed stator stages.
 */
function createStatorVanesGeometry(
  stages: { x: number; rInner: number; rOuter: number; vanes: number; twistRad?: number }[],
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const st of stages) {
    const outerRing = new THREE.CylinderGeometry(
      st.rOuter,
      st.rOuter,
      0.045,
      20,
      1,
      true,
      Math.PI * 0.65,
      Math.PI * 1.35,
    );
    outerRing.rotateZ(Math.PI / 2);
    outerRing.translate(st.x, 0, 0);
    parts.push(outerRing);

    const span = Math.max(0.06, st.rOuter - st.rInner);
    const midR = st.rInner + span * 0.5;
    const twist = st.twistRad ?? -0.32;

    for (let v = 0; v < st.vanes; v++) {
      const angle = Math.PI * 0.65 + (v / Math.max(1, st.vanes - 1)) * (Math.PI * 1.35);
      const vane = new THREE.BoxGeometry(0.028, span, 0.072);
      vane.rotateY(twist);
      vane.translate(0, midR, 0);
      vane.rotateX(angle);
      vane.translate(st.x, 0, 0);
      parts.push(vane);
    }
  }
  return mergeStaticParts(parts);
}

/**
 * Helper to build merged circumferential bolt heads + horizontal split-line flange bolts
 * into a single static BufferGeometry (1 draw call).
 */
function createMergedFlangeAndBolts(
  ringXPositions: { x: number; r: number }[],
  splitLength: number,
  maxRadius: number,
  qualityMode: QualityMode,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const boltCount = qualityMode === 'high' ? 12 : 8;

  const frontFlange = new THREE.BoxGeometry(splitLength, 0.08, 0.18);
  frontFlange.translate(0, 0, maxRadius * 0.92);
  parts.push(frontFlange);

  const backFlange = new THREE.BoxGeometry(splitLength, 0.08, 0.18);
  backFlange.translate(0, 0, -maxRadius * 0.92);
  parts.push(backFlange);

  const splitSteps = qualityMode === 'high' ? 8 : 5;
  for (let i = 0; i < splitSteps; i++) {
    const bx = -splitLength * 0.44 + (i / (splitSteps - 1)) * (splitLength * 0.88);
    for (const sign of [-1, 1]) {
      const b = new THREE.CylinderGeometry(0.024, 0.024, 0.13, 6);
      b.translate(bx, 0, sign * (maxRadius * 0.95));
      parts.push(b);
    }
  }

  for (const { x, r } of ringXPositions) {
    const ring = new THREE.CylinderGeometry(
      r + 0.06,
      r + 0.06,
      0.06,
      qualityMode === 'high' ? 28 : 16,
      1,
      false,
      Math.PI * 0.55,
      Math.PI * 1.45,
    );
    ring.rotateZ(Math.PI / 2);
    ring.translate(x, 0, 0);
    parts.push(ring);

    for (let i = 0; i < boltCount; i++) {
      const angle = Math.PI * 0.55 + (i / boltCount) * (Math.PI * 1.45);
      const by = Math.cos(angle) * (r + 0.03);
      const bz = Math.sin(angle) * (r + 0.03);
      const bolt = new THREE.CylinderGeometry(0.022, 0.022, 0.11, 6);
      bolt.rotateZ(Math.PI / 2);
      bolt.translate(x, by, bz);
      parts.push(bolt);
    }
  }

  return mergeStaticParts(parts);
}

/**
 * Concrete equipment foundation with steel skid baseplate and anchor bolts merged into 2 meshes.
 */
const ConcreteFoundation: React.FC<{
  width: number;
  depth: number;
  yOffset?: number;
}> = ({ width, depth, yOffset = -0.82 }) => {
  const textures = useMemo(() => getProceduralTextures(), []);
  return (
    <group position={[0, yOffset, 0]}>
      <RoundedBox args={[width, 0.34, depth]} radius={0.04} smoothness={2} receiveShadow>
        <meshStandardMaterial
          color="#334155"
          bumpMap={textures.concreteBump}
          bumpScale={0.015}
          metalness={0.08}
          roughness={0.88}
        />
      </RoundedBox>
      <RoundedBox
        args={[width * 0.92, 0.1, depth * 0.88]}
        radius={0.02}
        smoothness={2}
        position={[0, 0.21, 0]}
      >
        <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.35} />
      </RoundedBox>
    </group>
  );
};

export const ProceduralEquipment: React.FC<ProceduralEquipmentProps> = ({
  meta,
  position,
  isSelected,
  colorHex,
  label,
  cutawayLabel,
  shaftAngularSpeed,
  combustorGlow,
  hrsgTubeBanks,
  qualityMode,
  viewMode,
  cutawayOpen = true,
  speedMultiplier = 1,
  onSelect,
}) => {
  const rotorRef = useRef<THREE.Group>(null);
  const upperHoodRef = useRef<THREE.Group>(null);
  const flameCoreRef = useRef<THREE.Group>(null);
  const condensateRef = useRef<THREE.InstancedMesh>(null);
  const flamePhaseRef = useRef(0);
  const dropDummy = useMemo(() => new THREE.Object3D(), []);

  const textures = useMemo(() => getProceduralTextures(), []);
  const segs = qualityMode === 'high' ? 32 : 16;
  const isXray = viewMode === 'xray';
  const isTempMode = viewMode === 'temperature';
  const TEAL_ACCENT = '#2dd4bf';

  // Target vertical lift for the upper casing hood when cutawayOpen or selected
  const targetHoodLift = cutawayOpen || isSelected ? 0.52 : 0.0;

  const getCasingMaterialProps = (baseColor: string) => ({
    color: isXray
      ? isSelected
        ? TEAL_ACCENT
        : '#9aa3ad'
      : isTempMode
        ? colorHex
        : isSelected
          ? '#1e293b'
          : baseColor,
    roughnessMap: isXray ? undefined : textures.brushedMetalRoughness,
    emissive: isSelected ? TEAL_ACCENT : isTempMode ? colorHex : '#0a0c0f',
    emissiveIntensity: isSelected ? 0.28 : isTempMode ? 0.35 : 0.06,
    metalness: isXray ? 0.2 : 0.82,
    roughness: isXray ? 0.4 : 0.26,
    wireframe: isXray,
    side: THREE.DoubleSide,
  });

  const getUpperHoodMaterialProps = (baseColor: string) => ({
    color: isXray
      ? isSelected
        ? TEAL_ACCENT
        : '#9aa3ad'
      : isTempMode
        ? colorHex
        : isSelected
          ? TEAL_ACCENT
          : baseColor,
    roughnessMap: isXray ? undefined : textures.brushedMetalRoughness,
    emissive: isSelected ? TEAL_ACCENT : isTempMode ? colorHex : '#0a0c0f',
    emissiveIntensity: isSelected ? 0.32 : isTempMode ? 0.28 : 0.05,
    metalness: 0.78,
    roughness: 0.24,
    wireframe: isXray,
    transparent: true,
    opacity: isXray ? 0.24 : cutawayOpen || isSelected ? 0.42 : 0.88,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  useFrame((_, delta) => {
    const effectiveSpeed = shaftAngularSpeed * speedMultiplier;
    if (rotorRef.current && effectiveSpeed > 0) {
      rotorRef.current.rotation.x =
        (rotorRef.current.rotation.x + delta * effectiveSpeed) % (Math.PI * 2);
    }

    // Smooth exponential damping on the removable upper casing inspection hood
    if (upperHoodRef.current) {
      upperHoodRef.current.position.y = THREE.MathUtils.damp(
        upperHoodRef.current.position.y,
        targetHoodLift,
        6.5,
        delta,
      );
    }

    // Dynamic pulsing combustion flame core in the Combustor
    if (flameCoreRef.current && meta.id === 'combustor') {
      flamePhaseRef.current = (flamePhaseRef.current + delta * (effectiveSpeed > 0 ? 14 : 2)) % (Math.PI * 2);
      const flicker = 1 + Math.sin(flamePhaseRef.current * 2.3) * 0.08 + Math.cos(flamePhaseRef.current * 3.7) * 0.05;
      const titScale = 0.82 + combustorGlow.normalizedTit * 0.35;
      flameCoreRef.current.scale.set(flicker * titScale, flicker, flicker);
    }

    // Animated falling condensate droplets in the Surface Condenser shell
    if (condensateRef.current && meta.id === 'condenser') {
      flamePhaseRef.current = (flamePhaseRef.current + delta * (effectiveSpeed > 0 ? 1.35 * speedMultiplier : 0)) % 1;
      for (let i = 0; i < 12; i++) {
        const u = (flamePhaseRef.current + i / 12) % 1;
        const dx = -0.85 + (i % 6) * 0.34;
        const dz = (i < 6 ? 0.22 : -0.18);
        const dy = 0.35 - u * 0.72;
        const s = 0.75 + Math.sin(u * Math.PI) * 0.45;
        dropDummy.position.set(dx, dy, dz);
        dropDummy.scale.set(s, s * 1.4, s);
        dropDummy.updateMatrix();
        condensateRef.current.setMatrixAt(i, dropDummy.matrix);
      }
      condensateRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const geometries = useMemo(() => {
    // Lower solid cradle angle: covers rear + bottom + lower-front (245° arc), leaving a 115° front-top cutaway window
    const LOWER_PHI_START = Math.PI * 0.58;
    const LOWER_PHI_LEN = Math.PI * 1.42;
    // Upper removable inspection hood covering the top-front 115° arc
    const UPPER_PHI_START = 0.0;
    const UPPER_PHI_LEN = Math.PI * 0.58;

    switch (meta.id) {
      case 'compressor': {
        const profile: [number, number][] = [
          [-0.92, 0.32],
          [-0.88, 0.84],
          [-0.65, 0.82],
          [-0.45, 0.74],
          [-0.15, 0.66],
          [0.2, 0.58],
          [0.55, 0.52],
          [0.88, 0.48],
          [1.55, 0.48],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const flanges = createMergedFlangeAndBolts(
          [
            { x: -0.82, r: 0.82 },
            { x: -0.35, r: 0.71 },
            { x: 0.15, r: 0.6 },
            { x: 0.65, r: 0.51 },
            { x: 0.88, r: 0.49 },
            { x: 1.52, r: 0.5 },
          ],
          2.35,
          0.78,
          qualityMode,
        );

        // 6-stage bladed axial compressor rotor with twisted titanium airfoils
        const rotor = createMultiStageRotorGeometry([
          { x: -0.72, rHub: 0.24, rTip: 0.78, blades: 18, twistRad: 0.44 },
          { x: -0.44, rHub: 0.26, rTip: 0.71, blades: 18, twistRad: 0.4 },
          { x: -0.16, rHub: 0.28, rTip: 0.64, blades: 20, twistRad: 0.36 },
          { x: 0.12, rHub: 0.3, rTip: 0.57, blades: 20, twistRad: 0.34 },
          { x: 0.4, rHub: 0.32, rTip: 0.51, blades: 22, twistRad: 0.3 },
          { x: 0.68, rHub: 0.33, rTip: 0.46, blades: 22, twistRad: 0.28 },
        ]);

        // 5 stationary inter-stage stator vane rings
        const stators = createStatorVanesGeometry([
          { x: -0.58, rInner: 0.27, rOuter: 0.75, vanes: 14, twistRad: -0.35 },
          { x: -0.3, rInner: 0.29, rOuter: 0.68, vanes: 14, twistRad: -0.32 },
          { x: -0.02, rInner: 0.31, rOuter: 0.61, vanes: 16, twistRad: -0.3 },
          { x: 0.26, rInner: 0.32, rOuter: 0.54, vanes: 16, twistRad: -0.28 },
          { x: 0.54, rInner: 0.33, rOuter: 0.49, vanes: 18, twistRad: -0.25 },
        ]);

        // Elevated Air Intake Filter House + Weather Louvers + Support Legs + Vertical Duct + Radial Inlet Plenum
        const filterParts: THREE.BufferGeometry[] = [];
        const plenum = new THREE.BoxGeometry(0.62, 1.58, 1.78);
        plenum.translate(-0.78, 0.08, 0);
        filterParts.push(plenum);

        const vertDuct = new THREE.BoxGeometry(0.72, 1.55, 1.35);
        vertDuct.translate(-0.78, 1.48, 0);
        filterParts.push(vertDuct);

        const filterBox = new THREE.BoxGeometry(1.85, 1.15, 2.15);
        filterBox.translate(-0.95, 2.48, 0);
        filterParts.push(filterBox);

        for (let row = 0; row < 4; row++) {
          const ly = 2.1 + row * 0.24;
          const hood = new THREE.BoxGeometry(0.18, 0.12, 1.92);
          hood.rotateZ(0.35);
          hood.translate(-1.92, ly, 0);
          filterParts.push(hood);
        }

        for (const sx of [-1.75, -0.25]) {
          for (const sz of [-0.95, 0.95]) {
            const col = new THREE.BoxGeometry(0.1, 3.1, 0.1);
            col.translate(sx, 0.85, sz);
            filterParts.push(col);
          }
        }
        const filterHouseMerged = mergeStaticParts(filterParts);

        const railParts: THREE.BufferGeometry[] = [];
        const topRail = new THREE.BoxGeometry(2.15, 0.05, 2.45);
        topRail.translate(-0.95, 2.05, 0);
        railParts.push(topRail);
        const filterRailsMerged = mergeStaticParts(railParts);

        return {
          lowerCasing,
          upperHood,
          flanges,
          rotor,
          stators,
          filterHouseMerged,
          filterRailsMerged,
        };
      }

      case 'combustor': {
        const profile: [number, number][] = [
          [-0.85, 0.48],
          [-0.65, 0.68],
          [-0.25, 0.76],
          [0.25, 0.76],
          [0.65, 0.68],
          [0.85, 0.56],
          [1.55, 0.56],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );

        const canParts: THREE.BufferGeometry[] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          // Leave front-top window open so inner flame plasma is unobstructed
          if (i === 0 || i === 1) continue;
          const cy = Math.cos(a) * 0.62;
          const cz = Math.sin(a) * 0.62;
          const can = new THREE.CylinderGeometry(0.15, 0.17, 1.12, 12);
          can.rotateZ(Math.PI / 2);
          can.translate(0, cy, cz);
          canParts.push(can);
        }
        const fuelManifold = new THREE.TorusGeometry(0.78, 0.048, 10, 24);
        fuelManifold.rotateY(Math.PI / 2);
        fuelManifold.translate(-0.52, 0, 0);
        canParts.push(fuelManifold);

        // Fuel injector pigtails connecting manifold to combustion cans
        for (let i = 2; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const py = Math.cos(a) * 0.7;
          const pz = Math.sin(a) * 0.7;
          const pigtail = new THREE.CylinderGeometry(0.022, 0.022, 0.32, 6);
          pigtail.rotateZ(Math.PI / 2);
          pigtail.translate(-0.36, py, pz);
          canParts.push(pigtail);
        }

        const cansMerged = mergeStaticParts(canParts);
        return { lowerCasing, upperHood, cansMerged };
      }

      case 'gasTurbine': {
        const profile: [number, number][] = [
          [-0.88, 0.54],
          [-0.82, 0.56],
          [-0.45, 0.64],
          [-0.05, 0.74],
          [0.35, 0.84],
          [0.75, 0.94],
          [0.8, 0.88],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const flanges = createMergedFlangeAndBolts(
          [
            { x: -0.82, r: 0.56 },
            { x: -0.3, r: 0.68 },
            { x: 0.2, r: 0.8 },
            { x: 0.72, r: 0.94 },
            { x: 1.75, r: 1.12 },
            { x: 2.78, r: 1.28 },
          ],
          1.55,
          0.88,
          qualityMode,
        );
        // Axial Exhaust Diffuser with cutaway side window showing glowing exhaust gas cone
        const diffuser = createHorizontalLatheGeometry(
          [
            [0.75, 0.88],
            [1.45, 1.05],
            [2.15, 1.18],
            [2.82, 1.32],
          ],
          segs,
          Math.PI * 0.35,
          Math.PI * 1.65,
        );

        // 4-stage expanding Gas Turbine superalloy rotor
        const rotor = createMultiStageRotorGeometry([
          { x: -0.64, rHub: 0.28, rTip: 0.53, blades: 20, twistRad: -0.36 },
          { x: -0.22, rHub: 0.26, rTip: 0.63, blades: 18, twistRad: -0.4 },
          { x: 0.2, rHub: 0.24, rTip: 0.74, blades: 18, twistRad: -0.44 },
          { x: 0.62, rHub: 0.22, rTip: 0.86, blades: 16, twistRad: -0.48 },
        ]);

        // 3 stages of glowing Nozzle Guide Vanes (NGVs)
        const stators = createStatorVanesGeometry([
          { x: -0.43, rInner: 0.27, rOuter: 0.58, vanes: 14, twistRad: 0.36 },
          { x: -0.01, rInner: 0.25, rOuter: 0.68, vanes: 14, twistRad: 0.4 },
          { x: 0.41, rInner: 0.23, rOuter: 0.8, vanes: 14, twistRad: 0.44 },
        ]);

        return { lowerCasing, upperHood, flanges, diffuser, rotor, stators };
      }

      case 'hrsg': {
        // Dense finned serpentine tube bundles visible inside the HRSG cutaway bay:
        // 1) Superheater (-X gas inlet, local x = -1.05)
        // 2) Evaporator (middle bay, local x = -0.1)
        // 3) Economizer (+X stack side, local x = +0.85)
        const buildTubeBank = (xCenter: number) => {
          const tubes: THREE.BufferGeometry[] = [];
          const rows = qualityMode === 'high' ? 8 : 5;
          const depthCols = qualityMode === 'high' ? 3 : 2;
          for (let c = 0; c < depthCols; c++) {
            const tz = -0.35 + c * 0.68;
            for (let r = 0; r < rows; r++) {
              const ty = 0.05 + r * (2.25 / rows);
              const t = new THREE.CylinderGeometry(0.052, 0.052, 0.74, 8);
              t.rotateZ(Math.PI / 2);
              t.translate(xCenter, ty, tz);
              tubes.push(t);
            }
          }
          // Vertical header manifolds on both sides of the front tube bundle
          for (const hx of [xCenter - 0.36, xCenter + 0.36]) {
            const hdr = new THREE.CylinderGeometry(0.075, 0.075, 2.35, 10);
            hdr.translate(hx, 1.12, 0.92);
            tubes.push(hdr);
          }
          return mergeStaticParts(tubes);
        };
        const superheaterBank = buildTubeBank(-1.05);
        const evaporatorBank = buildTubeBank(-0.1);
        const economizerBank = buildTubeBank(0.85);

        // HRSG Casing built as an open-front architectural cutaway enclosure (rear wall + roof + floor + side frames)
        const casingParts: THREE.BufferGeometry[] = [];
        const rearWall = new THREE.BoxGeometry(3.2, 3.1, 0.16);
        rearWall.translate(0, 1.05, -0.98);
        casingParts.push(rearWall);

        const roofSlab = new THREE.BoxGeometry(3.2, 0.16, 2.1);
        roofSlab.translate(0, 2.52, 0);
        casingParts.push(roofSlab);

        const bottomSlab = new THREE.BoxGeometry(3.2, 0.18, 2.1);
        bottomSlab.translate(0, -0.42, 0);
        casingParts.push(bottomSlab);

        const leftBreechFrame = new THREE.BoxGeometry(0.16, 3.1, 2.1);
        leftBreechFrame.translate(-1.52, 1.05, 0);
        casingParts.push(leftBreechFrame);

        const rightEndWall = new THREE.BoxGeometry(0.16, 3.1, 2.1);
        rightEndWall.translate(1.52, 1.05, 0);
        casingParts.push(rightEndWall);

        const hrsgCasingMerged = mergeStaticParts(casingParts);

        // Merged structural I-beam columns + Superheater outlet nozzle + Economizer inlet header nozzle + stack
        const structParts: THREE.BufferGeometry[] = [];
        for (const cx of [-1.55, -0.55, 0.45, 1.45]) {
          for (const cz of [-1.08, 1.08]) {
            const col = new THREE.BoxGeometry(0.12, 3.3, 0.14);
            col.translate(cx, 1.15, cz);
            structParts.push(col);
          }
        }
        // Exhaust stack on the +X (economizer) end of HRSG
        const stack = new THREE.CylinderGeometry(0.42, 0.54, 1.85, segs);
        stack.translate(1.4, 3.35, 0);
        structParts.push(stack);

        // Superheater Top Outlet Header Nozzle at local [-1.05, 2.65, 0] -> world [6.55, 3.50, -0.8]
        const shNozzle = new THREE.CylinderGeometry(0.18, 0.22, 0.42, 12);
        shNozzle.translate(-1.05, 2.68, 0);
        structParts.push(shNozzle);

        // Downcomer & Riser pipes connecting Top Steam Drum to Evaporator bay
        for (const dx of [-0.45, 0.25]) {
          const dc = new THREE.CylinderGeometry(0.09, 0.09, 0.85, 10);
          dc.translate(dx, 2.65, 0.35);
          structParts.push(dc);
        }

        // Economizer Lower Feedwater Inlet Nozzle at local [0.85, 0.3, 1.05] -> world [8.45, 1.15, 0.25]
        const econNozzle = new THREE.CylinderGeometry(0.16, 0.16, 0.35, 12);
        econNozzle.rotateX(Math.PI / 2);
        econNozzle.translate(0.85, 0.3, 1.05);
        structParts.push(econNozzle);

        const walk1 = new THREE.BoxGeometry(3.3, 0.08, 0.42);
        walk1.translate(0, 1.15, 1.28);
        structParts.push(walk1);
        const walk2 = new THREE.BoxGeometry(3.3, 0.08, 0.42);
        walk2.translate(0, 2.35, 1.28);
        structParts.push(walk2);

        const structureMerged = mergeStaticParts(structParts);

        // Merged yellow safety handrails & access ladder
        const yellowParts: THREE.BufferGeometry[] = [];
        for (const wy of [1.15, 2.35]) {
          const rTop = new THREE.BoxGeometry(3.3, 0.04, 0.04);
          rTop.translate(0, wy + 0.42, 1.46);
          yellowParts.push(rTop);
          const rMid = new THREE.BoxGeometry(3.3, 0.03, 0.03);
          rMid.translate(0, wy + 0.22, 1.46);
          yellowParts.push(rMid);
        }
        for (const lx of [1.22, 1.44]) {
          const rail = new THREE.CylinderGeometry(0.022, 0.022, 3.4, 6);
          rail.translate(lx, 1.2, 1.48);
          yellowParts.push(rail);
        }
        for (let i = 0; i < 10; i++) {
          const rung = new THREE.CylinderGeometry(0.016, 0.016, 0.22, 6);
          rung.rotateZ(Math.PI / 2);
          rung.translate(1.33, -0.3 + i * 0.32, 1.48);
          yellowParts.push(rung);
        }
        const yellowMerged = mergeStaticParts(yellowParts);

        const steamDrum = createHorizontalLatheGeometry(
          [
            [-1.15, 0.12],
            [-0.95, 0.42],
            [0.65, 0.42],
            [0.85, 0.12],
          ],
          segs,
          Math.PI * 0.45,
          Math.PI * 1.55,
        );
        steamDrum.translate(0, 3.05, 0.35);

        return {
          hrsgCasingMerged,
          superheaterBank,
          evaporatorBank,
          economizerBank,
          structureMerged,
          yellowMerged,
          steamDrum,
        };
      }

      case 'steamTurbine': {
        const profile: [number, number][] = [
          [-1.08, 0.35],
          [-1.02, 0.92],
          [-0.65, 0.78],
          [-0.3, 0.92],
          [-0.1, 0.48],
          [0.15, 0.56],
          [0.85, 0.48],
          [0.92, 0.32],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const flanges = createMergedFlangeAndBolts(
          [
            { x: -0.95, r: 0.9 },
            { x: -0.35, r: 0.9 },
            { x: 0.2, r: 0.56 },
            { x: 0.8, r: 0.48 },
          ],
          1.88,
          0.86,
          qualityMode,
        );
        // 6-stage HP + Double-Flow LP bladed steam turbine rotor
        const rotor = createMultiStageRotorGeometry([
          { x: -0.94, rHub: 0.22, rTip: 0.86, blades: 20, twistRad: -0.46 },
          { x: -0.76, rHub: 0.24, rTip: 0.72, blades: 18, twistRad: -0.38 },
          { x: -0.54, rHub: 0.24, rTip: 0.72, blades: 18, twistRad: 0.38 },
          { x: -0.34, rHub: 0.22, rTip: 0.86, blades: 20, twistRad: 0.46 },
          { x: 0.28, rHub: 0.24, rTip: 0.51, blades: 22, twistRad: -0.32 },
          { x: 0.66, rHub: 0.24, rTip: 0.45, blades: 22, twistRad: -0.28 },
        ]);
        const stators = createStatorVanesGeometry([
          { x: -0.85, rInner: 0.24, rOuter: 0.8, vanes: 14, twistRad: 0.38 },
          { x: -0.44, rInner: 0.24, rOuter: 0.8, vanes: 14, twistRad: -0.38 },
          { x: 0.47, rInner: 0.25, rOuter: 0.48, vanes: 16, twistRad: 0.3 },
        ]);
        return { lowerCasing, upperHood, flanges, rotor, stators };
      }

      case 'generator': {
        const profile: [number, number][] = [
          [-1.05, 0.32],
          [-0.92, 0.76],
          [-0.75, 0.84],
          [0.75, 0.84],
          [0.92, 0.76],
          [1.05, 0.32],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const finParts: THREE.BufferGeometry[] = [];
        for (let i = -4; i <= 4; i++) {
          const fin = new THREE.CylinderGeometry(
            0.89,
            0.89,
            0.04,
            segs,
            1,
            false,
            LOWER_PHI_START,
            LOWER_PHI_LEN,
          );
          fin.rotateZ(Math.PI / 2);
          fin.translate(i * 0.17, 0, 0);
          finParts.push(fin);
        }
        const termBox = new THREE.BoxGeometry(0.75, 0.58, 0.42);
        termBox.translate(0, -0.22, 0.94);
        finParts.push(termBox);
        const finsMerged = mergeStaticParts(finParts);

        // Copper stator end-winding coils inside both ends of the generator frame
        const coilParts: THREE.BufferGeometry[] = [];
        for (const cx of [-0.72, 0.72]) {
          const torus = new THREE.TorusGeometry(0.58, 0.09, 10, 24);
          torus.rotateY(Math.PI / 2);
          torus.translate(cx, 0, 0);
          coilParts.push(torus);
        }
        const statorCoils = mergeStaticParts(coilParts);

        // Synchronous copper-pole generator rotor
        const rotor = createMultiStageRotorGeometry([
          { x: -0.58, rHub: 0.32, rTip: 0.66, blades: 8, twistRad: 0 },
          { x: 0, rHub: 0.36, rTip: 0.68, blades: 8, twistRad: 0 },
          { x: 0.58, rHub: 0.32, rTip: 0.66, blades: 8, twistRad: 0 },
        ]);

        return { lowerCasing, upperHood, finsMerged, statorCoils, rotor };
      }

      case 'condenser': {
        const profile: [number, number][] = [
          [-1.35, 0.15],
          [-1.15, 0.68],
          [-0.95, 0.74],
          [0.95, 0.74],
          [1.15, 0.68],
          [1.35, 0.15],
        ];
        const lowerCasing = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const upperHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const ribParts: THREE.BufferGeometry[] = [];
        for (const rx of [-0.95, -0.45, 0, 0.45, 0.95]) {
          const rib = new THREE.CylinderGeometry(
            0.78,
            0.78,
            0.05,
            segs,
            1,
            false,
            LOWER_PHI_START,
            LOWER_PHI_LEN,
          );
          rib.rotateZ(Math.PI / 2);
          rib.translate(rx, 0, 0);
          ribParts.push(rib);
        }
        // Top steam exhaust transition dome at local x = -0.65 -> world x = -9.25 (matching LP exhaust crossover)
        const dome = new THREE.CylinderGeometry(0.32, 0.48, 0.52, 16);
        dome.translate(-0.65, 0.68, 0);
        ribParts.push(dome);

        // Hotwell suction flange at local x = +1.25 -> world [-7.35, 0.35, 2.5]
        const hotwellNozzle = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 12);
        hotwellNozzle.rotateZ(Math.PI / 2);
        hotwellNozzle.translate(1.25, 0, 0);
        ribParts.push(hotwellNozzle);

        const ribsMerged = mergeStaticParts(ribParts);

        // Internal brass/titanium cooling water tube bundle inside the condenser shell
        const tubeParts: THREE.BufferGeometry[] = [];
        for (let row = -2; row <= 1; row++) {
          for (let col = -2; col <= 2; col++) {
            const ty = row * 0.15 - 0.05;
            const tz = col * 0.15;
            if (ty * ty + tz * tz > 0.34) continue;
            const cTube = new THREE.CylinderGeometry(0.032, 0.032, 1.85, 8);
            cTube.rotateZ(Math.PI / 2);
            cTube.translate(0, ty, tz);
            tubeParts.push(cTube);
          }
        }
        const tubeBundle = mergeStaticParts(tubeParts);

        return { lowerCasing, upperHood, ribsMerged, tubeBundle };
      }

      case 'pump': {
        const profile: [number, number][] = [
          [-0.68, 0.2],
          [-0.55, 0.38],
          [-0.12, 0.38],
          [-0.05, 0.14],
        ];
        const pumpBody = createHorizontalLatheGeometry(
          profile,
          segs,
          LOWER_PHI_START,
          LOWER_PHI_LEN,
        );
        const pumpHood = createHorizontalLatheGeometry(
          profile,
          segs,
          UPPER_PHI_START,
          UPPER_PHI_LEN,
        );
        const motorBody = createHorizontalLatheGeometry(
          [
            [0.12, 0.16],
            [0.18, 0.32],
            [0.68, 0.32],
            [0.75, 0.18],
          ],
          segs,
        );
        const rotor = createMultiStageRotorGeometry([
          { x: -0.44, rHub: 0.1, rTip: 0.32, blades: 12, twistRad: 0.38 },
          { x: -0.24, rHub: 0.1, rTip: 0.32, blades: 12, twistRad: 0.38 },
        ]);
        return { pumpBody, pumpHood, motorBody, rotor };
      }
    }
  }, [meta.id, segs, qualityMode]);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      });
    };
  }, [geometries]);

  const renderIndustrialAsset = () => {
    switch (meta.id) {
      case 'compressor': {
        return (
          <group>
            <ConcreteFoundation width={2.45} depth={2.15} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial {...getCasingMaterialProps('#334155')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#475569')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial
                color={isSelected ? TEAL_ACCENT : '#94a3b8'}
                metalness={0.85}
                roughness={0.24}
                wireframe={isXray}
              />
            </mesh>
            {/* Stationary Inter-Stage Stator Vanes */}
            <mesh geometry={geometries.stators}>
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.78}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Elevated Air Intake Filter House & Radial Inlet Plenum */}
            <mesh castShadow receiveShadow geometry={geometries.filterHouseMerged}>
              <meshStandardMaterial
                color="#475569"
                metalness={0.58}
                roughness={0.4}
                wireframe={isXray}
              />
            </mesh>
            <mesh geometry={geometries.filterRailsMerged}>
              <meshStandardMaterial color="#eab308" metalness={0.4} roughness={0.35} />
            </mesh>
            {/* Spinning 6-Stage Axial Compressor Bladed Rotor */}
            <group ref={rotorRef}>
              <mesh geometry={geometries.rotor}>
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={0.35}
                  metalness={0.9}
                  roughness={0.16}
                />
              </mesh>
            </group>
          </group>
        );
      }

      case 'combustor': {
        return (
          <group>
            <ConcreteFoundation width={1.95} depth={1.85} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial
                color={isSelected ? '#1e293b' : isTempMode ? colorHex : '#78350f'}
                roughnessMap={isXray ? undefined : textures.brushedMetalRoughness}
                emissive={isSelected ? TEAL_ACCENT : combustorGlow.emissiveColorHex}
                emissiveIntensity={isSelected ? 0.3 : combustorGlow.emissiveIntensity * 0.38}
                metalness={0.72}
                roughness={0.32}
                wireframe={isXray}
                side={THREE.DoubleSide}
              />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#92400e')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.cansMerged}>
              <meshStandardMaterial
                color="#b45309"
                emissive={combustorGlow.emissiveColorHex}
                emissiveIntensity={combustorGlow.emissiveIntensity * 0.65}
                metalness={0.68}
                roughness={0.28}
                wireframe={isXray}
              />
            </mesh>
            {/* Animated Multi-Layer Plasma / Flame Core inside Cutaway Window */}
            <group ref={flameCoreRef} position={[0, 0.18, 0.18]}>
              <mesh rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.32, 1.15, 18]} />
                <meshBasicMaterial
                  color={combustorGlow.emissiveColorHex}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.1, 0, 0]}>
                <coneGeometry args={[0.18, 0.82, 14]} />
                <meshBasicMaterial color="#fef08a" />
              </mesh>
            </group>
            {isSelected && (
              <Html position={[0, 1.25, 0.55]} center>
                <span className="cutaway-badge">{cutawayLabel}</span>
              </Html>
            )}
            <pointLight
              position={[0, 0.42, 0.42]}
              color={combustorGlow.emissiveColorHex}
              intensity={combustorGlow.pointLightIntensity}
              distance={6.0}
              decay={2}
            />
          </group>
        );
      }

      case 'gasTurbine': {
        return (
          <group>
            <ConcreteFoundation width={4.2} depth={2.2} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial {...getCasingMaterialProps('#475569')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#64748b')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial
                color={isSelected ? TEAL_ACCENT : '#cbd5e1'}
                metalness={0.86}
                roughness={0.22}
                wireframe={isXray}
              />
            </mesh>
            {/* Stationary Glowing Nozzle Guide Vane (NGV) Rings */}
            <mesh geometry={geometries.stators}>
              <meshStandardMaterial
                color="#fdba74"
                emissive="#ea580c"
                emissiveIntensity={0.28}
                metalness={0.75}
                roughness={0.28}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Continuous Axial Exhaust Diffuser & Transition Hood bolted to HRSG */}
            <mesh castShadow receiveShadow geometry={geometries.diffuser}>
              <meshStandardMaterial
                color="#334155"
                roughnessMap={isXray ? undefined : textures.brushedMetalRoughness}
                metalness={0.76}
                roughness={0.32}
                wireframe={isXray}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Spinning 4-Stage Bladed Gas Turbine Rotor */}
            <group ref={rotorRef}>
              <mesh geometry={geometries.rotor}>
                <meshStandardMaterial
                  color="#fb923c"
                  emissive="#ea580c"
                  emissiveIntensity={0.45}
                  metalness={0.88}
                  roughness={0.18}
                />
              </mesh>
            </group>
          </group>
        );
      }

      case 'hrsg': {
        return (
          <group>
            <ConcreteFoundation width={3.8} depth={2.9} />
            {/* Open-front cutaway structural boiler enclosure revealing all 3 tube banks */}
            <mesh castShadow receiveShadow geometry={geometries.hrsgCasingMerged}>
              <meshStandardMaterial
                color={isSelected ? '#134e4a' : isTempMode ? colorHex : '#1e293b'}
                emissive={isSelected ? TEAL_ACCENT : isTempMode ? colorHex : '#0f172a'}
                emissiveIntensity={isSelected ? 0.24 : isTempMode ? 0.25 : 0.06}
                metalness={0.58}
                roughness={0.44}
                wireframe={isXray}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Exposed HRSG Finned Serpentine Tube Banks in Gas Flow Order:
                1) Superheater (-X hottest) -> 2) Evaporator (middle) -> 3) Economizer (+X coolest) */}
            <mesh geometry={geometries.superheaterBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.superheaterColorHex}
                emissive={hrsgTubeBanks.superheaterColorHex}
                emissiveIntensity={hrsgTubeBanks.superheaterGlow}
                metalness={0.62}
                roughness={0.28}
              />
            </mesh>
            <mesh geometry={geometries.evaporatorBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.evaporatorColorHex}
                emissive={hrsgTubeBanks.evaporatorColorHex}
                emissiveIntensity={hrsgTubeBanks.evaporatorGlow}
                metalness={0.62}
                roughness={0.28}
              />
            </mesh>
            <mesh geometry={geometries.economizerBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.economizerColorHex}
                emissive={hrsgTubeBanks.economizerColorHex}
                emissiveIntensity={hrsgTubeBanks.economizerGlow}
                metalness={0.62}
                roughness={0.28}
              />
            </mesh>

            {/* Top Steam Drum with cutaway water-level sight glass */}
            <mesh castShadow receiveShadow geometry={geometries.steamDrum}>
              <meshStandardMaterial
                color="#cbd5e1"
                roughnessMap={isXray ? undefined : textures.brushedMetalRoughness}
                metalness={0.82}
                roughness={0.24}
                wireframe={isXray}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Internal Saturated Water Level inside Steam Drum Cutaway */}
            <mesh position={[-0.15, 2.98, 0.38]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.34, 0.34, 1.52, 16, 1, false, Math.PI * 0.5, Math.PI]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            <mesh position={[-0.15, 3.12, 0.38]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.32, 0.32, 1.48, 16, 1, false, -Math.PI * 0.5, Math.PI]} />
              <meshBasicMaterial color="#e0f2fe" transparent opacity={0.55} />
            </mesh>

            <mesh castShadow receiveShadow geometry={geometries.structureMerged}>
              <meshStandardMaterial
                color="#475569"
                metalness={0.68}
                roughness={0.38}
                wireframe={isXray}
              />
            </mesh>

            <mesh castShadow geometry={geometries.yellowMerged}>
              <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
            </mesh>
          </group>
        );
      }

      case 'steamTurbine': {
        return (
          <group>
            <ConcreteFoundation width={2.45} depth={2.05} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial {...getCasingMaterialProps('#0369a1')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#0284c7')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial
                color={isSelected ? TEAL_ACCENT : '#bae6fd'}
                metalness={0.84}
                roughness={0.24}
                wireframe={isXray}
              />
            </mesh>
            <mesh geometry={geometries.stators}>
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.8}
                roughness={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* HP Steam Admission Chest (local x=+0.65) & LP Exhaust Hood Nozzle (local x=-0.65) */}
            <mesh castShadow position={[0.65, 0.52, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.25, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh castShadow position={[-0.65, 0.62, 0]}>
              <cylinderGeometry args={[0.22, 0.26, 0.28, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Overhead HP-to-LP crossover pipe */}
            <mesh castShadow position={[-0.1, 0.92, -0.25]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 1.05, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Spinning 6-Stage HP + Double-Flow LP Bladed Steam Rotor */}
            <group ref={rotorRef}>
              <mesh geometry={geometries.rotor}>
                <meshStandardMaterial
                  color={TEAL_ACCENT}
                  emissive="#0d9488"
                  emissiveIntensity={0.34}
                  metalness={0.9}
                  roughness={0.16}
                />
              </mesh>
            </group>
          </group>
        );
      }

      case 'generator': {
        return (
          <group>
            <ConcreteFoundation width={2.35} depth={2.05} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial {...getCasingMaterialProps('#1e3a8a')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#1d4ed8')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.finsMerged}>
              <meshStandardMaterial
                color={isSelected ? TEAL_ACCENT : '#3b82f6'}
                metalness={0.68}
                roughness={0.34}
                wireframe={isXray}
              />
            </mesh>
            {/* Stationary Copper Stator End-Winding Coils */}
            <mesh geometry={geometries.statorCoils}>
              <meshStandardMaterial
                color="#d97706"
                emissive="#92400e"
                emissiveIntensity={0.25}
                metalness={0.85}
                roughness={0.22}
              />
            </mesh>
            <group ref={rotorRef}>
              <mesh geometry={geometries.rotor}>
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#b45309"
                  emissiveIntensity={0.32}
                  metalness={0.88}
                  roughness={0.2}
                />
              </mesh>
            </group>
          </group>
        );
      }

      case 'condenser': {
        return (
          <group>
            <ConcreteFoundation width={2.85} depth={1.85} yOffset={-0.42} />
            <mesh castShadow receiveShadow geometry={geometries.lowerCasing}>
              <meshStandardMaterial {...getCasingMaterialProps('#0f766e')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.upperHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#115e59')} />
              </mesh>
            </group>
            <mesh castShadow geometry={geometries.ribsMerged}>
              <meshStandardMaterial
                color="#134e4a"
                metalness={0.72}
                roughness={0.3}
                wireframe={isXray}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Internal Cooling Water Tube Bundle */}
            <mesh geometry={geometries.tubeBundle}>
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={0.25}
                metalness={0.82}
                roughness={0.22}
              />
            </mesh>
            {/* Animated Falling Condensate Water Droplets into Hotwell */}
            <instancedMesh
              ref={condensateRef}
              args={[undefined, undefined, 12]}
              frustumCulled={false}
            >
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#7dd3fc" />
            </instancedMesh>
          </group>
        );
      }

      case 'pump': {
        return (
          <group>
            <ConcreteFoundation width={1.85} depth={1.25} yOffset={-0.42} />
            <mesh castShadow receiveShadow geometry={geometries.pumpBody}>
              <meshStandardMaterial {...getCasingMaterialProps('#1d4ed8')} />
            </mesh>
            <group ref={upperHoodRef}>
              <mesh geometry={geometries.pumpHood} renderOrder={2}>
                <meshStandardMaterial {...getUpperHoodMaterialProps('#2563eb')} />
              </mesh>
            </group>
            {/* Vertical Top Discharge Nozzle at local x=-0.35 (world x=-2.55, y=0.72) mating with Feedwater Pipe */}
            <mesh castShadow position={[-0.35, 0.36, 0]}>
              <cylinderGeometry args={[0.14, 0.16, 0.25, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.82} roughness={0.24} />
            </mesh>
            <mesh castShadow receiveShadow geometry={geometries.motorBody}>
              <meshStandardMaterial
                color="#334155"
                metalness={0.68}
                roughness={0.32}
                wireframe={isXray}
              />
            </mesh>
            <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.22, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>
            <group ref={rotorRef}>
              <mesh geometry={geometries.rotor}>
                <meshStandardMaterial
                  color={TEAL_ACCENT}
                  emissive="#0d9488"
                  emissiveIntensity={0.28}
                  metalness={0.88}
                  roughness={0.18}
                />
              </mesh>
            </group>
          </group>
        );
      }
    }
  };

  // Carefully staggered 3D callout heights/offsets so zero labels overlap in overview camera
  const tagOffsetMap: Record<ComponentMeta['id'], [number, number, number]> = {
    steamTurbine: [-0.2, 2.25, 0],
    generator: [0, 1.75, 0],
    compressor: [-0.95, 3.95, 0],
    combustor: [0, 2.35, 0],
    gasTurbine: [0.3, 1.85, 0],
    hrsg: [0.1, 4.35, 0],
    condenser: [0, 1.45, 0.55],
    pump: [0.1, 1.32, 0.45],
  };

  const tagOffset = tagOffsetMap[meta.id];

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {renderIndustrialAsset()}
      {isSelected && (
        <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 1.48, 32]} />
          <meshBasicMaterial color={TEAL_ACCENT} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={tagOffset} center>
        <button
          type="button"
          className={`scene-tag ${isSelected ? 'scene-tag-active' : ''}`}
          onClick={onSelect}
        >
          <span className="scene-tag-dot" />
          {label}
        </button>
      </Html>
    </group>
  );
};

/**
 * Merged Industrial Site Scenery & Ground Environment:
 * - Hyperbolic Cooling Tower connected to Condenser with green circulating water lines
 * - Step-Up Transformer with radiator fins + HV Lattice Transmission Pylon near Generator
 * - Overhead Pipe Rack H-frames supporting the Main Steam Line at y = 4.15, z = -2.35
 * - Yellow Fuel Gas Supply Line feeding Combustor
 * All static parts merged by material into only 4 draw calls!
 */
export const OptionalPlantScenery: React.FC = () => {
  const mergedScenery = useMemo(() => {
    const concreteParts: THREE.BufferGeometry[] = [];
    const steelParts: THREE.BufferGeometry[] = [];
    const greenPipeParts: THREE.BufferGeometry[] = [];
    const yellowPipeParts: THREE.BufferGeometry[] = [];

    // 1. Hyperbolic Cooling Tower at [-12.2, 0, 2.5] (connected to Condenser at [-8.6, 0.35, 2.5])
    const basin = new THREE.CylinderGeometry(1.75, 1.85, 0.38, 24);
    basin.translate(-12.2, -0.1, 2.5);
    concreteParts.push(basin);

    const lowerShell = new THREE.CylinderGeometry(1.02, 1.62, 2.2, 24);
    lowerShell.translate(-12.2, 1.15, 2.5);
    concreteParts.push(lowerShell);

    const upperShell = new THREE.CylinderGeometry(1.18, 1.02, 1.0, 24);
    upperShell.translate(-12.2, 2.65, 2.5);
    concreteParts.push(upperShell);

    // Green cooling water supply & return pipes between Condenser (-8.6) and Cooling Tower (-12.2)
    for (const pz of [2.25, 2.75]) {
      const cwPipe = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 10);
      cwPipe.rotateZ(Math.PI / 2);
      cwPipe.translate(-10.4, 0.25, pz);
      greenPipeParts.push(cwPipe);
    }

    // 2. Step-Up Transformer & HV Lattice Transmission Tower at [-5.2, 0, -4.2] (behind Generator)
    const transPad = new THREE.BoxGeometry(1.6, 0.2, 1.4);
    transPad.translate(-5.2, -0.18, -3.6);
    concreteParts.push(transPad);

    const transTank = new THREE.BoxGeometry(1.15, 1.15, 0.92);
    transTank.translate(-5.2, 0.45, -3.6);
    steelParts.push(transTank);

    for (const bx of [-5.5, -5.2, -4.9]) {
      const bush = new THREE.CylinderGeometry(0.05, 0.07, 0.45, 8);
      bush.translate(bx, 1.22, -3.6);
      steelParts.push(bush);
    }

    const pylonBody = new THREE.CylinderGeometry(0.22, 0.75, 4.6, 4);
    pylonBody.translate(-5.2, 2.0, -5.6);
    steelParts.push(pylonBody);

    const arm1 = new THREE.BoxGeometry(2.4, 0.14, 0.14);
    arm1.translate(-5.2, 3.1, -5.6);
    steelParts.push(arm1);

    const arm2 = new THREE.BoxGeometry(1.8, 0.12, 0.12);
    arm2.translate(-5.2, 3.9, -5.6);
    steelParts.push(arm2);

    // Overhead Pipe Rack H-frames supporting the Main Steam Line along y = 4.15, z = -2.35
    for (const rx of [-6.5, -2.5, 1.5, 5.5]) {
      const postL = new THREE.BoxGeometry(0.1, 4.35, 0.1);
      postL.translate(rx, 1.9, -2.55);
      steelParts.push(postL);
      const postR = new THREE.BoxGeometry(0.1, 4.35, 0.1);
      postR.translate(rx, 1.9, -2.15);
      steelParts.push(postR);
      const beam = new THREE.BoxGeometry(0.12, 0.12, 0.65);
      beam.translate(rx, 4.02, -2.35);
      steelParts.push(beam);
    }

    // Perimeter fence posts along the rear boundary (z = -6.8)
    for (let fx = -13; fx <= 11; fx += 3) {
      const fPost = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6);
      fPost.translate(fx, 0.3, -6.8);
      steelParts.push(fPost);
    }
    const fRail = new THREE.BoxGeometry(24, 0.04, 0.04);
    fRail.translate(-1, 0.82, -6.8);
    steelParts.push(fRail);

    // 3. Yellow Fuel Gas Supply Line feeding Combustor (x = 0.28)
    const fuelVert = new THREE.CylinderGeometry(0.055, 0.055, 1.4, 10);
    fuelVert.translate(0.28, 0.65, -2.1);
    yellowPipeParts.push(fuelVert);

    const fuelHoriz = new THREE.CylinderGeometry(0.055, 0.055, 1.3, 10);
    fuelHoriz.rotateX(Math.PI / 2);
    fuelHoriz.translate(0.28, 1.32, -1.45);
    yellowPipeParts.push(fuelHoriz);

    return {
      concrete: mergeStaticParts(concreteParts),
      steel: mergeStaticParts(steelParts),
      greenPipes: mergeStaticParts(greenPipeParts),
      yellowPipes: mergeStaticParts(yellowPipeParts),
    };
  }, []);

  useEffect(() => {
    return () => {
      mergedScenery.concrete.dispose();
      mergedScenery.steel.dispose();
      mergedScenery.greenPipes.dispose();
      mergedScenery.yellowPipes.dispose();
    };
  }, [mergedScenery]);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={mergedScenery.concrete}>
        <meshStandardMaterial color="#64748b" metalness={0.12} roughness={0.84} />
      </mesh>
      <mesh castShadow receiveShadow geometry={mergedScenery.steel}>
        <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh castShadow geometry={mergedScenery.greenPipes}>
        <meshStandardMaterial color="#16a34a" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh castShadow geometry={mergedScenery.yellowPipes}>
        <meshStandardMaterial color="#eab308" metalness={0.58} roughness={0.32} />
      </mesh>
    </group>
  );
};

