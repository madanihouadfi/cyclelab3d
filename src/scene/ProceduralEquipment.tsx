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
  onSelect: () => void;
}

/**
 * Helper to create a revolved LatheGeometry aligned along the horizontal X-axis
 * from an array of [xOffset, radius] profile points.
 */
function createHorizontalLatheGeometry(
  profileXR: [number, number][],
  radialSegments: number,
): THREE.BufferGeometry {
  const pts = profileXR.map(([x, r]) => new THREE.Vector2(r, x));
  const geom = new THREE.LatheGeometry(pts, radialSegments);
  geom.rotateZ(-Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Helper to build merged circumferential bolt heads + horizontal split-line flange bolts
 * into a single static BufferGeometry (1 draw call instead of dozens).
 */
function createMergedFlangeAndBolts(
  ringXPositions: { x: number; r: number }[],
  splitLength: number,
  maxRadius: number,
  qualityMode: QualityMode,
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const boltCount = qualityMode === 'high' ? 12 : 8;

  // Horizontal split-line flange ledges on +Z and -Z sides
  const frontFlange = new THREE.BoxGeometry(splitLength, 0.08, 0.18);
  frontFlange.translate(0, 0, maxRadius * 0.92);
  parts.push(frontFlange);

  const backFlange = new THREE.BoxGeometry(splitLength, 0.08, 0.18);
  backFlange.translate(0, 0, -maxRadius * 0.92);
  parts.push(backFlange);

  // Split-line vertical bolts along front and back horizontal flanges
  const splitSteps = qualityMode === 'high' ? 8 : 5;
  for (let i = 0; i < splitSteps; i++) {
    const bx = -splitLength * 0.44 + (i / (splitSteps - 1)) * (splitLength * 0.88);
    for (const sign of [-1, 1]) {
      const b = new THREE.CylinderGeometry(0.024, 0.024, 0.13, 6);
      b.translate(bx, 0, sign * (maxRadius * 0.95));
      parts.push(b);
    }
  }

  // Circumferential stage flange rings & axial hex bolts
  for (const { x, r } of ringXPositions) {
    const ring = new THREE.CylinderGeometry(r + 0.06, r + 0.06, 0.06, qualityMode === 'high' ? 28 : 16);
    ring.rotateZ(Math.PI / 2);
    ring.translate(x, 0, 0);
    parts.push(ring);

    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
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
  onSelect,
}) => {
  const rotorRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => getProceduralTextures(), []);
  const segs = qualityMode === 'high' ? 32 : 16;

  useFrame((_, delta) => {
    if (rotorRef.current && shaftAngularSpeed > 0) {
      rotorRef.current.rotation.x =
        (rotorRef.current.rotation.x + delta * shaftAngularSpeed) % (Math.PI * 2);
    }
  });

  // Pre-build component-specific LatheGeometries and merged static detail meshes
  const geometries = useMemo(() => {
    switch (meta.id) {
      case 'compressor': {
        // Converging 16-stage axial compressor barrel from cold end (x=-0.85, r=0.82) to hot HP end (x=+0.85, r=0.48)
        const casing = createHorizontalLatheGeometry(
          [
            [-0.92, 0.32],
            [-0.88, 0.84],
            [-0.65, 0.82],
            [-0.45, 0.74],
            [-0.15, 0.66],
            [0.2, 0.58],
            [0.55, 0.52],
            [0.88, 0.48],
            [0.92, 0.32],
          ],
          segs,
        );
        const flanges = createMergedFlangeAndBolts(
          [
            { x: -0.82, r: 0.82 },
            { x: -0.35, r: 0.71 },
            { x: 0.15, r: 0.6 },
            { x: 0.65, r: 0.51 },
            { x: 0.86, r: 0.49 },
          ],
          1.72,
          0.78,
          qualityMode,
        );

        // Elevated Air Intake Filter House + Weather Louvers + Support Legs + Vertical Duct + Radial Inlet Plenum
        const filterParts: THREE.BufferGeometry[] = [];
        // Radial inlet plenum straddling the cold end of the compressor (allowing shaft to pass through)
        const plenum = new THREE.BoxGeometry(0.58, 1.55, 1.78);
        plenum.translate(-0.78, 0.08, 0);
        filterParts.push(plenum);

        // Vertical rectangular intake silencer duct rising from radial plenum to elevated filter house
        const vertDuct = new THREE.BoxGeometry(0.68, 1.45, 1.35);
        vertDuct.translate(-0.78, 1.45, 0);
        filterParts.push(vertDuct);

        // Elevated Filter House main enclosure at y = 2.45
        const filterBox = new THREE.BoxGeometry(1.85, 1.15, 2.15);
        filterBox.translate(-0.95, 2.48, 0);
        filterParts.push(filterBox);

        // Weather louver hoods on -X and +/-Z faces of filter house
        for (let row = 0; row < 4; row++) {
          const ly = 2.1 + row * 0.24;
          const hood = new THREE.BoxGeometry(0.18, 0.12, 1.92);
          hood.rotateZ(0.35);
          hood.translate(-1.92, ly, 0);
          filterParts.push(hood);
        }

        // 4 structural steel support columns for the elevated filter house
        for (const sx of [-1.75, -0.25]) {
          for (const sz of [-0.95, 0.95]) {
            const col = new THREE.BoxGeometry(0.1, 3.1, 0.1);
            col.translate(sx, 0.85, sz);
            filterParts.push(col);
          }
        }
        const filterHouseMerged = mergeStaticParts(filterParts);

        // Yellow handrail around elevated filter house service walkway
        const railParts: THREE.BufferGeometry[] = [];
        const topRail = new THREE.BoxGeometry(2.15, 0.05, 2.45);
        topRail.translate(-0.95, 2.05, 0);
        railParts.push(topRail);
        const filterRailsMerged = mergeStaticParts(railParts);

        return { casing, flanges, filterHouseMerged, filterRailsMerged };
      }

      case 'combustor': {
        // Bulging annular/can-annular combustion section casing
        const casing = createHorizontalLatheGeometry(
          [
            [-0.85, 0.48],
            [-0.65, 0.68],
            [-0.25, 0.76],
            [0.25, 0.76],
            [0.65, 0.68],
            [0.85, 0.54],
          ],
          segs,
        );
        // Merge 8 slanted can-annular combustion chambers + fuel nozzle pigtails
        const canParts: THREE.BufferGeometry[] = [];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          // Leave top-front window open for educational cutaway view
          if (i === 1) continue;
          const cy = Math.cos(a) * 0.68;
          const cz = Math.sin(a) * 0.68;
          const can = new THREE.CylinderGeometry(0.16, 0.18, 1.15, 12);
          can.rotateZ(Math.PI / 2);
          can.translate(0, cy, cz);
          canParts.push(can);
        }
        const fuelManifold = new THREE.TorusGeometry(0.78, 0.045, 10, 24);
        fuelManifold.rotateY(Math.PI / 2);
        fuelManifold.translate(-0.52, 0, 0);
        canParts.push(fuelManifold);

        const cansMerged = mergeStaticParts(canParts);
        return { casing, cansMerged };
      }

      case 'gasTurbine': {
        // Expanding 4-stage heavy-duty gas turbine barrel (x=-0.85 r=0.54 -> x=+0.75 r=0.92)
        const casing = createHorizontalLatheGeometry(
          [
            [-0.88, 0.42],
            [-0.82, 0.56],
            [-0.45, 0.64],
            [-0.05, 0.74],
            [0.35, 0.84],
            [0.75, 0.94],
            [0.8, 0.45],
          ],
          segs,
        );
        const flanges = createMergedFlangeAndBolts(
          [
            { x: -0.78, r: 0.56 },
            { x: -0.3, r: 0.68 },
            { x: 0.2, r: 0.8 },
            { x: 0.72, r: 0.94 },
          ],
          1.55,
          0.88,
          qualityMode,
        );
        // Axial Exhaust Diffuser & Breeching Cone extending from x=+0.75 to x=+2.85 (into HRSG)
        const diffuser = createHorizontalLatheGeometry(
          [
            [0.75, 0.88],
            [1.35, 1.02],
            [2.15, 1.18],
            [2.85, 1.28],
            [2.88, 0.5],
          ],
          segs,
        );
        return { casing, flanges, diffuser };
      }

      case 'hrsg': {
        // Build 3 separate tube-bank geometries in gas flow order:
        // 1) Superheater (-X gas inlet, local x = -1.05)
        // 2) Evaporator (middle bay, local x = -0.1)
        // 3) Economizer (+X stack side, local x = +0.85)
        const buildTubeBank = (xCenter: number) => {
          const tubes: THREE.BufferGeometry[] = [];
          const rows = qualityMode === 'high' ? 6 : 4;
          for (let r = 0; r < rows; r++) {
            const ty = 0.25 + r * (2.1 / rows);
            const t = new THREE.CylinderGeometry(0.055, 0.055, 0.72, 8);
            t.rotateZ(Math.PI / 2);
            t.translate(xCenter, ty, 1.06);
            tubes.push(t);
          }
          return mergeStaticParts(tubes);
        };
        const superheaterBank = buildTubeBank(-1.05);
        const evaporatorBank = buildTubeBank(-0.1);
        const economizerBank = buildTubeBank(0.85);

        // Merged structural I-beam columns + inlet transition hood + top steam drum + cylindrical stack
        const structParts: THREE.BufferGeometry[] = [];
        for (const cx of [-1.55, -0.55, 0.45, 1.45]) {
          for (const cz of [-1.08, 1.08]) {
            const col = new THREE.BoxGeometry(0.12, 3.3, 0.14);
            col.translate(cx, 1.15, cz);
            structParts.push(col);
          }
        }
        // Exhaust stack on the +X (economizer) end of HRSG
        const stack = new THREE.CylinderGeometry(0.42, 0.54, 1.65, segs);
        stack.translate(1.4, 3.25, 0);
        structParts.push(stack);

        // Walkways (2 tiers)
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
        // Vertical ladder rails
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

        // Top Steam Drum (above Evaporator section)
        const steamDrum = createHorizontalLatheGeometry(
          [
            [-1.15, 0.12],
            [-0.95, 0.42],
            [0.65, 0.42],
            [0.85, 0.12],
          ],
          segs,
        );
        steamDrum.translate(0, 3.05, 0.35);

        return {
          superheaterBank,
          evaporatorBank,
          economizerBank,
          structureMerged,
          yellowMerged,
          steamDrum,
        };
      }

      case 'steamTurbine': {
        // Contoured HP barrel (right) + symmetrical Double-Flow LP casing (left)
        const casing = createHorizontalLatheGeometry(
          [
            [-1.08, 0.35],
            [-1.02, 0.92],
            [-0.65, 0.78],
            [-0.3, 0.92],
            [-0.1, 0.48],
            [0.15, 0.56],
            [0.85, 0.48],
            [0.92, 0.32],
          ],
          segs,
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
        return { casing, flanges };
      }

      case 'generator': {
        // Contoured cylindrical stator housing with dished end shields
        const casing = createHorizontalLatheGeometry(
          [
            [-1.05, 0.32],
            [-0.92, 0.76],
            [-0.75, 0.84],
            [0.75, 0.84],
            [0.92, 0.76],
            [1.05, 0.32],
          ],
          segs,
        );
        // Merged cooling fins + HV terminal box
        const finParts: THREE.BufferGeometry[] = [];
        for (let i = -4; i <= 4; i++) {
          const fin = new THREE.CylinderGeometry(0.89, 0.89, 0.04, segs);
          fin.rotateZ(Math.PI / 2);
          fin.translate(i * 0.17, 0, 0);
          finParts.push(fin);
        }
        const termBox = new THREE.BoxGeometry(0.75, 0.58, 0.42);
        termBox.translate(0, 0.28, 0.94);
        finParts.push(termBox);
        const finsMerged = mergeStaticParts(finParts);
        return { casing, finsMerged };
      }

      case 'condenser': {
        // Revolved shell-and-tube surface condenser with hemispherical waterboxes
        const casing = createHorizontalLatheGeometry(
          [
            [-1.35, 0.15],
            [-1.15, 0.68],
            [-0.95, 0.74],
            [0.95, 0.74],
            [1.15, 0.68],
            [1.35, 0.15],
          ],
          segs,
        );
        const ribParts: THREE.BufferGeometry[] = [];
        for (const rx of [-0.95, -0.45, 0, 0.45, 0.95]) {
          const rib = new THREE.CylinderGeometry(0.78, 0.78, 0.05, segs);
          rib.rotateZ(Math.PI / 2);
          rib.translate(rx, 0, 0);
          ribParts.push(rib);
        }
        // Top steam exhaust transition dome
        const dome = new THREE.CylinderGeometry(0.32, 0.46, 0.45, 16);
        dome.translate(0, 0.76, 0);
        ribParts.push(dome);
        const ribsMerged = mergeStaticParts(ribParts);
        return { casing, ribsMerged };
      }

      case 'pump': {
        // Revolved multi-stage barrel pump + finned drive motor
        const pumpBody = createHorizontalLatheGeometry(
          [
            [-0.65, 0.18],
            [-0.55, 0.36],
            [-0.12, 0.36],
            [-0.05, 0.14],
          ],
          segs,
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
        return { pumpBody, motorBody };
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
            <ConcreteFoundation width={2.35} depth={2.15} />
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#475569"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.38 : 0.08}
                metalness={0.82}
                roughness={0.28}
              />
            </mesh>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.24} />
            </mesh>
            {/* Elevated Air Intake Filter House & Radial Inlet Plenum */}
            <mesh castShadow receiveShadow geometry={geometries.filterHouseMerged}>
              <meshStandardMaterial color="#64748b" metalness={0.55} roughness={0.42} />
            </mesh>
            <mesh geometry={geometries.filterRailsMerged}>
              <meshStandardMaterial color="#eab308" metalness={0.4} roughness={0.35} />
            </mesh>
            {/* Rotating compressor rotor visible inside intake collar */}
            <group ref={rotorRef} position={[-0.86, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.52, 0.52, 0.12, 12]} />
                <meshStandardMaterial color="#38bdf8" metalness={0.88} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'combustor': {
        return (
          <group>
            <ConcreteFoundation width={1.85} depth={1.85} />
            {/* Outer contoured combustor plenum casing */}
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#78350f"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={combustorGlow.emissiveColorHex}
                emissiveIntensity={combustorGlow.emissiveIntensity * 0.45}
                metalness={0.68}
                roughness={0.34}
              />
            </mesh>
            {/* Can-annular cans & fuel manifold ring */}
            <mesh castShadow geometry={geometries.cansMerged}>
              <meshStandardMaterial
                color="#b45309"
                emissive={combustorGlow.emissiveColorHex}
                emissiveIntensity={combustorGlow.emissiveIntensity * 0.65}
                metalness={0.62}
                roughness={0.3}
              />
            </mesh>
            {/* Educational Cutaway Flame Core Window (Correction 4) */}
            <mesh position={[0, 0.42, 0.45]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.24, 0.28, 0.92, 16]} />
              <meshBasicMaterial color={combustorGlow.emissiveColorHex} />
            </mesh>
            <Html position={[0, 0.92, 0.65]} center>
              <span className="cutaway-badge">{cutawayLabel}</span>
            </Html>
            <pointLight
              position={[0, 0.35, 0.35]}
              color={combustorGlow.emissiveColorHex}
              intensity={combustorGlow.pointLightIntensity}
              distance={5.5}
              decay={2}
            />
          </group>
        );
      }

      case 'gasTurbine': {
        return (
          <group>
            <ConcreteFoundation width={4.2} depth={2.2} />
            {/* Main contoured Gas Turbine casing */}
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#64748b"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.38 : 0.14}
                metalness={0.82}
                roughness={0.28}
              />
            </mesh>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial color="#cbd5e1" metalness={0.86} roughness={0.22} />
            </mesh>
            {/* Axial Exhaust Diffuser extending into the HRSG */}
            <mesh castShadow receiveShadow geometry={geometries.diffuser}>
              <meshStandardMaterial
                color="#475569"
                roughnessMap={textures.brushedMetalRoughness}
                metalness={0.72}
                roughness={0.36}
              />
            </mesh>
            {/* Rotating turbine disk hub */}
            <group ref={rotorRef} position={[0.68, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.58, 0.58, 0.14, 12]} />
                <meshStandardMaterial color="#fb923c" metalness={0.85} roughness={0.22} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'hrsg': {
        return (
          <group>
            <ConcreteFoundation width={3.8} depth={2.9} />
            {/* Main insulated HRSG casing */}
            <RoundedBox
              args={[3.2, 3.1, 2.1]}
              radius={0.06}
              smoothness={2}
              position={[0, 1.05, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#1e3a5f"
                emissive={isSelected ? '#38bdf8' : '#0f172a'}
                emissiveIntensity={isSelected ? 0.32 : 0.08}
                metalness={0.48}
                roughness={0.5}
              />
            </RoundedBox>

            {/* Exposed HRSG Tube Banks in Gas Flow Order (Correction 2):
                1) Superheater (-X hottest) -> 2) Evaporator (middle) -> 3) Economizer (+X coolest) */}
            <mesh geometry={geometries.superheaterBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.superheaterColorHex}
                emissive={hrsgTubeBanks.superheaterColorHex}
                emissiveIntensity={hrsgTubeBanks.superheaterGlow}
                metalness={0.55}
                roughness={0.35}
              />
            </mesh>
            <mesh geometry={geometries.evaporatorBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.evaporatorColorHex}
                emissive={hrsgTubeBanks.evaporatorColorHex}
                emissiveIntensity={hrsgTubeBanks.evaporatorGlow}
                metalness={0.55}
                roughness={0.35}
              />
            </mesh>
            <mesh geometry={geometries.economizerBank}>
              <meshStandardMaterial
                color={hrsgTubeBanks.economizerColorHex}
                emissive={hrsgTubeBanks.economizerColorHex}
                emissiveIntensity={hrsgTubeBanks.economizerGlow}
                metalness={0.55}
                roughness={0.35}
              />
            </mesh>

            {/* Top Steam Drum above Evaporator */}
            <mesh castShadow receiveShadow geometry={geometries.steamDrum}>
              <meshStandardMaterial
                color="#cbd5e1"
                roughnessMap={textures.brushedMetalRoughness}
                metalness={0.78}
                roughness={0.26}
              />
            </mesh>

            {/* Merged structural steel columns, stack & walkways */}
            <mesh castShadow receiveShadow geometry={geometries.structureMerged}>
              <meshStandardMaterial color="#475569" metalness={0.68} roughness={0.38} />
            </mesh>

            {/* Merged yellow handrails & caged ladder */}
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
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#0284c7"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.38 : 0.12}
                metalness={0.78}
                roughness={0.28}
              />
            </mesh>
            <mesh castShadow geometry={geometries.flanges}>
              <meshStandardMaterial color="#bae6fd" metalness={0.84} roughness={0.24} />
            </mesh>
            {/* Overhead HP-to-LP crossover pipe */}
            <mesh castShadow position={[-0.1, 0.92, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 1.05, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
            </mesh>
            <group ref={rotorRef} position={[-0.98, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.56, 0.56, 0.12, 12]} />
                <meshStandardMaterial color="#38bdf8" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'generator': {
        return (
          <group>
            <ConcreteFoundation width={2.35} depth={2.05} />
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#1d4ed8"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={isSelected ? '#60a5fa' : '#1e3a8a'}
                emissiveIntensity={isSelected ? 0.42 : 0.16}
                metalness={0.74}
                roughness={0.3}
              />
            </mesh>
            <mesh castShadow geometry={geometries.finsMerged}>
              <meshStandardMaterial color="#3b82f6" metalness={0.68} roughness={0.34} />
            </mesh>
            <group ref={rotorRef} position={[-0.95, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.45, 0.45, 0.12, 10]} />
                <meshStandardMaterial color="#93c5fd" metalness={0.82} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'condenser': {
        return (
          <group>
            <ConcreteFoundation width={2.85} depth={1.85} yOffset={-0.42} />
            <mesh castShadow receiveShadow geometry={geometries.casing}>
              <meshStandardMaterial
                color="#0f766e"
                roughnessMap={textures.brushedMetalRoughness}
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.38 : 0.1}
                metalness={0.68}
                roughness={0.32}
              />
            </mesh>
            <mesh castShadow geometry={geometries.ribsMerged}>
              <meshStandardMaterial color="#115e59" metalness={0.72} roughness={0.3} />
            </mesh>
          </group>
        );
      }

      case 'pump': {
        return (
          <group>
            <ConcreteFoundation width={1.85} depth={1.25} yOffset={-0.42} />
            <mesh castShadow receiveShadow geometry={geometries.pumpBody}>
              <meshStandardMaterial
                color="#2563eb"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.42 : 0.14}
                metalness={0.76}
                roughness={0.28}
              />
            </mesh>
            <mesh castShadow receiveShadow geometry={geometries.motorBody}>
              <meshStandardMaterial color="#334155" metalness={0.68} roughness={0.32} />
            </mesh>
            {/* Yellow shaft coupling guard */}
            <mesh position={[0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.22, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>
          </group>
        );
      }
    }
  };

  const tagHeight = meta.id === 'compressor' || meta.id === 'hrsg' ? 3.85 : 1.75;

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
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, tagHeight, 0]} center>
        <button
          type="button"
          className={`scene-tag ${isSelected ? 'scene-tag-active' : ''}`}
          onClick={onSelect}
        >
          {label}
        </button>
      </Html>
    </group>
  );
};

/**
 * Merged Industrial Site Scenery & Ground Environment (M3c Items 5 & 6):
 * - Hyperbolic Cooling Tower connected to Condenser with green circulating water lines
 * - Step-Up Transformer with radiator fins + HV Lattice Transmission Pylon near Generator
 * - Yellow Fuel Gas Supply Line feeding Combustor
 * - Concrete site pads, paved plant roads, and perimeter security fence
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

    // 3 HV Bushings on transformer
    for (const bx of [-5.5, -5.2, -4.9]) {
      const bush = new THREE.CylinderGeometry(0.05, 0.07, 0.45, 8);
      bush.translate(bx, 1.22, -3.6);
      steelParts.push(bush);
    }

    // Lattice Transmission Pylon at [-5.2, 0, -5.6]
    const pylonBody = new THREE.CylinderGeometry(0.22, 0.75, 4.6, 4);
    pylonBody.translate(-5.2, 2.0, -5.6);
    steelParts.push(pylonBody);

    const arm1 = new THREE.BoxGeometry(2.4, 0.14, 0.14);
    arm1.translate(-5.2, 3.1, -5.6);
    steelParts.push(arm1);

    const arm2 = new THREE.BoxGeometry(1.8, 0.12, 0.12);
    arm2.translate(-5.2, 3.9, -5.6);
    steelParts.push(arm2);

    // Overhead Pipe Rack H-frames supporting the Main Steam Line along z = -2.35
    for (const rx of [-6.5, -2.5, 1.5, 5.5]) {
      const postL = new THREE.BoxGeometry(0.1, 3.6, 0.1);
      postL.translate(rx, 1.5, -2.55);
      steelParts.push(postL);
      const postR = new THREE.BoxGeometry(0.1, 3.6, 0.1);
      postR.translate(rx, 1.5, -2.15);
      steelParts.push(postR);
      const beam = new THREE.BoxGeometry(0.12, 0.12, 0.65);
      beam.translate(rx, 3.22, -2.35);
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

    // 3. Yellow Fuel Gas Supply Line feeding Combustor (x = 0.8)
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
