import * as THREE from "three";

interface Options {
  emissive?: number;
  roughness?: number;
  metalness?: number;
  shadows?: boolean;
}

export function prepareAsset(root: THREE.Object3D, options: Options = {}): THREE.Object3D {
  const { emissive = 0.3, roughness = 0.82, metalness = 0.08, shadows = true } = options;
  const clones = new Map<THREE.Material, THREE.Material>();

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = shadows;
    mesh.receiveShadow = shadows;
    mesh.frustumCulled = false;

    const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const prepared = source.map((material) => {
      const hit = clones.get(material);
      if (hit) return hit;
      const std = (material as THREE.MeshStandardMaterial).clone();
      std.side = THREE.DoubleSide;
      std.metalness = metalness;
      std.roughness = Math.min(1, roughness);
      if (std.map) {
        std.emissive = new THREE.Color("#ffffff");
        std.emissiveMap = std.map;
        std.emissiveIntensity = emissive;
      }
      clones.set(material, std);
      return std;
    });
    mesh.material = prepared.length === 1 ? prepared[0] : prepared;
  });

  return root;
}

export const GAME_FOV = 62;