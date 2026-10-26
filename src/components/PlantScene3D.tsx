import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
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
  type CoolingTowerPlumeParams,
  type HeatShimmerParams,
  type PipeAnimationSegment,
  type PipeColorMode,
  type QualityMode,
  type StackPlumeParams,
} from '../scene/animationParams';
import {
  OptionalPlantScenery,
  ProceduralEquipment,
} from '../scene/ProceduralEquipment';
import { getProceduralTextures, mergeStaticParts } from '../scene/proceduralMaterials';
import type { ViewMode } from '../ui/theme';
import {
  IconFullscreen,
  IconMouse,
  IconPause,
  IconPlay,
  IconResetCamera,
  IconSettings,
  IconZoomIn,
  IconZoomOut,
} from './Icons';
import { ViewportSettings } from './ViewportSettings';

interface PlantScene3DProps {
  result: CombinedCycleResult;
  selectedComponent: ComponentId;
  onSelectComponent: (id: ComponentId) => void;
  flowPlaying: boolean;
  onToggleFlow: () => void;
  showcaseMode: boolean;
  onToggleShowcase: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  resetSignal: number;
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
 * Generates a procedural studio environment reflection map locally using Three.js RoomEnvironment.
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
 * Exposes live Three.js WebGL triangle count and draw calls as DOM attributes on `.canvas-wrapper`.
 */
const WebGLStatsProbe: React.FC<{
  wrapperRef: React.RefObject<HTMLDivElement | null>;
}> = ({ wrapperRef }) => {
  const { gl } = useThree();

  useFrame(() => {
    if (wrapperRef.current && gl.info.render.triangles > 0) {
      wrapperRef.current.dataset.triangles = String(gl.info.render.triangles);
      wrapperRef.current.dataset.drawcalls = String(gl.info.render.calls);
    }
  });

  return null;
};

/**
 * Smoothly interpolates camera position and OrbitControls target when focusing an equipment asset,
 * resetting the camera, or clicking the Zoom In / Zoom Out viewport buttons.
 */
const CameraFocusController: React.FC<{
  activeShot: CameraShot;
  resetCounter: number;
  zoomSignal: { factor: number; seq: number };
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}> = ({ activeShot, resetCounter, zoomSignal, controlsRef }) => {
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
  }, [desiredPos, desiredTarget, resetCounter]);

  useEffect(() => {
    if (zoomSignal.seq === 0) return;
    animRemainingRef.current = 0;
    const target = controlsRef.current
      ? controlsRef.current.target
      : new THREE.Vector3(...CAMERA_OVERVIEW_SHOT.target);
    const offset = camera.position.clone().sub(target);
    const nextLen = THREE.MathUtils.clamp(offset.length() * zoomSignal.factor, 2.8, 26);
    offset.setLength(nextLen);
    camera.position.copy(target).add(offset);
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [zoomSignal, camera, controlsRef]);

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

/**
 * Single continuous synchronous shaft with bolted couplings merged into 2 draw calls.
 * Spans Steam Turbine (-8.6) – Generator (-5.2) – Compressor (-1.6) – Combustor (0.8) – Gas Turbine (3.2).
 */
const SynchronousShaft: React.FC<{ angularSpeed: number }> = ({ angularSpeed }) => {
  const shaftGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (shaftGroupRef.current && angularSpeed > 0) {
      shaftGroupRef.current.rotation.x =
        (shaftGroupRef.current.rotation.x + delta * angularSpeed) % (Math.PI * 2);
    }
  });

  const { steelMerged, keywayMerged } = useMemo(() => {
    const steelParts: THREE.BufferGeometry[] = [];
    const keyParts: THREE.BufferGeometry[] = [];

    const mainRod = new THREE.CylinderGeometry(0.13, 0.13, POWERTRAIN_SHAFT.length, 16);
    mainRod.rotateZ(Math.PI / 2);
    steelParts.push(mainRod);

    const couplingX = [-7.0, -6.8, -3.5, -3.3, -0.45, 1.95];
    for (const absX of couplingX) {
      const relX = absX - POWERTRAIN_SHAFT.centerX;
      const flange = new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12);
      flange.rotateZ(Math.PI / 2);
      flange.translate(relX, 0, 0);
      steelParts.push(flange);

      const stripe = new THREE.BoxGeometry(0.14, 0.16, 0.08);
      stripe.translate(relX, 0.22, 0);
      keyParts.push(stripe);
    }

    return {
      steelMerged: mergeStaticParts(steelParts),
      keywayMerged: mergeStaticParts(keyParts),
    };
  }, []);

  useEffect(() => {
    return () => {
      steelMerged.dispose();
      keywayMerged.dispose();
    };
  }, [steelMerged, keywayMerged]);

  return (
    <group
      ref={shaftGroupRef}
      position={[POWERTRAIN_SHAFT.centerX, POWERTRAIN_SHAFT.y, POWERTRAIN_SHAFT.z]}
    >
      <mesh castShadow geometry={steelMerged}>
        <meshStandardMaterial color="#e2e8f0" metalness={0.88} roughness={0.18} />
      </mesh>
      <mesh geometry={keywayMerged}>
        <meshBasicMaterial color="#2dd4bf" />
      </mesh>
    </group>
  );
};

