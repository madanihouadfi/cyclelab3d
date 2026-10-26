import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getPipeSegments,
  PLANT_COMPONENTS,
  temperatureToHexColor,
  type CombinedCycleResult,
  type ComponentId,
  type ComponentMeta,
  type PipeSegmentData,
} from '../physics';

interface PlantScene3DProps {
  result: CombinedCycleResult;
  selectedComponent: ComponentId;
  onSelectComponent: (id: ComponentId) => void;
  flowPlaying: boolean;
  onToggleFlow: () => void;
}

interface EquipmentMeshProps {
  meta: ComponentMeta;
  isSelected: boolean;
  colorHex: string;
  label: string;
  onSelect: () => void;
}

const EquipmentMesh: React.FC<EquipmentMeshProps> = ({
  meta,
  isSelected,
  colorHex,
  label,
  onSelect,
}) => {
  const emissiveColor = isSelected ? '#38bdf8' : colorHex;
  const emissiveIntensity = isSelected ? 0.65 : 0.18;

  const renderShape = () => {
    switch (meta.id) {
      case 'compressor':
        return (
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.55, 0.95, 2.0, 24]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
        );
      case 'combustor':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.55, 1.1, 12, 24]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.35}
              roughness={0.3}
            />
          </mesh>
        );
      case 'gasTurbine':
        return (
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.98, 0.55, 2.1, 24]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
        );
      case 'hrsg':
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2.1, 2.6, 1.6]} />
              <meshStandardMaterial
                color={colorHex}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                metalness={0.4}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
              <cylinderGeometry args={[0.32, 0.42, 1.4, 20]} />
              <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        );
      case 'steamTurbine':
        return (
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.85, 0.48, 1.9, 24]} />
            <meshStandardMaterial
              color={colorHex}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        );
      case 'condenser':
        return (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.7, 0.7, 1.8, 24]} />
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
          <mesh>
            <boxGeometry args={[1.6, 1.25, 1.25]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive={isSelected ? '#60a5fa' : '#1d4ed8'}
              emissiveIntensity={emissiveIntensity}
              metalness={0.55}
              roughness={0.25}
            />
          </mesh>
        );
    }
  };

  return (
    <group
      position={meta.position3D}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {renderShape()}
      {isSelected && (
        <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.05, 1.28, 32]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      <Html position={[0, 1.45, 0]} center distanceFactor={15}>
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

interface AnimatedPipeProps {
  seg: PipeSegmentData;
  playing: boolean;
}

const AnimatedPipe: React.FC<AnimatedPipeProps> = ({ seg, playing }) => {
  const particle1Ref = useRef<THREE.Mesh>(null);
  const particle2Ref = useRef<THREE.Mesh>(null);
  const phaseRef = useRef(0);

  const { midpoint, length, quaternion, startVec, endVec } = useMemo(() => {
    const s = new THREE.Vector3(...seg.start);
    const e = new THREE.Vector3(...seg.end);
    const dir = new THREE.Vector3().subVectors(e, s);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { midpoint: mid, length: len, quaternion: quat, startVec: s, endVec: e };
  }, [seg.start, seg.end]);

  useFrame((_, delta) => {
    if (playing) {
      phaseRef.current = (phaseRef.current + delta * seg.flowSpeed * 0.55) % 1;
    }
    const u1 = phaseRef.current;
    const u2 = (phaseRef.current + 0.5) % 1;

    if (particle1Ref.current) {
      particle1Ref.current.position.lerpVectors(startVec, endVec, u1);
    }
    if (particle2Ref.current) {
      particle2Ref.current.position.lerpVectors(startVec, endVec, u2);
    }
  });

  return (
    <group>
      <mesh position={midpoint} quaternion={quaternion}>
        <cylinderGeometry args={[0.11, 0.11, length, 12]} />
        <meshStandardMaterial
          color={seg.colorHex}
          emissive={seg.colorHex}
          emissiveIntensity={0.28}
          transparent
          opacity={0.78}
        />
      </mesh>
      <mesh ref={particle1Ref} position={seg.start}>
        <sphereGeometry args={[0.19, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={particle2Ref} position={seg.start}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color={seg.colorHex} />
      </mesh>
    </group>
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
  const pipeSegments = useMemo(() => getPipeSegments(result), [result]);

  return (
    <section className="scene-card" aria-label={t.appTitle}>
      <div className="scene-toolbar">
        <div className="temp-legend">
          <span className="temp-legend-label">{t.animation.tempLegend}</span>
          <div className="temp-gradient-bar" />
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

      <div className="canvas-wrapper">
        <Canvas camera={{ position: [0, 6.8, 12.5], fov: 44 }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[8, 14, 10]} intensity={1.15} />
          <directionalLight position={[-8, 6, -8]} intensity={0.45} />

          <gridHelper args={[20, 20, '#1e293b', '#0f172a']} position={[0, -0.75, 0]} />

          {PLANT_COMPONENTS.map((meta) => {
            const outState = result.states[meta.outletStateId];
            const colorHex = temperatureToHexColor(outState.T_K);
            return (
              <EquipmentMesh
                key={meta.id}
                meta={meta}
                isSelected={selectedComponent === meta.id}
                colorHex={colorHex}
                label={t.components[meta.id].name}
                onSelect={() => onSelectComponent(meta.id)}
              />
            );
          })}

          {pipeSegments.map((seg) => (
            <AnimatedPipe key={seg.id} seg={seg} playing={flowPlaying} />
          ))}

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={5}
            maxDistance={24}
            target={[0, 0.8, 0]}
          />
        </Canvas>
      </div>

      <div className="component-Invalid-selector-bar" role="tablist" aria-label={t.components.selectedTitle}>
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
