import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { fitModel } from "../../utils/fitModel";

const MODELS = {
  mansion: "/models/mansion.glb",
  path: "/architecture/outside-path.glb",
  railing: "/architecture/outside-railing.glb",
  lamp: "/architecture/lamp.glb",
};

// Scene layout (world units)
export const LAYOUT = {
  mansionX: 3.4,
  mansionHeight: 12,
  pathLength: 8,
  lampHeight: 2.6,
};

const WINDOW_HINTS = ["window", "glass", "vidrio", "ventana", "light", "emiss"];

function Mansion() {
  const { scene } = useGLTF(MODELS.mansion);
  const model = useMemo(() => {
    const m = fitModel(scene, LAYOUT.mansionHeight, "height");
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        const name = `${std.name} ${mesh.name}`.toLowerCase();
        if (WINDOW_HINTS.some((h) => name.includes(h)) && "emissive" in std) {
          std.emissive = new THREE.Color("#ff3fbf");
          std.emissiveIntensity = 2.2;
        }
      });
    });
    return m;
  }, [scene]);

  const depth = (model.userData.dims as THREE.Vector3).z;
  return (
    <group position={[LAYOUT.mansionX, 0, -depth / 2]}>
      <primitive object={model} />
      {/* Window glow from inside */}
      {[-3, 0, 3].map((x) =>
        [2, 5.5].map((y) => (
          <pointLight key={`${x}-${y}`} position={[x, y, depth / 2 - 0.6]} color="#ff40c8" intensity={6} distance={6} decay={1.6} />
        )),
      )}
    </group>
  );
}

function Path() {
  const { scene } = useGLTF(MODELS.path);
  const model = useMemo(() => {
    const raw = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
    const m = fitModel(scene, LAYOUT.pathLength, "length");
    if (raw.x > raw.z) m.children[0].rotation.y = Math.PI / 2;
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if ("roughness" in mat) mat.roughness = Math.min(mat.roughness, 0.45);
      }
    });
    return m;
  }, [scene]);
  return <primitive object={model} position={[LAYOUT.mansionX, 0.02, LAYOUT.pathLength / 2 + 0.5]} />;
}

function Railings() {
  const { scene } = useGLTF(MODELS.railing);
  const [left, right] = useMemo(() => {
    const a = fitModel(scene, 1.7, "height");
    const b = fitModel(scene, 1.7, "height");
    return [a, b];
  }, [scene]);
  return (
    <>
      <primitive object={left} position={[-2.6, 0, 10.5]} rotation={[0, Math.PI / 2.4, 0]} />
      <primitive object={right} position={[8.4, 0, 11]} rotation={[0, -Math.PI / 2.4, 0]} />
    </>
  );
}

function Lamps() {
  const { scene } = useGLTF(MODELS.lamp);
  const spots: [number, number][] = [
    [LAYOUT.mansionX - 2, 0.9],
    [LAYOUT.mansionX + 2, 0.9],
    [LAYOUT.mansionX + 4.6, 10.5],
  ];
  const lamps = useMemo(() => spots.map(() => fitModel(scene, LAYOUT.lampHeight, "height")), [scene]);
  const lights = useRef<THREE.PointLight[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    lights.current.forEach((l, i) => {
      if (l) l.intensity = 9 + Math.sin(t * 7 + i * 2) * 0.8 + Math.sin(t * 13 + i) * 0.5;
    });
  });
  return (
    <>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <primitive object={lamps[i]} />
          <pointLight
            ref={(l) => { if (l) lights.current[i] = l; }}
            position={[0, LAYOUT.lampHeight * 0.85, 0.2]}
            color="#ffa040"
            distance={7}
            decay={1.5}
          />
          <mesh position={[0, LAYOUT.lampHeight * 0.85, 0]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function MansionScene({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <>
      <Mansion />
      <Path />
      <Railings />
      <Lamps />
    </>
  );
}

Object.values(MODELS).forEach((url) => useGLTF.preload(url));
