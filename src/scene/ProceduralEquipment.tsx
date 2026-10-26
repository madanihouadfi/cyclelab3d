import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ComponentMeta } from '../physics';
import type { CombustorGlowParams, QualityMode } from './animationParams';

interface BoltRingProps {
  radius: number;
  boltCount: number;
  xOffset: number;
  qualityMode: QualityMode;
}

const BoltRing: React.FC<BoltRingProps> = ({ radius, boltCount, xOffset, qualityMode }) => {
  const count = qualityMode === 'high' ? boltCount : Math.max(6, Math.floor(boltCount / 2));
  const angles = Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2);

  return (
    <group position={[xOffset, 0, 0]}>
      {/* Flange ring collar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius + 0.08, radius + 0.08, 0.07, count * 2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Circumferential bolts */}
      {angles.map((ang, idx) => (
        <mesh
          key={idx}
          position={[0, Math.cos(ang) * (radius + 0.04), Math.sin(ang) * (radius + 0.04)]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.13, 6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

interface ConcreteFoundationProps {
  width: number;
  depth: number;
  height?: number;
  yOffset?: number;
  withSteelSkid?: boolean;
}

const ConcreteFoundation: React.FC<ConcreteFoundationProps> = ({
  width,
  depth,
  height = 0.36,
  yOffset = -0.95,
  withSteelSkid = true,
}) => (
  <group position={[0, yOffset, 0]}>
    {/* Concrete pedestal block */}
    <mesh receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color="#334155" metalness={0.08} roughness={0.88} />
    </mesh>
    {/* Steel I-beam skid frame */}
    {withSteelSkid && (
      <mesh receiveShadow castShadow position={[0, height / 2 + 0.05, 0]}>
        <boxGeometry args={[width * 0.94, 0.1, depth * 0.92]} />
        <meshStandardMaterial color="#1e293b" metalness={0.68} roughness={0.35} />
      </mesh>
    )}
  </group>
);

export interface ProceduralEquipmentProps {
  meta: ComponentMeta;
  position: [number, number, number];
  isSelected: boolean;
  colorHex: string;
  label: string;
  shaftAngularSpeed: number;
  combustorGlow: CombustorGlowParams;
  qualityMode: QualityMode;
  onSelect: () => void;
}

export const ProceduralEquipment: React.FC<ProceduralEquipmentProps> = ({
  meta,
  position,
  isSelected,
  colorHex,
  label,
  shaftAngularSpeed,
  combustorGlow,
  qualityMode,
  onSelect,
}) => {
  const rotorRef = useRef<THREE.Group>(null);
  const segs = qualityMode === 'high' ? 28 : 16;
  const selectEmissive = isSelected ? '#38bdf8' : '#000000';
  const selectIntensity = isSelected ? 0.38 : 0.0;

  useFrame((_, delta) => {
    if (rotorRef.current && shaftAngularSpeed > 0) {
      rotorRef.current.rotation.x =
        (rotorRef.current.rotation.x + delta * shaftAngularSpeed) % (Math.PI * 2);
    }
  });

  const renderIndustrialAsset = () => {
    switch (meta.id) {
      case 'compressor': {
        return (
          <group>
            <ConcreteFoundation width={2.4} depth={1.85} yOffset={-1.05} />
            {/* Pedestal support legs */}
            <mesh castShadow position={[-0.65, -0.55, 0]}>
              <boxGeometry args={[0.25, 0.65, 1.3]} />
              <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh castShadow position={[0.65, -0.55, 0]}>
              <boxGeometry args={[0.25, 0.65, 1.3]} />
              <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
            </mesh>

            {/* Bellmouth intake filter plenum */}
            <mesh castShadow receiveShadow position={[-1.18, 0.15, 0]}>
              <boxGeometry args={[0.48, 1.45, 1.55]} />
              <meshStandardMaterial
                color="#0284c7"
                emissive={selectEmissive}
                emissiveIntensity={selectIntensity}
                metalness={0.45}
                roughness={0.4}
              />
            </mesh>

            {/* Tapered axial compressor casing */}
            <mesh castShadow receiveShadow rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.52, 0.92, 2.0, segs]} />
              <meshStandardMaterial
                color="#475569"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.45 : 0.12}
                metalness={0.75}
                roughness={0.28}
              />
            </mesh>

            {/* Horizontal split-casing flange seam */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[2.02, 0.07, 1.92]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
            </mesh>

            {/* Stage stiffening ribs & bolt rings */}
            <BoltRing radius={0.88} boltCount={12} xOffset={-0.85} qualityMode={qualityMode} />
            <BoltRing radius={0.72} boltCount={12} xOffset={-0.25} qualityMode={qualityMode} />
            <BoltRing radius={0.58} boltCount={12} xOffset={0.4} qualityMode={qualityMode} />
            <BoltRing radius={0.52} boltCount={12} xOffset={0.95} qualityMode={qualityMode} />

            {/* Rotating visible first-stage IGV / rotor blades */}
            <group ref={rotorRef} position={[-0.95, 0, 0]}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <mesh
                  key={idx}
                  rotation={[(idx * Math.PI) / 3, 0, 0]}
                >
                  <boxGeometry args={[0.12, 1.55, 0.16]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.18} />
                </mesh>
              ))}
            </group>
          </group>
        );
      }

      case 'combustor': {
        const canCount = 8;
        const canAngles = Array.from({ length: canCount }, (_, i) => (i / canCount) * Math.PI * 2);

        return (
          <group>
            {/* Structural support frame down to foundation */}
            <ConcreteFoundation width={1.9} depth={1.85} yOffset={-2.55} />
            <mesh castShadow position={[-0.55, -1.35, 0.55]}>
              <cylinderGeometry args={[0.07, 0.07, 2.2, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh castShadow position={[0.55, -1.35, -0.55]}>
              <cylinderGeometry args={[0.07, 0.07, 2.2, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
            </mesh>

            {qualityMode === 'high' && (
              <pointLight
                color={combustorGlow.coreColorHex}
                intensity={combustorGlow.pointLightIntensity}
                distance={6.0}
              />
            )}

            {/* Central pressurized plenum barrel */}
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 1.5, segs]} />
              <meshStandardMaterial
                color="#7c2d12"
                emissive={combustorGlow.coreColorHex}
                emissiveIntensity={combustorGlow.emissiveIntensity * 0.45}
                metalness={0.62}
                roughness={0.32}
              />
            </mesh>

            {/* Circumferential ring of 8 can-annular combustor cans */}
            {canAngles.map((ang, i) => {
              const r = 0.58;
              const cy = Math.cos(ang) * r;
              const cz = Math.sin(ang) * r;
              return (
                <group key={i} position={[0, cy, cz]}>
                  <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.16, 0.14, 1.35, 12]} />
                    <meshStandardMaterial
                      color="#9a3412"
                      emissive={combustorGlow.coreColorHex}
                      emissiveIntensity={combustorGlow.emissiveIntensity * 0.65}
                      metalness={0.55}
                      roughness={0.3}
                    />
                  </mesh>
                  {/* Fuel nozzle end-cap */}
                  <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
                  </mesh>
                </group>
              );
            })}

            {/* Yellow fuel gas distribution manifold ring */}
            <mesh position={[-0.68, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.62, 0.045, 10, 24]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>

            {/* Glowing inner flame core scaled by T3 */}
            <mesh
              rotation={[0, 0, Math.PI / 2]}
              scale={[
                combustorGlow.flameScale,
                combustorGlow.flameScale,
                combustorGlow.flameScale,
              ]}
            >
              <capsuleGeometry args={[0.38, 0.85, 10, 16]} />
              <meshBasicMaterial color="#fff7ed" />
            </mesh>

            {/* Procedural Additive Glow Halo */}
            {qualityMode === 'high' && (
              <mesh
                rotation={[0, 0, Math.PI / 2]}
                scale={[
                  combustorGlow.flameScale * 1.35,
                  combustorGlow.flameScale * 1.35,
                  combustorGlow.flameScale * 1.35,
                ]}
              >
                <capsuleGeometry args={[0.62, 1.15, 12, 18]} />
                <meshBasicMaterial
                  color={combustorGlow.coreColorHex}
                  transparent
                  opacity={combustorGlow.haloOpacity}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        );
      }

      case 'gasTurbine': {
        return (
          <group>
            <ConcreteFoundation width={2.5} depth={1.95} yOffset={-1.05} />
            {/* Pedestal legs */}
            <mesh castShadow position={[-0.6, -0.55, 0]}>
              <boxGeometry args={[0.28, 0.65, 1.35]} />
              <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh castShadow position={[0.6, -0.55, 0]}>
              <boxGeometry args={[0.28, 0.65, 1.35]} />
              <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
            </mesh>

            {/* Multi-stage expanding turbine casing */}
            <mesh castShadow receiveShadow rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.96, 0.54, 2.05, segs]} />
              <meshStandardMaterial
                color="#78350f"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.5 : 0.28}
                metalness={0.72}
                roughness={0.28}
              />
            </mesh>

            {/* Horizontal split flange with bolts */}
            <mesh castShadow position={[0, 0, 0]}>
              <boxGeometry args={[2.08, 0.08, 1.98]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
            </mesh>

            <BoltRing radius={0.56} boltCount={12} xOffset={-0.95} qualityMode={qualityMode} />
            <BoltRing radius={0.7} boltCount={12} xOffset={-0.3} qualityMode={qualityMode} />
            <BoltRing radius={0.84} boltCount={14} xOffset={0.35} qualityMode={qualityMode} />
            <BoltRing radius={0.96} boltCount={14} xOffset={0.98} qualityMode={qualityMode} />

            {/* Exhaust diffuser hood */}
            <mesh castShadow receiveShadow position={[1.15, 0.1, 0]}>
              <boxGeometry args={[0.42, 1.75, 1.75]} />
              <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.35} />
            </mesh>

            {/* Rotating turbine stage wheel */}
            <group ref={rotorRef} position={[0.8, 0, 0]}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <mesh key={idx} rotation={[(idx * Math.PI) / 3, 0, 0]}>
                  <boxGeometry args={[0.14, 1.68, 0.18]} />
                  <meshStandardMaterial color="#fde68a" metalness={0.82} roughness={0.22} />
                </mesh>
              ))}
            </group>
          </group>
        );
      }

      case 'hrsg': {
        return (
          <group>
            <ConcreteFoundation width={3.2} depth={2.4} yOffset={-2.05} />

            {/* Main insulated vertical HRSG boiler casing */}
            <mesh castShadow receiveShadow position={[0, -0.25, 0]}>
              <boxGeometry args={[2.35, 3.1, 1.85]} />
              <meshStandardMaterial
                color="#334155"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.42 : 0.12}
                metalness={0.48}
                roughness={0.42}
              />
            </mesh>

            {/* External structural H-beam columns along HRSG sides */}
            {[-0.95, -0.32, 0.32, 0.95].map((xPos) => (
              <React.Fragment key={xPos}>
                <mesh castShadow position={[xPos, -0.25, 0.96]}>
                  <boxGeometry args={[0.11, 3.18, 0.12]} />
                  <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh castShadow position={[xPos, -0.25, -0.96]}>
                  <boxGeometry args={[0.11, 3.18, 0.12]} />
                  <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
                </mesh>
              </React.Fragment>
            ))}

            {/* Top high-pressure cylindrical Steam Drum */}
            <mesh castShadow receiveShadow position={[0.35, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 1.65, segs]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.24} />
            </mesh>

            {/* Flanged exhaust stack on top of HRSG */}
            <mesh castShadow receiveShadow position={[-0.45, 2.05, 0]}>
              <cylinderGeometry args={[0.38, 0.48, 1.65, segs]} />
              <meshStandardMaterial color="#64748b" metalness={0.68} roughness={0.32} />
            </mesh>
            {/* Stack sampling platform ring */}
            <mesh position={[-0.45, 2.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.54, 0.04, 8, 24]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>

            {/* Two elevated maintenance platforms with yellow safety handrails */}
            {[-0.65, 0.65].map((platY) => (
              <group key={platY} position={[0, platY, 1.12]}>
                {/* Grating walkway deck */}
                <mesh castShadow>
                  <boxGeometry args={[2.45, 0.06, 0.36]} />
                  <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* Top safety handrail */}
                <mesh position={[0, 0.34, 0.16]}>
                  <boxGeometry args={[2.45, 0.035, 0.035]} />
                  <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
                </mesh>
                {/* Mid knee-rail */}
                <mesh position={[0, 0.18, 0.16]}>
                  <boxGeometry args={[2.45, 0.025, 0.025]} />
                  <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
                </mesh>
              </group>
            ))}

            {/* Vertical caged access ladder on front-right corner */}
            <group position={[1.28, -0.25, 1.1]}>
              <mesh position={[-0.08, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 3.1, 6]} />
                <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
              </mesh>
              <mesh position={[0.08, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 3.1, 6]} />
                <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
              </mesh>
              {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((rungY) => (
                <mesh key={rungY} position={[0, rungY, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
                  <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.35} />
                </mesh>
              ))}
            </group>
          </group>
        );
      }

      case 'steamTurbine': {
        return (
          <group>
            <ConcreteFoundation width={2.45} depth={1.85} yOffset={-1.05} />
            <mesh castShadow position={[-0.55, -0.55, 0]}>
              <boxGeometry args={[0.3, 0.65, 1.3]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.38} />
            </mesh>
            <mesh castShadow position={[0.55, -0.55, 0]}>
              <boxGeometry args={[0.3, 0.65, 1.3]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.38} />
            </mesh>

            {/* HP cylinder section */}
            <mesh castShadow receiveShadow position={[-0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.56, 0.46, 0.9, segs]} />
              <meshStandardMaterial
                color="#0369a1"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.45 : 0.15}
                metalness={0.68}
                roughness={0.28}
              />
            </mesh>

            {/* LP double-flow cylinder section */}
            <mesh castShadow receiveShadow position={[0.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.88, 0.62, 1.1, segs]} />
              <meshStandardMaterial
                color="#0284c7"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.45 : 0.15}
                metalness={0.68}
                roughness={0.28}
              />
            </mesh>

            {/* Overhead HP-to-LP crossover steam pipe */}
            <mesh castShadow position={[-0.05, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.95, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
            </mesh>

            <BoltRing radius={0.56} boltCount={10} xOffset={-0.12} qualityMode={qualityMode} />
            <BoltRing radius={0.86} boltCount={14} xOffset={0.95} qualityMode={qualityMode} />

            {/* Rotating LP rotor wheel */}
            <group ref={rotorRef} position={[0.85, 0, 0]}>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <mesh key={idx} rotation={[(idx * Math.PI) / 3, 0, 0]}>
                  <boxGeometry args={[0.12, 1.55, 0.16]} />
                  <meshStandardMaterial color="#bae6fd" metalness={0.82} roughness={0.2} />
                </mesh>
              ))}
            </group>
          </group>
        );
      }

      case 'generator': {
        return (
          <group>
            <ConcreteFoundation width={2.5} depth={1.95} yOffset={-1.05} />
            {/* Main stator cylindrical housing */}
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.78, 0.78, 1.85, segs]} />
              <meshStandardMaterial
                color="#1d4ed8"
                emissive={selectEmissive}
                emissiveIntensity={selectIntensity}
                metalness={0.58}
                roughness={0.32}
              />
            </mesh>

            {/* Radial stator cooling fins */}
            {[-0.65, -0.35, -0.05, 0.25, 0.55].map((finX) => (
              <mesh key={finX} castShadow position={[finX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.86, 0.86, 0.06, segs]} />
                <meshStandardMaterial color="#3b82f6" metalness={0.68} roughness={0.28} />
              </mesh>
            ))}

            {/* Brushless exciter end-housing */}
            <mesh castShadow position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.48, 16]} />
              <meshStandardMaterial color="#1e40af" metalness={0.65} roughness={0.3} />
            </mesh>

            {/* Side High-Voltage Terminal Box & 3 Phase Insulator Bushings */}
            <group position={[0, 0.35, 0.92]}>
              <mesh castShadow>
                <boxGeometry args={[0.85, 0.62, 0.45]} />
                <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
              </mesh>
              {[-0.25, 0, 0.25].map((bx) => (
                <mesh key={bx} position={[bx, 0.48, 0]}>
                  <cylinderGeometry args={[0.045, 0.065, 0.38, 10]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.2} />
                </mesh>
              ))}
            </group>

            {/* Rotating rotor fan collar */}
            <group ref={rotorRef} position={[-0.95, 0, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.45, 0.45, 0.14, 8]} />
                <meshStandardMaterial color="#93c5fd" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );
      }

      case 'condenser': {
        return (
          <group>
            <ConcreteFoundation width={2.4} depth={1.65} yOffset={-0.45} withSteelSkid={false} />
            {/* Two saddle supports */}
            <mesh castShadow position={[-0.65, -0.22, 0]}>
              <boxGeometry args={[0.22, 0.35, 1.25]} />
              <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh castShadow position={[0.65, -0.22, 0]}>
              <boxGeometry args={[0.22, 0.35, 1.25]} />
              <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Main horizontal shell-and-tube vessel */}
            <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.62, 0.62, 1.85, segs]} />
              <meshStandardMaterial
                color="#0f766e"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.42 : 0.12}
                metalness={0.65}
                roughness={0.32}
              />
            </mesh>

            {/* Domed end waterboxes & tube-sheet bolt rings */}
            <BoltRing radius={0.62} boltCount={12} xOffset={-0.92} qualityMode={qualityMode} />
            <BoltRing radius={0.62} boltCount={12} xOffset={0.92} qualityMode={qualityMode} />
            <mesh castShadow position={[-0.95, 0, 0]}>
              <sphereGeometry args={[0.61, 16, 16]} />
              <meshStandardMaterial color="#115e59" metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh castShadow position={[0.95, 0, 0]}>
              <sphereGeometry args={[0.61, 16, 16]} />
              <meshStandardMaterial color="#115e59" metalness={0.6} roughness={0.35} />
            </mesh>

            {/* Top steam inlet neck & side cooling-water nozzles */}
            <mesh castShadow position={[0, 0.65, 0]}>
              <cylinderGeometry args={[0.28, 0.34, 0.35, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh castShadow position={[-0.75, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.35, 12]} />
              <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh castShadow position={[0.75, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.35, 12]} />
              <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        );
      }

      case 'pump': {
        return (
          <group>
            <ConcreteFoundation width={1.65} depth={1.15} yOffset={-0.45} />
            {/* Volute centrifugal pump casing */}
            <mesh castShadow receiveShadow position={[-0.35, 0.05, 0]}>
              <torusGeometry args={[0.28, 0.16, 14, 24]} />
              <meshStandardMaterial
                color="#1d4ed8"
                emissive={isSelected ? '#38bdf8' : colorHex}
                emissiveIntensity={isSelected ? 0.45 : 0.15}
                metalness={0.72}
                roughness={0.28}
              />
            </mesh>
            {/* Discharge vertical flange nozzle */}
            <mesh castShadow position={[-0.35, 0.42, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.35, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.25} />
            </mesh>
            {/* Yellow shaft coupling guard */}
            <mesh castShadow position={[0.02, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.14, 0.14, 0.28, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.35} />
            </mesh>
            {/* Finned electric drive motor */}
            <mesh castShadow receiveShadow position={[0.42, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.26, 0.26, 0.56, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.32} />
            </mesh>
          </group>
        );
      }
    }
  };

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
        <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.38, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, 1.65, 0]} center>
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
 * Optional Industrial Plant Scenery (No Physics):
 * 1) Hyperbolic natural-draft Cooling Tower connected to Condenser
 * 2) High-voltage lattice Transmission Tower (Pylon) + Step-Up Transformer near Generator
 * 3) Yellow Fuel Gas Supply Line with valve manifold feeding the Combustor
 */
