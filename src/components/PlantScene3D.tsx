import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PLANT_COMPONENTS,
  type CombinedCycleResult,
  type ComponentId,
} from '../physics';
import {
  buildSceneAnimationParams,
  CAMERA_OVERVIEW_SHOT,
  COMPONENT_CAMERA_SHOTS,
  COMPONENT_POSITIONS_3D,
  PIPE_SERVICE_COLORS,
  POWERTRAIN_SHAFT,
  temperatureToHexColor,
  type CameraShot,
  type PipeAnimationSegment,
  type PipeColorMode,
  type QualityMode,
  type StackPlumeParams,
} from '../scene/animationParams';
import { OptionalPlantScenery, ProceduralEquipment } from '../scene/ProceduralEquipment';

interface PlantScene3DProps {
  result: CombinedCycleResult;
  selectedComponent: ComponentId;
  onSelectComponent: (id: ComponentId) => void;
  flowPlaying: boolean;
  onToggleFlow: () => void;
  showcaseMode: boolean;
  onToggleShowcase: () => void;
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

/**
 * Local procedural studio environment map using Three.js RoomEnvironment (zero external HDRI/CDN files).
 */
const LocalStudioEnvironment: React.FC = () => {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;

    return () => {
      scene.environment = null;
      envTarget.dispose();
      roomEnv.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, scene]);

  return null;
};

/**
 * Reports exact real WebGL triangle count and draw calls onto the DOM wrapper for M3b/M7b verification.
 */
const WebGLStatsProbe: React.FC<{ wrapperRef: React.RefObject<HTMLDivElement | null> }> = ({
  wrapperRef,
}) => {
  const { gl } = useThree();

  useFrame(() => {
    if (wrapperRef.current) {
      wrapperRef.current.dataset.triangles = String(gl.info.render.triangles);
      wrapperRef.current.dataset.drawcalls = String(gl.info.render.calls);
    }
  });

  return null;
};

/**
 * Smoothly interpolates camera position and OrbitControls target when focusing an equipment asset or returning to overview.
 */
