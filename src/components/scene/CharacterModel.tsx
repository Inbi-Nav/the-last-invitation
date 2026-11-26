
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CHARACTERS, getCharacter, type CharacterId } from "../../data/characters";

function prepare(source: THREE.Object3D) {
  const model = clone(source);

  model.updateMatrixWorld(true);

  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    const mats = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    mats.forEach((m) => {
      const std = m as THREE.MeshStandardMaterial;

      if ("metalness" in std) {
        std.metalnessMap = null;
        std.metalness = 0.08;
        std.roughness = Math.min(std.roughness, 0.85);

        if (std.normalScale) {
          std.normalScale.set(0.3, 0.3);
        }

        std.needsUpdate = true;
      }
    });
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());

  return {
    model,
    height: size.y || 1,
    minY: box.min.y,
  };
}

export default function CharacterModel({
  id,
  height,
  yaw = 0,
  breathe = true,
}: {
  id: CharacterId;
  height: number;
  yaw?: number;
  breathe?: boolean;
}) {
  const { scene } = useGLTF(getCharacter(id).model);
  const prepared = useMemo(() => prepare(scene), [scene]);
  const inner = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!inner.current || !breathe) return;

    inner.current.scale.y =
      1 + Math.sin(clock.elapsedTime * 1.6) * 0.003;
  });

  const s = height / prepared.height;

  return (
    <group scale={s} rotation={[0, yaw, 0]}>
      <group ref={inner}>
        <group
          rotation={[0, Math.PI / 2, 0]}
          position={[0, -prepared.minY, 0]}
        >
          <primitive object={prepared.model} />
        </group>
      </group>
    </group>
  );
}

export const preloadCharacters = () =>
  CHARACTERS.forEach((c) => useGLTF.preload(c.model));