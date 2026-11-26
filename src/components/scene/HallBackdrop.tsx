import {createContext, useContext, useLayoutEffect, useMemo,useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { sound } from "../../audio/SoundEngine";
import { createStorm, stepStorm, STORM, type StormState} from "../../utils/storm";
import type { CamCfg } from "./placement";

export const HALL_MODEL = "/models/mansion-int.glb";

interface HallCtx {
  scene: THREE.Object3D;
  storm: React.RefObject<StormState>;
}

const HallContext = createContext<HallCtx | null>(null);
export const useHall = () => {
  const v = useContext(HallContext);
  if (!v) throw new Error("useHall must be used inside <HallBackdrop>");
  return v;
};

function CameraRig({ cam }: { cam: CamCfg }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.fov = cam.fov;
    camera.lookAt(...cam.look);
    camera.updateProjectionMatrix();
  }, [camera, cam]);
  return null;
}

const BASE_GLOW = 0.34;
const CANDLES: [number, number, number][] = [
  [-0.62, 0.16, 0.25],
  [0.22, 0.16, 0.25],
  [-0.5, 0.2, -0.3],
  [0.1, 0.2, -0.3],
  [-0.2, 0.5, -0.1],
];

export default function HallBackdrop({
  cam,
  children,
  thunder = true,
}: {
  cam: CamCfg;
  children?: ReactNode;
  thunder?: boolean;
}) {
  const { scene } = useGLTF(HALL_MODEL);
  const storm = useRef<StormState>(createStorm());
  const flash = useRef<THREE.DirectionalLight>(null);
  const flashFill = useRef<THREE.PointLight>(null);
  const candles = useRef<THREE.PointLight[]>([]);

  const material = useMemo(() => {
    let mat: THREE.MeshStandardMaterial | null = null;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !mat) {
        mat = m.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color("#ffffff");
        mat.emissiveMap = mat.map;
        mat.emissiveIntensity = BASE_GLOW;
        mat.color = new THREE.Color("#b08fff"); 
        mat.needsUpdate = true;
      }
    });
    return mat as THREE.MeshStandardMaterial | null;
  }, [scene]);

  useFrame(({ clock }, delta) => {
    const i = stepStorm(storm.current, Math.min(delta, 0.1), () => {
      if (!thunder) return;
      sound.thunder(0.05);
      sound.thunder(1.2);
    });
    const lit = i >= STORM.flashIntensity;
    if (flash.current) flash.current.intensity = i * 0.5;
    if (flashFill.current)
      flashFill.current.intensity = lit ? 6 : i > 0 ? 0.4 : 0;
    if (material)
      material.emissiveIntensity = lit ? BASE_GLOW + 0.5 : BASE_GLOW;
    const t = clock.elapsedTime;
    candles.current.forEach((l, k) => {
      if (l)
        l.intensity =
          0.9 + Math.sin(t * 7 + k * 2) * 0.1 + Math.sin(t * 13 + k) * 0.06;
    });
  });

  return (
    <HallContext.Provider value={{ scene, storm }}>
      <color attach="background" args={["#0d0716"]}/>

      <CameraRig cam={cam} />
      <hemisphereLight args={["#a98bff", "#c04aa0", 1.45]}/>
      <ambientLight color="#9a70ff" intensity={0.55}/>
      <directionalLight position={[0.5, 1, 2]} color="#ffd2a0" intensity={0.9}/>
      <directionalLight ref={flash} position={[-0.2, 0.7, -0.6]} color="#d1d9ff" intensity={0}/>
      <pointLight ref={flashFill} position={[-0.2, 0.3, 0.3]} color="#cfd6ff" intensity={0} distance={2} decay={1.5}/>

      {CANDLES.map((p, k) => (
        <pointLight key={k} ref={(l) => {
            if (l) candles.current[k] = l;
          }}
          position={p} color="#ffa850" distance={0.9} decay={1.6}/>
      ))}

      <pointLight position={[-0.2, 0.32, -0.55]} color="#b24dff" intensity={2.4} distance={1.6} decay={1.4}/>

      <pointLight position={[-0.2, 0.5, -0.1]} color="#ffbf6a" intensity={1.1} distance={1.4} decay={1.5}/>

      <pointLight position={[-0.75, 0.25, 0.1]} color="#ff4fa6" intensity={0.35} distance={1.1} decay={1.5}/>

      <pointLight position={[0.35, 0.25, 0.1]} color="#7a5cff" intensity={0.35} distance={1.1} decay={1.5}/>
      <primitive object={scene} />
      {children}
    </HallContext.Provider>
  );
}

useGLTF.preload(HALL_MODEL);