import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Safely merges an array of static BufferGeometries into a single BufferGeometry
 * and disposes the temporary source geometries to minimize WebGL draw calls.
 */
export function mergeStaticParts(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const normalized = geometries.map((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g.clone();
    if (!nonIndexed.attributes.normal) {
      nonIndexed.computeVertexNormals();
    }
    // Strip UV if missing on some primitives so mergeGeometries attributes match
    if (nonIndexed.attributes.uv) {
      nonIndexed.deleteAttribute('uv');
    }
    return nonIndexed;
  });

  const merged = mergeGeometries(normalized, false);
  for (const g of geometries) {
    g.dispose();
  }
  for (const n of normalized) {
    n.dispose();
  }
  merged.computeVertexNormals();
  return merged;
}

export interface ProceduralTextureSet {
  brushedMetalRoughness: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  gratingMap: THREE.CanvasTexture;
}

let cachedTextures: ProceduralTextureSet | null = null;

/**
 * Generates lightweight in-memory procedural CanvasTextures (no external image files)
 * for brushed/weathered metal, poured concrete pads, and galvanized steel grating.
 */
export function getProceduralTextures(): ProceduralTextureSet {
  if (cachedTextures) return cachedTextures;

  if (typeof document === 'undefined') {
    const dummy = new THREE.CanvasTexture(
      null as unknown as HTMLCanvasElement,
    );
    cachedTextures = {
      brushedMetalRoughness: dummy,
      concreteBump: dummy,
      gratingMap: dummy,
    };
    return cachedTextures;
  }

  // 1. Brushed & subtly weathered metal roughness map (64x64)
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 64;
  metalCanvas.height = 64;
  const mCtx = metalCanvas.getContext('2d');
  if (mCtx) {
    mCtx.fillStyle = '#888888';
    mCtx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y++) {
      const shade = 110 + ((y * 17) % 45);
      mCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
      mCtx.fillRect(0, y, 64, 1);
    }
    // Subtle wear bands
    mCtx.fillStyle = 'rgba(60, 60, 60, 0.25)';
    mCtx.fillRect(12, 0, 6, 64);
    mCtx.fillRect(44, 0, 8, 64);
  }
  const brushedMetalRoughness = new THREE.CanvasTexture(metalCanvas);
  brushedMetalRoughness.wrapS = THREE.RepeatWrapping;
  brushedMetalRoughness.wrapT = THREE.RepeatWrapping;
  brushedMetalRoughness.repeat.set(3, 3);

  // 2. Concrete grain & expansion joint bump map (64x64)
  const concCanvas = document.createElement('canvas');
  concCanvas.width = 64;
  concCanvas.height = 64;
  const cCtx = concCanvas.getContext('2d');
  if (cCtx) {
    cCtx.fillStyle = '#808080';
    cCtx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 240; i++) {
      const x = (i * 29) % 64;
      const y = (i * 43) % 64;
      const v = 100 + ((i * 19) % 55);
      cCtx.fillStyle = `rgb(${v},${v},${v})`;
      cCtx.fillRect(x, y, 2, 2);
    }
    cCtx.strokeStyle = '#505050';
    cCtx.lineWidth = 1;
    cCtx.strokeRect(1, 1, 62, 62);
  }
  const concreteBump = new THREE.CanvasTexture(concCanvas);
  concreteBump.wrapS = THREE.RepeatWrapping;
  concreteBump.wrapT = THREE.RepeatWrapping;
  concreteBump.repeat.set(4, 4);

  // 3. Galvanized steel grating texture (64x64)
  const gratCanvas = document.createElement('canvas');
  gratCanvas.width = 64;
  gratCanvas.height = 64;
  const gCtx = gratCanvas.getContext('2d');
  if (gCtx) {
    gCtx.fillStyle = '#334155';
    gCtx.fillRect(0, 0, 64, 64);
    gCtx.strokeStyle = '#94a3b8';
    gCtx.lineWidth = 2;
    for (let p = 0; p < 64; p += 8) {
      gCtx.beginPath();
      gCtx.moveTo(p, 0);
      gCtx.lineTo(p, 64);
      gCtx.stroke();
      gCtx.beginPath();
      gCtx.moveTo(0, p);
      gCtx.lineTo(64, p);
      gCtx.stroke();
    }
  }
  const gratingMap = new THREE.CanvasTexture(gratCanvas);
  gratingMap.wrapS = THREE.RepeatWrapping;
  gratingMap.wrapT = THREE.RepeatWrapping;
  gratingMap.repeat.set(6, 2);

  cachedTextures = {
    brushedMetalRoughness,
    concreteBump,
    gratingMap,
  };
  return cachedTextures;
}
