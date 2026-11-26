import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { prepareAsset } from "../../game/prepareAsset";
import { EXTERIOR_SCALE, EXTERIOR_Z } from "./ExteriorSet";

const FRONT_Z = EXTERIOR_Z + 0.823 * EXTERIOR_SCALE;
const PANEL_W = 1.25;
const DOOR_H = 3.4;
const BASE_Y = 1.5;
const OPEN_ANGLE = THREE.MathUtils.degToRad(105);
const OPEN_TIME = 2.2;
const TRIGGER_Z = FRONT_Z + 6.5;

export default function EntranceDoors() {
  const { scene } = useGLTF("/architecture/doors.glb");
  const left = useMemo(
    () => prepareAsset(scene.clone(true), { emissive: 0.5, roughness: 0.85 }),
    [scene],
  );
  const right = useMemo(
    () => prepareAsset(scene.clone(true), { emissive: 0.5, roughness: 0.85 }),
    [scene],
  );
  const camera = useThree((s) => s.camera);
  const hingeL = useRef<THREE.Group>(null);
  const hingeR = useRef<THREE.Group>(null);
  const triggered = useRef(false);
  const open = useRef(0);

  useFrame((_, delta) => {
    if (!triggered.current && camera.position.z < TRIGGER_Z) {
      triggered.current = true;
    }
    if (triggered.current && open.current < 1) {
      open.current = Math.min(1, open.current + delta / OPEN_TIME);
      const k = open.current * open.current * (3 - 2 * open.current);
      const angle = k * OPEN_ANGLE;
      if (hingeL.current) hingeL.current.rotation.y = angle;
      if (hingeR.current) hingeR.current.rotation.y = -angle;
    }
  });

  return (
    <group position={[0, BASE_Y, FRONT_Z + 0.12]}>
      <group ref={hingeL} position={[-PANEL_W / 2, 0, 0]}>
        <group position={[PANEL_W / 2, 0, 0]} scale={[PANEL_W, DOOR_H, 0.18]}>
          <primitive object={left} />
        </group>
      </group>
      <group ref={hingeR} position={[PANEL_W / 2, 0, 0]}>
        <group position={[-PANEL_W / 2, 0, 0]} scale={[-PANEL_W, DOOR_H, 0.18]}>
          <primitive object={right} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/architecture/doors.glb");
