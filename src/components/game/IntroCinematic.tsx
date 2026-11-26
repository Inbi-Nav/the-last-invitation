import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EXTERIOR_Z } from "./ExteriorSet";

const FRONT_Z = EXTERIOR_Z + 0.823 * 11.6;
const ORBIT_END = 15;
const RISE_END = 17.6;
const DESCEND_END = 22.2;
const DOLLY_END = 27.6;
const ease = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function IntroCinematic({
  onArrive,
  onStart,
}: {
  onArrive: () => void;
  onStart?: () => void;
}) {
  const camera = useThree((state) => state.camera);
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const lookAt = useMemo(() => new THREE.Vector3(), []);
  const fill = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    onStart?.();
  }, []);

  const dev = import.meta.env.DEV;
  const forced = () => {
    if (!dev) return null;
    const value = (window as unknown as Record<string, unknown>).__shotT;
    return typeof value === "number" ? value : null;
  };

  useFrame(({ clock }) => {
    if (done.current) return;
    if (start.current === null) start.current = clock.elapsedTime;
    const t = forced() ?? clock.elapsedTime - start.current;

    if (t < ORBIT_END) {
      const k = ease(t / ORBIT_END);
      const angle = k * Math.PI * 2;
      const radius = 34;
      camera.position.set(
        Math.sin(angle) * radius,
        11.5 + Math.sin(angle * 2) * 2.4 + Math.sin(t * 0.5) * 0.12,
        EXTERIOR_Z + Math.cos(angle) * radius,
      );
      lookAt.set(0, 8.2, EXTERIOR_Z);
      camera.lookAt(lookAt);
    } else if (t < RISE_END) {
      const k = ease((t - ORBIT_END) / (RISE_END - ORBIT_END));
      camera.position.set(
        0,
        11.5 + k * 13.5,
        THREE.MathUtils.lerp(EXTERIOR_Z + 34, 16, k),
      );
      lookAt.set(0, THREE.MathUtils.lerp(8.2, 9, k), EXTERIOR_Z);
      camera.lookAt(lookAt);
    } else if (t < DESCEND_END) {
      const k = ease((t - RISE_END) / (DESCEND_END - RISE_END));
      camera.position.set(
        0,
        THREE.MathUtils.lerp(25, 5.2, k),
        THREE.MathUtils.lerp(16, 7.5, k),
      );
      lookAt.set(0, THREE.MathUtils.lerp(9, 4.6, k), FRONT_Z + 2);
      camera.lookAt(lookAt);
    } else {
      const k = ease(clamp01((t - DESCEND_END) / (DOLLY_END - DESCEND_END)));
      camera.position.set(
        Math.sin(t * 0.7) * 0.05,
        THREE.MathUtils.lerp(5.2, 3.05, k),
        THREE.MathUtils.lerp(7.5, FRONT_Z + 1.6, k),
      );
      lookAt.set(0, THREE.MathUtils.lerp(4.6, 3.4, k), FRONT_Z);
      camera.lookAt(lookAt);
    }

    if (fill.current) {
      fill.current.position.set(
        camera.position.x,
        camera.position.y + 3,
        camera.position.z,
      );
    }

    if (import.meta.env.DEV) {
      const dbg = window as unknown as Record<string, unknown>;
      dbg.__t = t;
      dbg.__camPos = [camera.position.x, camera.position.y, camera.position.z];
    }

    if (forced() !== null) return;

    if (t >= DOLLY_END && !done.current) {
      done.current = true;
      onArrive();
    }
  });

  return <directionalLight ref={fill} color="#9a86dd" intensity={0.85} />;
}