/**
 * Builds an orthogonal (90° right-angle) CurvePath with smooth quarter-circle elbows
 * instead of wide diagonal splines.
 */
function buildOrthogonalElbowCurve(waypoints: [number, number, number][]): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const pts = waypoints.map((w) => new THREE.Vector3(...w));
  if (pts.length < 2) return path;
  if (pts.length === 2) {
    path.add(new THREE.LineCurve3(pts[0], pts[1]));
    return path;
  }

  const elbowRadius = 0.28;
  let currentStart = pts[0];

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const corner = pts[i];
    const next = pts[i + 1];

    const vIn = corner.clone().sub(prev);
    const vOut = next.clone().sub(corner);
    const lenIn = vIn.length();
    const lenOut = vOut.length();
    const r = Math.min(elbowRadius, lenIn * 0.4, lenOut * 0.4);

    const elbowStart = corner.clone().addScaledVector(vIn.normalize(), -r);
    const elbowEnd = corner.clone().addScaledVector(vOut.normalize(), r);

    if (currentStart.distanceTo(elbowStart) > 0.001) {
      path.add(new THREE.LineCurve3(currentStart, elbowStart));
    }
    path.add(new THREE.QuadraticBezierCurve3(elbowStart, corner, elbowEnd));
    currentStart = elbowEnd;
  }

  const finalPt = pts[pts.length - 1];
  if (currentStart.distanceTo(finalPt) > 0.001) {
    path.add(new THREE.LineCurve3(currentStart, finalPt));
  }
  return path;
}

interface IndustrialPipeWithParticlesProps {
  seg: PipeAnimationSegment;
  pipeColorMode: PipeColorMode;
  viewMode: ViewMode;
  qualityMode: QualityMode;
}

