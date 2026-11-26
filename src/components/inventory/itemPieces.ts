import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ITEMS_MODEL, ITEMS_PIECE_COUNT } from "../../data/items";
import { splitCached, type MeshPiece } from "../../utils/splitMesh";

let shared: THREE.MeshStandardMaterial | null = null;
function itemMaterial(source: THREE.Material) {
  if (!shared) {
    shared = (source as THREE.MeshStandardMaterial).clone();
    shared.metalnessMap = null; 
    shared.metalness = 0.25;
    shared.roughness = 0.7;
    shared.side = THREE.DoubleSide;
    shared.needsUpdate = true;
  }
  return shared;
}

export interface ItemPiece extends MeshPiece {
  material: THREE.MeshStandardMaterial;
}

export function useItemPieces(): ItemPiece[] {
  const { scene } = useGLTF(ITEMS_MODEL);
  return useMemo(
    () =>
      splitCached(ITEMS_MODEL, scene, ITEMS_PIECE_COUNT, -0.5).map((p) => ({
        ...p,
        material: itemMaterial(p.material),
      })),
    [scene],
  );
}

export const fitScale = (piece: MeshPiece, box: number) => box / Math.max(piece.size.x, piece.size.z);

export function renderThumbnails(pieces: ItemPiece[], px = 200): string[] {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(px, px, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#ffffff", "#7a6a8a", 2.2));
  const key = new THREE.DirectionalLight("#fff0dd", 2.4);
  key.position.set(1, 1.5, 2.5);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  cam.position.set(0, 0, 3.6);

  const urls = pieces.map((p) => {
    const mesh = new THREE.Mesh(p.geometry, p.material);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.setScalar(fitScale(p, 1.9));
    scene.add(mesh);
    renderer.render(scene, cam);
    const url = renderer.domElement.toDataURL("image/png");
    scene.remove(mesh);
    return url;
  });

  renderer.dispose();
  renderer.forceContextLoss();
  return urls;
}