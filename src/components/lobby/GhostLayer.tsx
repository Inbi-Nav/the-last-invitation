import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { splitCached } from "../../utils/splitMesh";
import { useHall } from "../scene/HallBackdrop";
import { buildCamera, type CamCfg } from "../scene/placement";
const GHOST_MODEL = "/models/ghost-figures.glb";
const DEBUG_GHOSTS = false;

interface Slot {
  u: number;
  v: number;
  h: number;
  off: number;
}

interface Placed {
  position: THREE.Vector3;
  height: number;
}

const LOBBY_SLOTS: Slot[] = [
  { u: 0.66, v: 0.47, h: 0.31, off: -0.06 },
  { u: 0.3, v: 0.37, h: 0.2, off: -0.06 },
  { u: 0.5, v: 0.4, h: 0.3, off: -0.06 },
];

const INVENTORY_SLOTS: Slot[] = [
  { u: 0.53, v: 0.45, h: 0.2, off: -0.06 },
  { u: 0.81, v: 0.45, h: 0.2, off: -0.06 },
  { u: 0.70, v: 0.50, h: 0.30, off: -0.06 },
  
];

interface GhostLayerProps {
  cam: CamCfg;
  mode?: "lobby" | "inventory";
}

export default function GhostLayer({ cam, mode = "lobby" }: GhostLayerProps) {
  const { scene: hall, storm } = useHall();
  const size = useThree((state) => state.size);

  const { scene } = useGLTF(GHOST_MODEL);

  const slots = mode === "inventory" ? INVENTORY_SLOTS : LOBBY_SLOTS;

  const slotsVersion = JSON.stringify(slots);

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
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [pieces]);

  const [placed, setPlaced] = useState<Placed[]>([]);

  useEffect(() => {
    const camera = buildCamera(cam, size.width / size.height);
    const raycaster = new THREE.Raycaster();
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const positions = slots.map((slot) => {
      raycaster.setFromCamera(
        new THREE.Vector2(slot.u * 2 - 1, 1 - slot.v * 2),
        camera,
      );

      const hit = raycaster.intersectObject(hall, true)[0];
      const distance = Math.max(0.1, (hit ? hit.distance : 0.9) + slot.off);
      const depth = distance * raycaster.ray.direction.dot(forward);
      const position = raycaster.ray.at(distance, new THREE.Vector3());
      return {
        position,
        height: slot.h * 2 * halfHeight * depth,
      };
    });

    setPlaced(positions);
  }, [cam, hall, size.width, size.height, slotsVersion]);

  const ghosts = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ camera }) => {

    const visible = DEBUG_GHOSTS || storm.current.flashing;
    ghosts.current.forEach((ghost) => {
      
      if (!ghost) return;

      ghost.visible = visible;

      if (visible) {
        ghost.rotation.y = Math.atan2(
          camera.position.x - ghost.position.x,
          camera.position.z - ghost.position.z,
        );
      }
    });
  });

  return (
    <>
      {placed.map((placement, index) => {
        const piece = pieces[index];
        if (!piece) return null;
        const scale = placement.height / Math.max(piece.size.z, 0.001);
        return (
          <group key={`${mode}-${index}`}
           ref={(group) => {
              ghosts.current[index] = group;
            }}
            position={placement.position}
            visible={false}>
            <mesh geometry={piece.geometry} material={material} rotation={[Math.PI / 2, 0, 0]} scale={scale} renderOrder={5}/>
          </group>
        );
      })}
    </>
  );
}

useGLTF.preload(GHOST_MODEL);