export const OptionalPlantScenery: React.FC = () => {
  return (
    <group>
      {/* 1. Hyperbolic Cooling Tower at back-right */}
      <group position={[6.8, 0.0, 3.6]}>
        {/* Basin pad */}
        <mesh receiveShadow position={[0, -0.65, 0]}>
          <cylinderGeometry args={[1.65, 1.75, 0.35, 24]} />
          <meshStandardMaterial color="#334155" metalness={0.1} roughness={0.85} />
        </mesh>
        {/* Lower hyperbolic shell */}
        <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.98, 1.52, 2.1, 24, 1, true]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.08}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Upper hyperbolic throat/flare */}
        <mesh castShadow receiveShadow position={[0, 2.05, 0]}>
          <cylinderGeometry args={[1.12, 0.98, 0.95, 24, 1, true]} />
          <meshStandardMaterial
            color="#64748b"
            metalness={0.08}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Soft white water vapor cloud at cooling tower exit */}
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.68, 12, 12]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.22} depthWrite={false} />
        </mesh>
        {/* Circulating water pipes between condenser and cooling tower */}
        <mesh position={[-2.2, -0.15, -0.7]} rotation={[0, -0.32, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 3.8, 10]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>

      {/* 2. High-Voltage Transmission Pylon & Step-Up Transformer near Generator */}
      <group position={[9.2, 0.0, -1.6]}>
        {/* Step-up transformer block */}
        <mesh castShadow receiveShadow position={[-1.4, -0.15, 0.6]}>
          <boxGeometry args={[1.05, 1.1, 0.85]} />
          <meshStandardMaterial color="#475569" metalness={0.55} roughness={0.4} />
        </mesh>
        {/* Lattice Pylon tower */}
        <mesh castShadow position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.18, 0.68, 4.4, 4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.3} wireframe />
        </mesh>
        {/* Cross-arms */}
        <mesh castShadow position={[0, 2.4, 0]}>
          <boxGeometry args={[0.14, 0.14, 2.2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 3.2, 0]}>
          <boxGeometry args={[0.12, 0.12, 1.65]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>

      {/* 3. Yellow Fuel Gas Supply Line feeding Combustor */}
      <group position={[-4.5, 0.6, -2.6]}>
        <mesh castShadow position={[0, 0.85, 0.8]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 2.35, 10]} />
          <meshStandardMaterial color="#eab308" metalness={0.55} roughness={0.3} />
        </mesh>
        {/* Fuel gas isolation valve handwheel */}
        <mesh position={[0, 0.25, 1.35]}>
          <torusGeometry args={[0.16, 0.025, 8, 16]} />
          <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
};
