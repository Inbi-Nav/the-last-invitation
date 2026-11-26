import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EXTERIOR_SCALE, EXTERIOR_Z } from "./ExteriorSet";

const FRONT_Z = EXTERIOR_Z + 0.823 * EXTERIOR_SCALE;
const PUSH_TIME = 2.6;
const ease = (t: number) => t * t * (3 - 2 * t);

export default function EntranceTransition({
  onWhite,
}: {
  onWhite: () => void;
}) {
  const camera = useThree((s) => s.camera);
  const light = useRef<THREE.PointLight>(null);
  const t = useRef(0);
  const fired = useRef(false);

  useFrame((_, delta) => {
    t.current = Math.min(1, t.current + delta / PUSH_TIME);
    const k = ease(t.current);

    camera.position.z = THREE.MathUtils.lerp(FRONT_Z + 1.6, FRONT_Z - 0.4, k);
    camera.position.y = THREE.MathUtils.lerp(3.05, 3.2, k);
    camera.position.x = Math.sin(t.current * 2.2) * 0.04;
    camera.lookAt(0, 3.25, FRONT_Z - 3);

    if (light.current) light.current.intensity = 340 * k;

    if (k >= 0.55 && !fired.current) {
      fired.current = true;
      onWhite();
    }
  });

  return (
    <pointLight ref={light} position={[0, 3.3, FRONT_Z - 0.8]} color="#fff1d8" intensity={0} distance={32} decay={1.4}/>
  );
}
