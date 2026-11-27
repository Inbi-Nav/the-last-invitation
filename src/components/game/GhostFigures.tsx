import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { splitCached } from "../../utils/splitMesh";
import type { StormState } from "../../utils/storm";

const GHOST_MODEL = "/models/ghost-figures-1.glb";
const GHOST_COUNT = 10;
const DEBUG_GHOSTS = false;
const FREEZE_GHOSTS = false;
interface GhostSpot {
  id: string;
  figure: number;
  x: number;
  y: number;
  z: number;
  h: number;
  rotation: number;
}

const SPOTS: GhostSpot[] = [
  { id: "Ghost 1", figure: 0, x: -0.5, y: 0, z: -20, h: 6, rotation: 0,},

  {  id: "Ghost 3", figure: 2, x: -10, y: 0, z: -8, h: 6, rotation: 0,},

  { id: "Ghost 4", figure: 3, x: -25, y: 2, z: -44, h: 6, rotation: 0,},

  { id: "Ghost 5", figure: 4, x: 25, y: 5, z: -50, h: 10, rotation: 0,},
  
  { id: "Ghost 6", figure: 5, x: -0.5, y: 10, z: -30, h: 16, rotation: 0,},

  { id: "Ghost 8", figure: 7, x: 16, y: 0, z: 4, h: 17, rotation: 0,},

  { id: "Ghost 9", figure: 8, x: -60,  y: 1, z: -55, h: 10, rotation: 0,},

  { id: "Ghost 10", figure: 9, x: 30, y: 0, z: -25, h: 10, rotation: 0,},
];

export default function GhostFigures({
  storm,
}: {
  storm: { current: StormState };
}) {
  const { scene } = useGLTF(GHOST_MODEL);
  const camera = useThree((state) => state.camera);

  const pieces = useMemo(
    () => splitCached(GHOST_MODEL, scene, GHOST_COUNT, -9),
    [scene],
  );

  // Material
  const material = useMemo(() => {
    const source = pieces[0]?.material as
      | THREE.MeshStandardMaterial
      | undefined;

    return new THREE.MeshBasicMaterial({
      map: source?.map ?? null,
      color: new THREE.Color(1.25, 1.05, 1.75),
      transparent: true,
      opacity: DEBUG_GHOSTS ? 0.85 : 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [pieces]);

  const groups = useRef<(THREE.Group | null)[]>([]);
  const visibility = useRef(DEBUG_GHOSTS ? 1 : 0);


  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    const target = DEBUG_GHOSTS || storm.current.flashing ? 1 : 0;

    visibility.current += (target - visibility.current) * Math.min(1, dt * 9);

    const vis = visibility.current;

    material.opacity = FREEZE_GHOSTS
      ? vis * 0.85
      : vis * (0.42 + Math.sin(time * 0.8) * 0.1);

    groups.current.forEach((group, index) => {
      if (!group) return;

      const spot = SPOTS[index];

      group.visible = DEBUG_GHOSTS || vis > 0.04;

      if (!group.visible) return;

      group.position.x = spot.x;
      group.position.z = spot.z;

      if (FREEZE_GHOSTS) {
        group.position.y = spot.y;
        group.rotation.y = THREE.MathUtils.degToRad(spot.rotation);
      } else {
        group.position.y = spot.y + Math.sin(time * 0.6 + index * 1.7) * 0.22;

        group.rotation.y = Math.atan2(
          camera.position.x - group.position.x,
          camera.position.z - group.position.z,
        );
      }
    });
  });

  return (
    <>
      {SPOTS.map((spot, index) => {
        const piece = pieces[spot.figure];

        if (!piece) return null;

        const scale = spot.h / Math.max(piece.size.z, 0.001);

        return (
          <group
            key={spot.id}
            name={spot.id}
            ref={(group) => {
              groups.current[index] = group;
            }}
            position={[spot.x, spot.y, spot.z]}
            rotation={[0, THREE.MathUtils.degToRad(spot.rotation), 0]}
            visible={DEBUG_GHOSTS}
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