const CameraFocusController: React.FC<{
  activeShot: CameraShot;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({ activeShot, controlsRef }) => {
  const { camera } = useThree();
  const desiredPos = useMemo(
    () => new THREE.Vector3(...activeShot.position),
    [activeShot.position],
  );
  const desiredTarget = useMemo(
    () => new THREE.Vector3(...activeShot.target),
    [activeShot.target],
  );
  const animRemainingRef = useRef(0);

  useEffect(() => {
    animRemainingRef.current = 1.1;
  }, [desiredPos, desiredTarget]);

  useFrame((_, delta) => {
    if (animRemainingRef.current <= 0) return;
    animRemainingRef.current = Math.max(0, animRemainingRef.current - delta);

    const step = Math.min(1, delta * 5.5);
    camera.position.lerp(desiredPos, step);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredTarget, step);
      controlsRef.current.update();
    }
  });

  return null;
};

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

  const collarXPositions = [-7.8, -5.6, -3.4, -1.0, 1.2, 3.6, 4.8, 6.9];

  return (
    <group
      ref={shaftGroupRef}
      position={[POWERTRAIN_SHAFT.centerX, POWERTRAIN_SHAFT.y, POWERTRAIN_SHAFT.z]}
    >
      {/* Main continuous synchronous forged steel shaft */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, POWERTRAIN_SHAFT.length, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.18} />
      </mesh>

      {/* Bolted coupling collars with keyway markers */}
      {collarXPositions.map((absX) => {
        const relX = absX - POWERTRAIN_SHAFT.centerX;
        return (
          <group key={absX} position={[relX, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.24, 0.24, 0.16, 10]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.72} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.16, 0.15, 0.08]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

interface IndustrialPipeWithParticlesProps {
  seg: PipeAnimationSegment;
  pipeColorMode: PipeColorMode;
  qualityMode: QualityMode;
}

const IndustrialPipeWithParticles: React.FC<IndustrialPipeWithParticlesProps> = ({
  seg,
  pipeColorMode,
  qualityMode,
}) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const phaseOffsetRef = useRef(0);
  const particleCount = qualityMode === 'high' ? 16 : 8;

  const { curve, tubeGeo, startPt, endPt } = useMemo(() => {
    const pts = seg.waypoints.map((w) => new THREE.Vector3(...w));
    const c = new THREE.CatmullRomCurve3(pts);
    const tubularSegments = qualityMode === 'high' ? 28 : 14;
    const radialSegments = qualityMode === 'high' ? 12 : 8;
    const g = new THREE.TubeGeometry(c, tubularSegments, 0.11, radialSegments, false);

    const posAttr = g.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const sVec = pts[0];
    const eVec = pts[pts.length - 1];
    const totalSpan = Math.max(0.001, sVec.distanceTo(eVec));
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      if (pipeColorMode === 'service') {
        tmpColor.set(seg.serviceColorHex);
      } else {
        tmpVec.fromBufferAttribute(posAttr, i);
        const u = Math.max(0, Math.min(1, tmpVec.distanceTo(sVec) / totalSpan));
        const localT_K = seg.inletT_K + u * (seg.outletT_K - seg.inletT_K);
        tmpColor.set(temperatureToHexColor(localT_K));
      }
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { curve: c, tubeGeo: g, startPt: sVec, endPt: eVec };
  }, [
    seg.waypoints,
    seg.inletT_K,
    seg.outletT_K,
    seg.serviceColorHex,
    pipeColorMode,
    qualityMode,
  ]);

  useEffect(() => {
    return () => {
      tubeGeo.dispose();
    };
  }, [tubeGeo]);

  const { particleColorHex, particleScaleVec } = useMemo(() => {
    if (seg.particleStyle === 'liquid-water') {
      return {
        particleColorHex: '#60a5fa',
        particleScaleVec: new THREE.Vector3(0.88, 0.88, 0.88),
      };
    }
    if (seg.particleStyle === 'superheated-steam') {
      return {
        particleColorHex: '#fff7ed',
        particleScaleVec: new THREE.Vector3(0.68, 2.25, 0.68),
      };
    }
    if (seg.particleStyle === 'wet-steam') {
      const x = Math.max(0, Math.min(1, seg.vaporQuality ?? 0.85));
      const c = new THREE.Color('#38bdf8').lerp(new THREE.Color('#ffffff'), x);
      return {
        particleColorHex: `#${c.getHexString()}`,
        particleScaleVec: new THREE.Vector3(0.78, 0.9 + 1.15 * x, 0.78),
      };
    }
    return {
      particleColorHex: '#fef08a',
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
      {/* Insulated metallic pipe body */}
      <mesh castShadow geometry={tubeGeo}>
        <meshStandardMaterial
          vertexColors
          metalness={0.48}
          roughness={0.32}
          transparent
          opacity={0.72}
        />
      </mesh>
      {/* Pipe endpoint flange collars */}
      <mesh position={startPt}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={endPt}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.28} />
      </mesh>
      {/* Instanced flow particles */}
      <instancedMesh ref={instancedRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[0.135, 10, 10]} />
        <meshBasicMaterial
          color={particleColorHex}
          transparent
          opacity={0.95}
          blending={qualityMode === 'high' ? THREE.AdditiveBlending : THREE.NormalBlending}
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
      const radiusScale = 0.52 + u * 1.45 * plume.normalizedStackTemp;

      dummy.position.set(bx - 0.45 + swayX, y, bz + swayZ);
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
  showcaseMode,
  onToggleShowcase,
}) => {
  const { t } = useLanguage();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const searchParams = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(),
    [],
  );

  const [qualityMode, setQualityMode] = useState<QualityMode>(() => {
    const q = searchParams.get('quality');
    if (q === 'low' || q === 'high') return q;
    return typeof window !== 'undefined' && window.innerWidth <= 768 ? 'low' : 'high';
  });

  // Decision 1: Scenery ON by default in High quality, OFF by default in Low quality
  const [showScenery, setShowScenery] = useState<boolean>(() => qualityMode === 'high');

  // Decision 2: Pipe colors toggle "Service colors / Temperature", Default = Service colors
  const [pipeColorMode, setPipeColorMode] = useState<PipeColorMode>(() =>
    searchParams.get('pipeMode') === 'temperature' ? 'temperature' : 'service',
  );

  // Camera zoom focus state (null = full overview, or a ComponentId when zoomed in)
  const [focusedComponent, setFocusedComponent] = useState<ComponentId | null>(() => {
    const focusParam = searchParams.get('focus') as ComponentId | null;
    if (focusParam && focusParam in COMPONENT_CAMERA_SHOTS) {
      return focusParam;
    }
    return null;
  });

  const handleQualityChange = (mode: QualityMode) => {
    setQualityMode(mode);
    setShowScenery(mode === 'high');
  };

  const handleSelectAndFocus = (id: ComponentId) => {
    onSelectComponent(id);
    if (showcaseMode) {
      setFocusedComponent(id);
    }
  };

  const activeCameraShot: CameraShot = focusedComponent
    ? COMPONENT_CAMERA_SHOTS[focusedComponent]
    : CAMERA_OVERVIEW_SHOT;

  const animParams = useMemo(
    () => buildSceneAnimationParams(result, flowPlaying),
    [result, flowPlaying],
  );

  return (
    <section
      className={`scene-card ${showcaseMode ? 'scene-card-showcase' : ''}`}
      aria-label={t.appTitle}
    >
      <div className="scene-toolbar">
        {/* Pipe Legend: Service Colors Mode vs Temperature Gradient Mode */}
        <div className="temp-legend-container">
          {pipeColorMode === 'service' ? (
            <div className="temp-ticks-row">
              <span className="temp-tick-item">
                <span
                  className="state-dot"
                  style={{ backgroundColor: PIPE_SERVICE_COLORS.air }}
                />
                {t.animation.serviceLegend.air}
              </span>
              <span className="temp-tick-item">
                <span
                  className="state-dot"
                  style={{ backgroundColor: PIPE_SERVICE_COLORS['flue-gas'] }}
                />
                {t.animation.serviceLegend.flueGas}
              </span>
              <span className="temp-tick-item">
                <span
                  className="state-dot"
                  style={{ backgroundColor: PIPE_SERVICE_COLORS.steam }}
                />
                {t.animation.serviceLegend.steam}
              </span>
              <span className="temp-tick-item">
                <span
                  className="state-dot"
                  style={{ backgroundColor: PIPE_SERVICE_COLORS.water }}
                />
                {t.animation.serviceLegend.water}
              </span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="scene-controls-right">
          {/* Pipe Color Mode Switch: Service Colors / Temperature */}
          <div className="lang-switcher" role="group" aria-label={t.animation.pipeColorModeLabel}>
            <button
              type="button"
              className={`lang-btn ${pipeColorMode === 'service' ? 'lang-btn-active' : ''}`}
              onClick={() => setPipeColorMode('service')}
              aria-pressed={pipeColorMode === 'service'}
            >
              {t.animation.serviceColors}
            </button>
            <button
              type="button"
              className={`lang-btn ${pipeColorMode === 'temperature' ? 'lang-btn-active' : ''}`}
              onClick={() => setPipeColorMode('temperature')}
              aria-pressed={pipeColorMode === 'temperature'}
            >
              {t.animation.temperatureColors}
            </button>
          </div>

          {/* Scenery Toggle */}
          <button
            type="button"
            className={`flow-toggle-btn ${showScenery ? 'btn-active-accent' : ''}`}
            onClick={() => setShowScenery((prev) => !prev)}
            aria-pressed={showScenery}
          >
            {showScenery ? t.animation.sceneryOn : t.animation.sceneryOff}
          </button>

          {/* Quality Mode Switch: High / Low */}
          <div className="lang-switcher" role="group" aria-label={t.animation.qualityLabel}>
            <button
              type="button"
              className={`lang-btn ${qualityMode === 'high' ? 'lang-btn-active' : ''}`}
              onClick={() => handleQualityChange('high')}
              aria-pressed={qualityMode === 'high'}
            >
              {t.animation.qualityHigh}
            </button>
            <button
              type="button"
              className={`lang-btn ${qualityMode === 'low' ? 'lang-btn-active' : ''}`}
              onClick={() => handleQualityChange('low')}
              aria-pressed={qualityMode === 'low'}
            >
              {t.animation.qualityLow}
            </button>
          </div>

          {/* Flow Play / Pause */}
          <button
            type="button"
            className="flow-toggle-btn"
            onClick={onToggleFlow}
            aria-pressed={flowPlaying}
          >
            {flowPlaying ? t.animation.pause : t.animation.play}
          </button>

          {/* Showcase Mode Toggle */}
          <button
            type="button"
            className={`flow-toggle-btn ${showcaseMode ? 'btn-showcase-active' : ''}`}
            onClick={() => {
              if (showcaseMode) {
                setFocusedComponent(null);
              }
              onToggleShowcase();
            }}
            aria-pressed={showcaseMode}
          >
            {showcaseMode ? t.animation.showcaseExit : t.animation.showcaseEnter}
          </button>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className={`canvas-wrapper ${showcaseMode ? 'canvas-wrapper-showcase' : ''}`}
      >
        {(showcaseMode || focusedComponent !== null) && (
          <div className="showcase-hud-overlay">
            {focusedComponent !== null && (
              <button
                type="button"
                className="back-overview-btn"
                onClick={() => setFocusedComponent(null)}
              >
                ← {t.animation.backToOverview}
              </button>
            )}
            <div className="showcase-focused-card">
              <strong>{t.components[selectedComponent].name}</strong>
              <span>{t.components[selectedComponent].role}</span>
            </div>
          </div>
        )}

        <CanvasErrorBoundary>
          <Canvas
            shadows={qualityMode === 'high'}
            camera={{ position: CAMERA_OVERVIEW_SHOT.position, fov: 42 }}
          >
            <LocalStudioEnvironment />
            <WebGLStatsProbe wrapperRef={wrapperRef} />
            <CameraFocusController activeShot={activeCameraShot} controlsRef={controlsRef} />

            {/* Soft Studio Key, Fill, and Warm Rim Lighting */}
            <hemisphereLight args={['#e0f2fe', '#0f172a', 0.65]} />
            <directionalLight
              castShadow={qualityMode === 'high'}
              position={[10, 16, 11]}
              intensity={1.35}
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-12}
              shadow-camera-right={12}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <directionalLight position={[-9, 8, -9]} intensity={0.5} color="#bae6fd" />

            {/* Industrial Power Plant Concrete Floor Slab & Grid */}
            <mesh receiveShadow position={[0, -0.32, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[24, 14]} />
              <meshStandardMaterial color="#0f172a" metalness={0.12} roughness={0.86} />
            </mesh>
            <gridHelper args={[24, 24, '#1e293b', '#131f33']} position={[0, -0.31, -0.4]} />

            {qualityMode === 'high' && (
              <ContactShadows
                position={[0, -0.3, -0.4]}
                opacity={0.45}
                scale={22}
                blur={1.8}
                far={4.5}
              />
            )}

            {/* Single visible synchronous powertrain shaft */}
            <SynchronousShaft angularSpeed={animParams.shaftAngularSpeedRadPerSec} />

            {/* 8 Detailed Procedural Plant Equipment Components */}
            {PLANT_COMPONENTS.map((meta) => {
              const outState = result.states[meta.outletStateId];
              const colorHex = temperatureToHexColor(outState.T_K);
              return (
                <ProceduralEquipment
                  key={meta.id}
                  meta={meta}
                  position={COMPONENT_POSITIONS_3D[meta.id]}
                  isSelected={selectedComponent === meta.id}
                  colorHex={colorHex}
                  label={t.components[meta.id].name}
                  shaftAngularSpeed={animParams.shaftAngularSpeedRadPerSec}
                  combustorGlow={animParams.combustorGlow}
                  qualityMode={qualityMode}
                  onSelect={() => {
                    onSelectComponent(meta.id);
                    setFocusedComponent(meta.id);
                  }}
                />
              );
            })}

            {/* Industrial Pipes with Flanges & Instanced Phase-Styled Flow Particles */}
            {animParams.pipes.map((seg) => (
              <IndustrialPipeWithParticles
                key={seg.id}
                seg={seg}
                pipeColorMode={pipeColorMode}
                qualityMode={qualityMode}
              />
            ))}

            {/* Rising HRSG Stack Exhaust Plume */}
            <StackPlumeMesh plume={animParams.stackPlume} qualityMode={qualityMode} />

            {/* Optional Scenery (Cooling Tower, HV Pylon & Transformer, Fuel Gas Line) */}
            {showScenery && <OptionalPlantScenery />}

            <OrbitControls
              ref={controlsRef}
              enablePan
              enableZoom
              enableRotate
              minDistance={2.6}
              maxDistance={26}
              target={CAMERA_OVERVIEW_SHOT.target}
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
              onClick={() => handleSelectAndFocus(meta.id)}
            >
              {t.components[meta.id].name}
            </button>
          );
        })}
      </div>
    </section>
  );
};
