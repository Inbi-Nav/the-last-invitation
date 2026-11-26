import { useContext, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { splitCached } from "../../utils/splitMesh";
import { StormFlashContext } from "./CinematicStorm";

const GHOST_MODEL = "/models/ghost-figures.glb";

const SPOTS: [number, number, number][] = [
  [-19, 0, -10],
  [20, 0, -16],
  [-23, 0, -28],
  [24, 0, -34],
  [-20, 0, 4],
  [21, 0, 2],
];

const GHOST_HEIGHT = 2.4;

export default function GroundGhosts() {
  const { scene } = useGLTF(GHOST_MODEL);
  const { flashing } = useContext(StormFlashContext);
  const camera = useThree((s) => s.camera);

  const pieces = useMemo(
    () => splitCached(GHOST_MODEL, scene, 4, -9).slice(0, 3),
    [scene],
  );

  const material = useMemo(() => {
    const source = pieces[0].material as THREE.MeshStandardMaterial;
    return new THREE.MeshBasicMaterial({
      map: source.map,
      color: new THREE.Color(1.3, 1.1, 1.8),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [pieces]);

  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    material.opacity = flashing.current
      ? 0.85
      : 0.32 + Math.sin(t * 0.8) * 0.06;
    groups.current.forEach((group, i) => {
      if (!group) return;
      group.position.y = 0.9 + Math.sin(t * 0.5 + i * 1.7) * 0.18;
      group.rotation.y = Math.atan2(
        camera.position.x - group.position.x,
        camera.position.z - group.position.z,
      );
    });
  });

  return (
    <>
      {SPOTS.map((spot, i) => {
        const piece = pieces[i % pieces.length];
        if (!piece) return null;
        const scale = GHOST_HEIGHT / Math.max(piece.size.z, 0.001);
        return (
          <group
            key={i}
            position={spot}
            ref={(group) => {
              groups.current[i] = group;
            }}
          >
            <mesh
              geometry={piece.geometry}
              material={material}
              rotation={[Math.PI / 2, 0, 0]}
              scale={scale}
              renderOrder={5}
            />
          </group>
        );
      })}
    </>
  );
}

useGLTF.preload(GHOST_MODEL);
