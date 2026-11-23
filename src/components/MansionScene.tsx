import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import MansionEnvironment from "./MansionEnvironment";

const MANSION_SCALE = 7;
const MANSION_X = 3.2;
const CAMERA_DISTANCE = 13.8;
const CAMERA_SIDE_OFFSET = 2.8;

interface Props {
  flashRef: RefObject<HTMLDivElement | null>;
}

export default function MansionScene({ flashRef }: Props) {
  const { scene } = useGLTF("/models/mansion.glb");
  const { camera } = useThree();

  const { mansion, bounds } = useMemo(() => {
    const mansion = scene.clone(true);
    mansion.scale.setScalar(MANSION_SCALE);
    mansion.position.x = MANSION_X;
    mansion.updateMatrixWorld(true);
    return { mansion, bounds: new THREE.Box3().setFromObject(mansion) };
  }, [scene]);

  const center = useMemo(() => bounds.getCenter(new THREE.Vector3()), [bounds]);
  const size = useMemo(() => bounds.getSize(new THREE.Vector3()), [bounds]);
  const groundY = bounds.min.y;
  const frontZ = bounds.max.z;

  const cameraTarget = useMemo(() => new THREE.Vector3(
    center.x - CAMERA_SIDE_OFFSET,
    groundY + size.y * 0.5,
    center.z + 0.7
  ), [center, groundY, size.y]);

  const cameraBase = useMemo(() => new THREE.Vector3(
    center.x - CAMERA_SIDE_OFFSET,
    groundY + size.y * 0.55,
    frontZ + CAMERA_DISTANCE
  ), [center, groundY, size.y, frontZ]);

  const lightning = useRef<THREE.DirectionalLight>(null);
  const flashAmount = useRef(0);
  const nextFlash = useRef(12);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    camera.position.set(
      cameraBase.x + Math.sin(t * 0.045) * 0.12,
      cameraBase.y + Math.sin(t * 0.04) * 0.06,
      cameraBase.z
    );
    camera.lookAt(cameraTarget);

    nextFlash.current -= delta;
    if (nextFlash.current <= 0) {
      flashAmount.current = 1;
      nextFlash.current = 13 + Math.random() * 15;
    }
    flashAmount.current = Math.max(0, flashAmount.current - delta * 1.8);
    if (lightning.current) lightning.current.intensity = flashAmount.current * 2.6;
    if (flashRef.current) flashRef.current.style.opacity = String(flashAmount.current * 0.09);
  });

  return (
    <>
      <color attach="background" args={["#171122"]} />

      <fog attach="fog" args={["#171122", 27, 67]} />

      <ambientLight intensity={0.9} color="#aaa0be" />

      <hemisphereLight args={["#adb4db", "#3d284a", 1.15]} />

      <directionalLight position={[center.x - 5, groundY + 16, frontZ + 11]} intensity={1.7} color="#b8b9d9"/>

      <directionalLight position={[center.x + 6, groundY + 8, frontZ + 8]} intensity={0.9} color="#a673b9"/>

      <pointLight position={[center.x, groundY + 3.2, frontZ + 2]} color="#ffae6e" intensity={18} distance={12} decay={2}/>

      <pointLight position={[center.x - 3.5, groundY + 5, frontZ + 2]} color="#c262de" intensity={10} distance={11} decay={2}/>

      <pointLight position={[center.x + 3.5, groundY + 5, frontZ + 2]} color="#a64add" intensity={10} distance={11} decay={2}/>

      <directionalLight ref={lightning} position={[-8, 22, 8]} intensity={0} color="#dce2ff"/>

      <primitive object={mansion} />
      <MansionEnvironment centerX={center.x} centerZ={center.z} frontZ={frontZ} groundY={groundY} mansionHeight={size.y}/>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center.x, groundY - 0.06, frontZ + 3]}>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color="#191322" roughness={0.75} metalness={0.08} />
      </mesh>
    </>
  );
}

useGLTF.preload("/models/mansion.glb");