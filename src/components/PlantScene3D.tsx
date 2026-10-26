import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PLANT_COMPONENTS,
  type CombinedCycleResult,
  type ComponentId,
  type ComponentMeta,
} from '../physics';
import {
  buildSceneAnimationParams,
  COMPONENT_POSITIONS_3D,
  POWERTRAIN_SHAFT,
  temperatureToHexColor,
  type CombustorGlowParams,
  type PipeAnimationSegment,
  type QualityMode,
  type StackPlumeParams,
} from '../scene/animationParams';

interface PlantScene3DProps {
  result: CombinedCycleResult;
  selectedComponent: ComponentId;
  onSelectComponent: (id: ComponentId) => void;
  flowPlaying: boolean;
  onToggleFlow: () => void;
}

class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface SynchronousShaftProps {
  angularSpeed: number;
}

const SynchronousShaft: React.FC<SynchronousShaftProps> = ({ angularSpeed }) => {
  const shaftGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (shaftGroupRef.current && angularSpeed > 0) {
      shaftGroupRef.current.rotation.x =
        (shaftGroupRef.current.rotation.x + delta * angularSpeed) % (Math.PI * 2);
    }
  });

  const collarXPositions = [-7.5, -5.4, -3.3, -1.0, 1.2, 3.6, 4.7, 6.7];

  return (
    <group
      ref={shaftGroupRef}
      position={[POWERTRAIN_SHAFT.centerX, POWERTRAIN_SHAFT.y, POWERTRAIN_SHAFT.z]}
    >
      {/* Main continuous synchronous shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, POWERTRAIN_SHAFT.length, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Visual rotating coupling collars with keyway fins so shaft rotation is clearly visible */}
      {collarXPositions.map((absX) => {
        const relX = absX - POWERTRAIN_SHAFT.centerX;
        return (
          <group key={absX} position={[relX, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.24, 0.24, 0.18, 8]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.16, 0.16, 0.08]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

interface EquipmentMeshProps {
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

const EquipmentMesh: React.FC<EquipmentMeshProps> = ({
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
  const emissiveColor = isSelected ? '#38bdf8' : colorHex;
  const emissiveIntensity = isSelected ? 0.65 : 0.2;

  useFrame((_, delta) => {
    if (rotorRef.current && shaftAngularSpeed > 0) {
      rotorRef.current.rotation.x =
        (rotorRef.current.rotation.x + delta * shaftAngularSpeed) % (Math.PI * 2);
    }
  });

  const renderShape = () => {
    switch (meta.id) {
      case 'compressor':
        return (
          <group>
            <mesh rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.52, 0.92, 1.9, 24]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                metalness={0.5}
                roughness={0.32}
                transparent
                opacity={0.88}
              />
            </mesh>
            <group ref={rotorRef}>
              <mesh position={[-0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[1.5, 0.12, 0.25]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[-0.65, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                <boxGeometry args={[1.5, 0.12, 0.25]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );

      case 'combustor':
        return (
          <group>
            {qualityMode === 'high' && (
              <pointLight
                color={combustorGlow.coreColorHex}
                intensity={combustorGlow.pointLightIntensity}
                distance={5.5}
              />
            )}
            {/* Outer combustor casing */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.52, 1.05, 12, 24]} />
              <meshStandardMaterial
                color={combustorGlow.coreColorHex}
                emissive={combustorGlow.coreColorHex}
                emissiveIntensity={combustorGlow.emissiveIntensity * 0.55}
                metalness={0.35}
                roughness={0.28}
                transparent
                opacity={0.78}
              />
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
              <capsuleGeometry args={[0.36, 0.78, 10, 18]} />
              <meshBasicMaterial color="#fff7ed" />
            </mesh>
            {/* Option B Procedural Additive Glow Halo */}
            {qualityMode === 'high' && (
              <mesh
                rotation={[0, 0, Math.PI / 2]}
                scale={[
                  combustorGlow.flameScale * 1.35,
                  combustorGlow.flameScale * 1.35,
                  combustorGlow.flameScale * 1.35,
                ]}
              >
                <capsuleGeometry args={[0.54, 1.1, 12, 20]} />
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

      case 'gasTurbine':
        return (
          <group>
            <mesh rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.95, 0.54, 2.0, 24]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity + 0.15}
                metalness={0.48}
                roughness={0.32}
                transparent
                opacity={0.88}
              />
            </mesh>
            {qualityMode === 'high' && (
              <mesh rotation={[0, 0, -Math.PI / 2]} scale={[1.12, 1.06, 1.12]}>
                <cylinderGeometry args={[0.98, 0.56, 2.04, 20]} />
                <meshBasicMaterial
                  color={colorHex}
                  transparent
                  opacity={0.22}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            )}
            <group ref={rotorRef}>
              <mesh position={[0.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[1.6, 0.14, 0.26]} />
                <meshStandardMaterial color="#fde68a" metalness={0.75} roughness={0.25} />
              </mesh>
            </group>
          </group>
        );

      case 'hrsg':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2.0, 2.5, 1.5]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                metalness={0.4}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
              <cylinderGeometry args={[0.32, 0.42, 1.3, 20]} />
              <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        );

      case 'steamTurbine':
        return (
          <group>
            <mesh rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.84, 0.46, 1.85, 24]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                metalness={0.52}
                roughness={0.3}
                transparent
                opacity={0.88}
              />
            </mesh>
            <group ref={rotorRef}>
              <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[1.45, 0.12, 0.22]} />
                <meshStandardMaterial color="#bae6fd" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          </group>
        );

      case 'condenser':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.65, 0.65, 1.75, 24]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.35}
              roughness={0.4}
            />
          </mesh>
        );

      case 'pump':
        return (
          <mesh>
            <torusGeometry args={[0.42, 0.22, 16, 28]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );

      case 'generator':
        return (
          <group>
            <mesh>
              <boxGeometry args={[1.65, 1.25, 1.25]} />
              <meshStandardMaterial
                color="#2563eb"
                emissive={isSelected ? '#60a5fa' : '#1d4ed8'}
                emissiveIntensity={emissiveIntensity}
                metalness={0.55}
                roughness={0.28}
                transparent
                opacity={0.86}
              />
            </mesh>
            <group ref={rotorRef}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.42, 0.42, 1.85, 8]} />
                <meshStandardMaterial color="#93c5fd" metalness={0.7} roughness={0.25} />
              </mesh>
            </group>
          </group>
        );
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
      {renderShape()}
      {isSelected && (
        <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.28, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, 1.48, 0]} center distanceFactor={15}>
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

interface GradientPipeWithParticlesProps {
  seg: PipeAnimationSegment;
  qualityMode: QualityMode;
}

const GradientPipeWithParticles: React.FC<GradientPipeWithParticlesProps> = ({
  seg,
  qualityMode,
}) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const phaseOffsetRef = useRef(0);
  const particleCount = qualityMode === 'high' ? 16 : 8;

  const { curve, tubeGeo } = useMemo(() => {
    const pts = seg.waypoints.map((w) => new THREE.Vector3(...w));
    const c = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = qualityMode === 'high' ? 28 : 14;
    const radialSegments = qualityMode === 'high' ? 12 : 8;
    const g = new THREE.TubeGeometry(c, tubularSegments, 0.105, radialSegments, false);

    // Apply smooth inlet -> outlet temperature vertex color gradient
    const posAttr = g.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const startVec = pts[0];
    const endVec = pts[pts.length - 1];
    const totalSpan = Math.max(0.001, startVec.distanceTo(endVec));
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      tmpVec.fromBufferAttribute(posAttr, i);
      const u = Math.max(0, Math.min(1, tmpVec.distanceTo(startVec) / totalSpan));
      const localT_K = seg.inletT_K + u * (seg.outletT_K - seg.inletT_K);
      tmpColor.set(temperatureToHexColor(localT_K));
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { curve: c, tubeGeo: g };
  }, [seg.waypoints, seg.inletT_K, seg.outletT_K, qualityMode]);

  useEffect(() => {
    return () => {
      tubeGeo.dispose();
    };
  }, [tubeGeo]);

  // Determine particle color & geometry scale from fluid phase & steam quality x
  const { particleColorHex, particleScaleVec } = useMemo(() => {
    if (seg.particleStyle === 'liquid-water') {
      return {
        particleColorHex: '#38bdf8',
        particleScaleVec: new THREE.Vector3(0.88, 0.88, 0.88),
      };
    }
    if (seg.particleStyle === 'superheated-steam') {
      return {
        particleColorHex: '#f0f9ff',
        particleScaleVec: new THREE.Vector3(0.68, 2.25, 0.68),
      };
    }
    if (seg.particleStyle === 'wet-steam') {
      const x = Math.max(0, Math.min(1, seg.vaporQuality ?? 0.85));
      const c = new THREE.Color('#38bdf8').lerp(new THREE.Color('#e0f2fe'), x);
      return {
        particleColorHex: `#${c.getHexString()}`,
        particleScaleVec: new THREE.Vector3(0.78, 0.9 + 1.15 * x, 0.78),
      };
    }
    // Gas path
    return {
      particleColorHex: '#fff7ed',
      particleScaleVec: new THREE.Vector3(1.0, 1.35, 1.0),
    };
  }, [seg.particleStyle, seg.vaporQuality]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const upVec = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, delta) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    if (seg.particleSpeed > 0) {
      phaseOffsetRef.current = (phaseOffsetRef.current + delta * seg.particleSpeed) % 1;
    }

    for (let i = 0; i < particleCount; i++) {
      const u = (phaseOffsetRef.current + i / particleCount) % 1;
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      dummy.position.copy(point);
      dummy.quaternion.setFromUnitVectors(upVec, tangent);
      dummy.scale.copy(particleScaleVec);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          vertexColors
          metalness={0.25}
          roughness={0.35}
          transparent
          opacity={0.72}
        />
      </mesh>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[0.135, 10, 10]} />
        <meshBasicMaterial
          color={particleColorHex}
          transparent
          opacity={0.94}
          blending={
            qualityMode === 'high' ? THREE.AdditiveBlending : THREE.NormalBlending
          }
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

interface StackPlumeMeshProps {
  plume: StackPlumeParams;
  qualityMode: QualityMode;
}

const StackPlumeMesh: React.FC<StackPlumeMeshProps> = ({ plume, qualityMode }) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const phaseRef = useRef(0);
  const puffCount = qualityMode === 'high' ? 16 : 8;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    if (plume.riseSpeed > 0) {
      phaseRef.current = (phaseRef.current + delta * plume.riseSpeed * 0.45) % 1;
    }

    const [bx, by, bz] = plume.stackTopPosition;
    for (let i = 0; i < puffCount; i++) {
      const u = (phaseRef.current + i / puffCount) % 1;
      const y = by + u * 2.4;
      const swayX = Math.sin(u * Math.PI * 2 + i) * 0.22 * u;
      const swayZ = Math.cos(u * Math.PI * 2 + i) * 0.18 * u;
      const radiusScale = 0.55 + u * 1.45 * plume.normalizedStackTemp;

      dummy.position.set(bx + swayX, y, bz + swayZ);
      dummy.scale.set(radiusScale, radiusScale * 0.8, radiusScale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, puffCount]}>
      <sphereGeometry args={[0.26, 10, 10]} />
      <meshBasicMaterial
        color={plume.colorHex}
        transparent
        opacity={plume.opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

export const PlantScene3D: React.FC<PlantScene3DProps> = ({
  result,
  selectedComponent,
  onSelectComponent,
  flowPlaying,
  onToggleFlow,
}) => {
  const { t } = useLanguage();
  const [qualityMode, setQualityMode] = useState<QualityMode>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 'low' : 'high',
  );

  const animParams = useMemo(
    () => buildSceneAnimationParams(result, flowPlaying),
    [result, flowPlaying],
  );

  return (
    <section className="scene-card" aria-label={t.appTitle}>
      <div className="scene-toolbar">
        <div className="temp-legend-container">
          <div className="temp-legend">
            <span className="temp-legend-label">{t.animation.tempLegend}</span>
            <div className="temp-gradient-bar" />
          </div>
          <div className="temp-ticks-row">
            {animParams.legendTicks.map((tick) => (
              <span key={tick.fraction} className="temp-tick-item">
                <span
                  className="state-dot"
                  style={{ backgroundColor: tick.colorHex }}
                />
                {tick.labelK} ({tick.labelC})
              </span>
            ))}
          </div>
        </div>

        <div className="scene-controls-right">
          <div className="lang-switcher" role="group" aria-label={t.animation.qualityLabel}>
            <button
              type="button"
              className={`lang-btn ${qualityMode === 'high' ? 'lang-btn-active' : ''}`}
              onClick={() => setQualityMode('high')}
              aria-pressed={qualityMode === 'high'}
            >
              {t.animation.qualityHigh}
            </button>
            <button
              type="button"
              className={`lang-btn ${qualityMode === 'low' ? 'lang-btn-active' : ''}`}
              onClick={() => setQualityMode('low')}
              aria-pressed={qualityMode === 'low'}
            >
              {t.animation.qualityLow}
            </button>
          </div>

          <button
            type="button"
            className="flow-toggle-btn"
            onClick={onToggleFlow}
            aria-pressed={flowPlaying}
          >
            {flowPlaying ? t.animation.pause : t.animation.play}
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <CanvasErrorBoundary>
          <Canvas camera={{ position: [0, 6.6, 12.2], fov: 44 }}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[8, 14, 10]} intensity={1.15} />
            <directionalLight position={[-8, 6, -8]} intensity={0.45} />

            <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -0.75, 0]} />

            {/* Single visible synchronous powertrain shaft */}
            <SynchronousShaft angularSpeed={animParams.shaftAngularSpeedRadPerSec} />

            {/* 8 Plant Equipment Components */}
            {PLANT_COMPONENTS.map((meta) => {
              const outState = result.states[meta.outletStateId];
              const colorHex = temperatureToHexColor(outState.T_K);
              return (
                <EquipmentMesh
                  key={meta.id}
                  meta={meta}
                  position={COMPONENT_POSITIONS_3D[meta.id]}
                  isSelected={selectedComponent === meta.id}
                  colorHex={colorHex}
                  label={t.components[meta.id].name}
                  shaftAngularSpeed={animParams.shaftAngularSpeedRadPerSec}
                  combustorGlow={animParams.combustorGlow}
                  qualityMode={qualityMode}
                  onSelect={() => onSelectComponent(meta.id)}
                />
              );
            })}

            {/* Smooth Gradient Pipes with Instanced Phase-Styled Flow Particles */}
            {animParams.pipes.map((seg) => (
              <GradientPipeWithParticles
                key={seg.id}
                seg={seg}
                qualityMode={qualityMode}
              />
            ))}

            {/* Rising HRSG Stack Exhaust Plume */}
            <StackPlumeMesh plume={animParams.stackPlume} qualityMode={qualityMode} />

            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={24}
              target={[0, 0.8, -0.6]}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      <div
        className="component-Invalid-selector-bar"
        role="tablist"
        aria-label={t.components.selectedTitle}
      >
        {PLANT_COMPONENTS.map((meta) => {
          const active = selectedComponent === meta.id;
          return (
            <button
              key={meta.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`equip-chip ${active ? 'equip-chip-active' : ''}`}
              onClick={() => onSelectComponent(meta.id)}
            >
              {t.components[meta.id].name}
            </button>
          );
        })}
      </div>
    </section>
  );
};