const IndustrialPipeWithParticles: React.FC<IndustrialPipeWithParticlesProps> = ({
  seg,
  pipeColorMode,
  viewMode,
  qualityMode,
}) => {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const phaseOffsetRef = useRef(0);
  const particleCount = qualityMode === 'high' ? 28 : 14;
  const effectiveColorMode: PipeColorMode =
    viewMode === 'temperature' ? 'temperature' : pipeColorMode;
  const isXray = viewMode === 'xray';
  const isInternalGasPath = seg.loop === 'gas';

  const { curve, tubeGeo, fittingsGeo } = useMemo(() => {
    const c = buildOrthogonalElbowCurve(seg.waypoints);
    const tubularSegments = qualityMode === 'high' ? 44 : 22;
    const radialSegments = qualityMode === 'high' ? 12 : 8;
    const pipeRadius = isInternalGasPath ? 0.068 : 0.115;
    const g = new THREE.TubeGeometry(c, tubularSegments, pipeRadius, radialSegments, false);

    const pts = seg.waypoints.map((w) => new THREE.Vector3(...w));
    const sVec = pts[0];
    const eVec = pts[pts.length - 1];
    const totalSpan = Math.max(0.001, sVec.distanceTo(eVec));
    const posAttr = g.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const tmpVec = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      if (effectiveColorMode === 'service') {
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

    const fitParts: THREE.BufferGeometry[] = [];
    if (!isInternalGasPath) {
      for (const wp of pts) {
        const collar = new THREE.SphereGeometry(0.155, 10, 10);
        collar.translate(wp.x, wp.y, wp.z);
        fitParts.push(collar);
      }
    } else {
      const nozzleStart = new THREE.SphereGeometry(0.09, 8, 8);
      nozzleStart.translate(pts[0].x, pts[0].y, pts[0].z);
      fitParts.push(nozzleStart);
    }

    if (seg.valvePosition) {
      const [vx, vy, vz] = seg.valvePosition;
      const vBody = new THREE.CylinderGeometry(0.17, 0.17, 0.3, 10);
      vBody.rotateZ(Math.PI / 2);
      vBody.translate(vx, vy, vz);
      fitParts.push(vBody);

      const vStem = new THREE.CylinderGeometry(0.032, 0.032, 0.28, 6);
      vStem.translate(vx, vy + 0.22, vz);
      fitParts.push(vStem);

      const vWheel = new THREE.TorusGeometry(0.15, 0.026, 6, 12);
      vWheel.rotateX(Math.PI / 2);
      vWheel.translate(vx, vy + 0.36, vz);
      fitParts.push(vWheel);
    }

    return {
      curve: c,
      tubeGeo: g,
      fittingsGeo: mergeStaticParts(fitParts),
    };
  }, [
    seg.waypoints,
    seg.inletT_K,
    seg.outletT_K,
    seg.serviceColorHex,
    seg.valvePosition,
    effectiveColorMode,
    qualityMode,
    isInternalGasPath,
  ]);

  useEffect(() => {
    return () => {
      tubeGeo.dispose();
      fittingsGeo.dispose();
    };
  }, [tubeGeo, fittingsGeo]);

  const particleColorHex = useMemo(() => {
    if (seg.particleStyle === 'liquid-water') return '#38bdf8';
    if (seg.particleStyle === 'wet-steam') return '#bae6fd';
    if (seg.particleStyle === 'superheated-steam') return '#fef08a';
    return seg.service === 'air' ? '#7dd3fc' : '#fdba74';
  }, [seg.particleStyle, seg.service]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  useFrame((_, delta) => {
    const mesh = instancedRef.current;
    if (!mesh) return;

    if (seg.particleSpeed > 0) {
      phaseOffsetRef.current = (phaseOffsetRef.current + delta * seg.particleSpeed) % 1;
    }

    const lenStretch =
      seg.particleStyle === 'superheated-steam'
        ? 1.55
        : seg.particleStyle === 'gas'
          ? 1.35
          : 1.05;

    for (let i = 0; i < particleCount; i++) {
      const t = (phaseOffsetRef.current + i / particleCount) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      dummy.position.copy(pt);
      quat.setFromUnitVectors(upAxis, tangent);
      dummy.quaternion.copy(quat);
      const pulse = 0.88 + 0.24 * Math.sin((t * Math.PI * 4) + i);
      dummy.scale.set(pulse, pulse * lenStretch, pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Insulated metallic pipe body or internal gas streamline core */}
      <mesh castShadow={!isInternalGasPath} geometry={tubeGeo}>
        <meshStandardMaterial
          vertexColors
          metalness={isInternalGasPath ? 0.25 : 0.58}
          roughness={isInternalGasPath ? 0.4 : 0.26}
          wireframe={isXray}
          transparent
          opacity={isXray ? 0.34 : isInternalGasPath ? 0.36 : 0.68}
        />
      </mesh>
      {/* Merged pipe flanges & inline valve */}
      {!isInternalGasPath && (
        <mesh geometry={fittingsGeo}>
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.82}
            roughness={0.24}
            wireframe={isXray}
            transparent={isXray}
            opacity={isXray ? 0.34 : 1}
          />
        </mesh>
      )}
      {/* Dense Streamline Flow Pulses moving along the exact thermodynamic flow path */}
      <instancedMesh ref={instancedRef} args={[undefined, undefined, particleCount]}>
        <coneGeometry args={[0.082, 0.26, 10]} />
        <meshBasicMaterial color={particleColorHex} />
      </instancedMesh>
    </group>
  );
};

/**
 * Rising plume for both HRSG exhaust stack and Cooling Tower vapor cloud, plus Heat Shimmer.
 */
const PlumeAndShimmerEffects: React.FC<{
  stackPlume: StackPlumeParams;
  coolingPlume: CoolingTowerPlumeParams;
  heatShimmer: HeatShimmerParams;
  showScenery: boolean;
  qualityMode: QualityMode;
}> = ({ stackPlume, coolingPlume, heatShimmer, showScenery, qualityMode }) => {
  const stackRef = useRef<THREE.InstancedMesh>(null);
  const coolRef = useRef<THREE.InstancedMesh>(null);
  const shimmerRef = useRef<THREE.InstancedMesh>(null);
  const phaseRef = useRef(0);
  const puffCount = qualityMode === 'high' ? 14 : 7;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    phaseRef.current = (phaseRef.current + delta * 0.45) % 1;

    if (stackRef.current) {
      const [bx, by, bz] = stackPlume.stackTopPosition;
      for (let i = 0; i < puffCount; i++) {
        const u = (phaseRef.current * (stackPlume.riseSpeed || 0.01) + i / puffCount) % 1;
        const y = by + u * 2.2;
        const swayX = Math.sin(u * Math.PI * 2 + i) * 0.2 * u;
        const swayZ = Math.cos(u * Math.PI * 2 + i) * 0.16 * u;
        const s = 0.48 + u * 1.35 * stackPlume.normalizedStackTemp;
        dummy.position.set(bx + swayX, y, bz + swayZ);
        dummy.scale.set(s, s * 0.8, s);
        dummy.updateMatrix();
        stackRef.current.setMatrixAt(i, dummy.matrix);
      }
      stackRef.current.instanceMatrix.needsUpdate = true;
    }

    if (coolRef.current && showScenery) {
      const [cx, cy, cz] = coolingPlume.towerTopPosition;
      for (let i = 0; i < puffCount; i++) {
        const u = (phaseRef.current * (coolingPlume.riseSpeed || 0.01) + i / puffCount) % 1;
        const y = cy + u * 2.5;
        const swayX = Math.cos(u * Math.PI * 2 + i) * 0.32 * u;
        const swayZ = Math.sin(u * Math.PI * 2 + i) * 0.32 * u;
        const s = 0.85 + u * 1.55;
        dummy.position.set(cx + swayX, y, cz + swayZ);
        dummy.scale.set(s, s * 0.75, s);
        dummy.updateMatrix();
        coolRef.current.setMatrixAt(i, dummy.matrix);
      }
      coolRef.current.instanceMatrix.needsUpdate = true;
    }

    if (shimmerRef.current && qualityMode === 'high') {
      const [dx, dy, dz] = heatShimmer.diffuserTopPosition;
      const [sx, sy, sz] = heatShimmer.stackTopPosition;
      for (let i = 0; i < 6; i++) {
        const u = (phaseRef.current * 1.4 + i / 6) % 1;
        const isStack = i >= 3;
        const baseX = isStack ? sx : dx;
        const baseY = isStack ? sy : dy;
        const baseZ = isStack ? sz : dz;
        const intensity = isStack
          ? heatShimmer.stackIntensity
          : heatShimmer.exhaustIntensity;
        dummy.position.set(
          baseX + Math.sin(u * 10 + i) * 0.14,
          baseY + u * 0.9,
          baseZ,
        );
        const scale = intensity > 0 ? 0.4 + u * 0.6 : 0.001;
        dummy.scale.set(scale * 1.6, scale * 0.25, scale);
        dummy.updateMatrix();
        shimmerRef.current.setMatrixAt(i, dummy.matrix);
      }
      shimmerRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={stackRef} args={[undefined, undefined, puffCount]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial
          color={stackPlume.colorHex}
          transparent
          opacity={stackPlume.opacity}
          depthWrite={false}
        />
      </instancedMesh>
      {showScenery && (
        <instancedMesh ref={coolRef} args={[undefined, undefined, puffCount]}>
          <sphereGeometry args={[0.42, 8, 8]} />
          <meshBasicMaterial
            color="#f1f5f9"
            transparent
            opacity={coolingPlume.opacity}
            depthWrite={false}
          />
        </instancedMesh>
      )}
      {qualityMode === 'high' && (
        <instancedMesh ref={shimmerRef} args={[undefined, undefined, 6]}>
          <torusGeometry args={[0.35, 0.04, 6, 16]} />
          <meshBasicMaterial
            color="#fdba74"
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </instancedMesh>
      )}
    </group>
  );
};

/**
 * Industrial Site Ground with Concrete Pads, Plant Roads & Soft Sky Gradient Dome.
 */
const IndustrialSiteGroundAndSky: React.FC = () => {
  const textures = useMemo(() => getProceduralTextures(), []);

  const { skyGeo, padsAndRoadsGeo } = useMemo(() => {
    const dome = new THREE.SphereGeometry(42, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const pos = dome.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const cHorizon = new THREE.Color('#1a1f26');
    const cZenith = new THREE.Color('#0a0c0f');
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = Math.max(0, pos.getY(i) / 42);
      tmp.copy(cHorizon).lerp(cZenith, Math.pow(y, 0.55));
      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }
    dome.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const parts: THREE.BufferGeometry[] = [];
    const mainDeck = new THREE.BoxGeometry(21.5, 0.14, 3.6);
    mainDeck.translate(-0.5, -0.24, -0.8);
    parts.push(mainDeck);

    const auxDeck = new THREE.BoxGeometry(10.5, 0.12, 2.8);
    auxDeck.translate(-5.4, -0.25, 2.5);
    parts.push(auxDeck);

    const frontRoad = new THREE.BoxGeometry(28, 0.06, 1.4);
    frontRoad.translate(-1, -0.28, 5.1);
    parts.push(frontRoad);

    return {
      skyGeo: dome,
      padsAndRoadsGeo: mergeStaticParts(parts),
    };
  }, []);

  useEffect(() => {
    return () => {
      skyGeo.dispose();
      padsAndRoadsGeo.dispose();
    };
  }, [skyGeo, padsAndRoadsGeo]);

  return (
    <group>
      <mesh geometry={skyGeo} position={[0, -2, 0]}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh receiveShadow position={[-1, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[32, 18]} />
        <meshStandardMaterial color="#0d1117" metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh receiveShadow geometry={padsAndRoadsGeo}>
        <meshStandardMaterial
          color="#1c2128"
          bumpMap={textures.concreteBump}
          bumpScale={0.01}
          metalness={0.12}
          roughness={0.85}
        />
      </mesh>
      <gridHelper args={[30, 30, '#21262d', '#161b22']} position={[-1, -0.3, 0]} />
    </group>
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
  viewMode,
  onChangeViewMode,
  resetSignal,
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

  const [showScenery, setShowScenery] = useState<boolean>(() => qualityMode === 'high');

  const [pipeColorMode, setPipeColorMode] = useState<PipeColorMode>(() =>
    searchParams.get('pipeMode') === 'temperature' ? 'temperature' : 'service',
  );

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [cameraResetCount, setCameraResetCount] = useState<number>(0);
  const [zoomSignal, setZoomSignal] = useState<{ factor: number; seq: number }>({
    factor: 1,
    seq: 0,
  });

  const [focusedComponent, setFocusedComponent] = useState<ComponentId | null>(() => {
    const focusParam = searchParams.get('focus') as ComponentId | null;
    if (focusParam && focusParam in COMPONENT_CAMERA_SHOTS) {
      return focusParam;
    }
    return null;
  });

  useEffect(() => {
    if (resetSignal > 0) {
      setFocusedComponent(null);
      setCameraResetCount((c) => c + 1);
    }
  }, [resetSignal]);

  const handleQualityChange = (mode: QualityMode) => {
    setQualityMode(mode);
    setShowScenery(mode === 'high');
  };

  const handleResetCamera = () => {
    setFocusedComponent(null);
    setCameraResetCount((c) => c + 1);
  };

  const handleZoom = (factor: number) => {
    setZoomSignal((prev) => ({ factor, seq: prev.seq + 1 }));
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

  const showTemperatureLegend =
    viewMode === 'temperature' || pipeColorMode === 'temperature';

  return (
    <section
      className={`scene-card ${showcaseMode ? 'scene-card-showcase' : ''}`}
      aria-label={t.appTitle}
    >
      <div
        ref={wrapperRef}
        className={`canvas-wrapper ${showcaseMode ? 'canvas-wrapper-showcase' : ''}`}
      >
        {/* Top-left Round Viewport Tool Buttons: Fullscreen & Reset Camera */}
        <div className="viewport-tools-top-left">
          <button
            type="button"
            className={`round-icon-btn ${showcaseMode ? 'round-icon-btn-active' : ''}`}
            onClick={() => {
              if (showcaseMode) {
                setFocusedComponent(null);
              }
              onToggleShowcase();
            }}
            title={showcaseMode ? t.animation.showcaseExit : t.viewport.fullscreen}
            aria-label={showcaseMode ? t.animation.showcaseExit : t.viewport.fullscreen}
          >
            <IconFullscreen />
          </button>

          <button
            type="button"
            className="round-icon-btn"
            onClick={handleResetCamera}
            title={t.viewport.resetCamera}
            aria-label={t.viewport.resetCamera}
          >
            <IconResetCamera />
          </button>

          {focusedComponent !== null && (
            <button
              type="button"
              className="back-overview-btn"
              onClick={handleResetCamera}
            >
              ← {t.animation.backToOverview}
            </button>
          )}
        </div>

        {/* Top-center View Modes Switch: Realistic / X-ray / Temperature */}
        <div
          className="view-modes-pill"
          role="group"
          aria-label={t.viewModes.ariaLabel}
        >
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'realistic' ? 'view-mode-btn-active' : ''}`}
            onClick={() => onChangeViewMode('realistic')}
            aria-pressed={viewMode === 'realistic'}
          >
            {t.viewModes.realistic}
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'xray' ? 'view-mode-btn-active' : ''}`}
            onClick={() => onChangeViewMode('xray')}
            aria-pressed={viewMode === 'xray'}
          >
            {t.viewModes.xray}
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'temperature' ? 'view-mode-btn-active' : ''}`}
            onClick={() => onChangeViewMode('temperature')}
            aria-pressed={viewMode === 'temperature'}
          >
            {t.viewModes.temperature}
          </button>
        </div>

        {/* Top-right Round Viewport Tool Button: Play / Pause Flow */}
        <div className="viewport-tools-top-right">
          <button
            type="button"
            className={`round-icon-btn ${!flowPlaying ? 'round-icon-btn-active' : ''}`}
            onClick={onToggleFlow}
            title={flowPlaying ? t.animation.pause : t.animation.play}
            aria-label={flowPlaying ? t.animation.pause : t.animation.play}
          >
            {flowPlaying ? <IconPause /> : <IconPlay />}
          </button>
        </div>

        {/* Right-side Round Viewport Tool Buttons: Zoom In / Zoom Out */}
        <div className="viewport-tools-right">
          <button
            type="button"
            className="round-icon-btn"
            onClick={() => handleZoom(0.82)}
            title={t.viewport.zoomIn}
            aria-label={t.viewport.zoomIn}
          >
            <IconZoomIn />
          </button>
          <button
            type="button"
            className="round-icon-btn"
            onClick={() => handleZoom(1.22)}
            title={t.viewport.zoomOut}
            aria-label={t.viewport.zoomOut}
          >
            <IconZoomOut />
          </button>
        </div>

        {/* Bottom-center Small "Rotate to view" Hint */}
        <div className="viewport-rotate-hint" aria-hidden="true">
          <IconMouse />
          <span>{t.viewport.rotateHint}</span>
        </div>

        {/* Bottom-right Round Settings Button + Popover */}
        <div className="viewport-tools-bottom-right">
          {settingsOpen && (
            <ViewportSettings
              qualityMode={qualityMode}
              onChangeQuality={handleQualityChange}
              showScenery={showScenery}
              onToggleScenery={() => setShowScenery((prev) => !prev)}
              pipeColorMode={pipeColorMode}
              onChangePipeColorMode={setPipeColorMode}
              viewMode={viewMode}
            />
          )}
          <button
            type="button"
            className={`round-icon-btn ${settingsOpen ? 'round-icon-btn-active' : ''}`}
            onClick={() => setSettingsOpen((prev) => !prev)}
            title={t.viewport.settings}
            aria-label={t.viewport.settings}
            aria-expanded={settingsOpen}
          >
            <IconSettings />
          </button>
        </div>

        <CanvasErrorBoundary>
          <Canvas
            shadows={qualityMode === 'high'}
            camera={{ position: CAMERA_OVERVIEW_SHOT.position, fov: 42 }}
          >
            <LocalStudioEnvironment />
            <WebGLStatsProbe wrapperRef={wrapperRef} />
            <CameraFocusController
              activeShot={activeCameraShot}
              resetCounter={cameraResetCount}
              zoomSignal={zoomSignal}
              controlsRef={controlsRef}
            />

            {/* Soft Studio Key, Fill, and Warm Rim Lighting */}
            <hemisphereLight args={['#e0f2fe', '#0f172a', 0.68]} />
            <directionalLight
              castShadow={qualityMode === 'high'}
              position={[10, 16, 12]}
              intensity={1.38}
              shadow-mapSize={[1024, 1024]}
              shadow-camera-left={-14}
              shadow-camera-right={14}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <directionalLight position={[-11, 8, -9]} intensity={0.52} color="#bae6fd" />

            {/* Site Ground with Concrete Pads, Roads & Soft Sky Gradient */}
            <IndustrialSiteGroundAndSky />

            {qualityMode === 'high' && (
              <ContactShadows
                position={[-0.5, -0.29, 0]}
                opacity={0.42}
                scale={26}
                blur={1.8}
                far={4.5}
              />
            )}

            {/* Single synchronous powertrain shaft (ST - Gen - Comp - Comb - GT) */}
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
                  cutawayLabel={t.animation.cutawayLabel}
                  shaftAngularSpeed={animParams.shaftAngularSpeedRadPerSec}
                  combustorGlow={animParams.combustorGlow}
                  hrsgTubeBanks={animParams.hrsgTubeBanks}
                  qualityMode={qualityMode}
                  viewMode={viewMode}
                  onSelect={() => {
                    onSelectComponent(meta.id);
                    setFocusedComponent(meta.id);
                  }}
                />
              );
            })}

            {/* Orthogonal 90° Piping with Smooth Elbows, Flanges, Valves & Flow Arrows */}
            {animParams.pipes.map((seg) => (
              <IndustrialPipeWithParticles
                key={seg.id}
                seg={seg}
                pipeColorMode={pipeColorMode}
                viewMode={viewMode}
                qualityMode={qualityMode}
              />
            ))}

            {/* HRSG Stack Plume, Cooling Tower Steam Plume & Heat Shimmer */}
            <PlumeAndShimmerEffects
              stackPlume={animParams.stackPlume}
              coolingPlume={animParams.coolingTowerPlume}
              heatShimmer={animParams.heatShimmer}
              showScenery={showScenery}
              qualityMode={qualityMode}
            />

            {/* Optional Scenery (Cooling Tower, Step-Up Transformer, HV Pylon, Pipe Racks, Fence) */}
            {showScenery && <OptionalPlantScenery />}

            {/* Bottom-Left 3D Axis Gizmo from @react-three/drei */}
            <GizmoHelper alignment="bottom-left" margin={[54, 54]}>
              <GizmoViewport
                axisColors={['#9aa3ad', '#2dd4bf', '#9aa3ad']}
                labelColor="#e8ecef"
              />
            </GizmoHelper>

            <OrbitControls
              ref={controlsRef}
              makeDefault
              enablePan
              enableZoom
              enableRotate
              minDistance={2.6}
              maxDistance={28}
              target={CAMERA_OVERVIEW_SHOT.target}
            />
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      {/* Footer Strip inside Viewport Card: Component Pills + Legend */}
      <div className="scene-footer-bar">
        <div
          className="component-selector-bar"
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

        <div className="temp-legend-container">
          {!showTemperatureLegend ? (
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
            <div className="temp-legend-row" aria-label={t.animation.tempLegend}>
              <span className="temp-legend-label">{t.animation.tempLegend}</span>
              <div className="temp-gradient-bar" />
              <div className="temp-ticks-row">
                {animParams.legendTicks.map((tick) => (
                  <span key={tick.T_K} className="temp-tick-item">
                    <span
                      className="state-dot"
                      style={{ backgroundColor: tick.colorHex }}
                    />
                    {tick.labelK} ({tick.labelC})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
