import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { splitCached } from "../../utils/splitMesh";
import type { StormState } from "../../utils/storm";

const GHOST_MODEL = "/models/ghost-figures.glb";

interface GhostSpot {
  x: number;
  z: number;
  h: number;
}

const SPOTS: GhostSpot[] = [
  { x: -13.5, z: -18, h: 4.2 },
  { x: 14.2, z: -12.5, h: 4.0 },
  { x: -20, z: -8, h: 4.3 },
  { x: 21, z: -14, h: 4.1 },
  { x: -24, z: 2, h: 4.2 },
  { x: 24, z: -2, h: 4.0 },
  { x: -15, z: 6, h: 4.3 },
  { x: 16, z: 4, h: 4.1 },
];

export default function GhostFigures({
  storm,
}: {
  storm: { current: StormState };
}) {
  const { scene } = useGLTF(GHOST_MODEL);
  const pieces = useMemo(
    () => splitCached(GHOST_MODEL, scene, 6, -9).slice(0, 6),
    [scene],
  );

  const material = useMemo(() => {
    const source = pieces[0].material as THREE.MeshStandardMaterial;
    return new THREE.MeshBasicMaterial({
      map: source.map,
      color: new THREE.Color(1.25, 1.05, 1.75),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [pieces]);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const visibility = useRef(0);
  const camera = useThree((s) => s.camera);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = storm.current.flashing ? 1 : 0;
    visibility.current += (target - visibility.current) * Math.min(1, dt * 9);
    const vis = visibility.current;
    const t = clock.elapsedTime;

    material.opacity = vis * (0.42 + Math.sin(t * 0.8) * 0.1);

    groups.current.forEach((g, i) => {
      if (!g) return;
      g.visible = vis > 0.04;
      if (!g.visible) return;
      g.rotation.y = Math.atan2(
        camera.position.x - g.position.x,
        camera.position.z - g.position.z,
      );
      g.position.y = Math.sin(t * 0.6 + i * 1.7) * 0.22;
    });
  });

  return (
    <>
      {SPOTS.map((spot, i) => {
        const piece = pieces[i % pieces.length];
        if (!piece) return null;
        const scale = spot.h / Math.max(piece.size.z, 0.001);
        return (
          <group key={i} ref={(g) => {
              groups.current[i] = g;
            }} position={[spot.x, 0, spot.z]} visible={false}>

            <mesh geometry={piece.geometry} material={material} rotation={[Math.PI / 2, 0, 0]} scale={scale} renderOrder={5}/>
          </group>
        );
      })}
    </>
  );
}

useGLTF.preload(GHOST_MODEL);
