import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { prepareAsset } from "../../game/prepareAsset";
import Vegetation from "./Vegetation";
import ExteriorFence from "./ExteriorFence";
import {
  makeGroundTexture,
  makeGlowTexture,
  makeStoneTexture,
} from "../../utils/textures";

export const EXTERIOR_SCALE = 11.6;
export const EXTERIOR_Z = -34;
const FRONT_Z = EXTERIOR_Z + 0.823 * EXTERIOR_SCALE;

function useFog(color: string, near: number, far: number) {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const previous = scene.fog;
    scene.fog = new THREE.Fog(color, near, far);
    return () => {
      scene.fog = previous;
    };
  }, [scene, color, near, far]);
}

function Sky() {
  const gradient = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#05040c");
    grad.addColorStop(0.45, "#141024");
    grad.addColorStop(0.72, "#2a1b3a");
    grad.addColorStop(0.9, "#452c4a");
    grad.addColorStop(1, "#5c3a4c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  const stars = useMemo(() => {
    const count = 1100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.15 + u * 0.82);
      const r = 165;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.abs(Math.cos(phi)) * r;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  return (
    <>
      <mesh scale={[1, 1, 1]} renderOrder={-2}>
        <sphereGeometry args={[185, 32, 20]} />
        <meshBasicMaterial map={gradient} side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false}/>
      </mesh>

      <points geometry={stars} renderOrder={-1}>
        <pointsMaterial color="#ccd4ff" size={1.7} sizeAttenuation={false} transparent opacity={0.72} fog={false} toneMapped={false} depthWrite={false}/>

      </points>
    </>
  );
}

function Mansion() {
  const { scene } = useGLTF("/models/mansion.glb");
  const model = useMemo(
    () => prepareAsset(scene.clone(true), { emissive: 0.78, roughness: 0.86 }),
    [scene],
  );
  return (
    <group position={[0, 0, EXTERIOR_Z]} scale={EXTERIOR_SCALE}>
      <primitive object={model} />
    </group>
  );
}

function Ground() {
  const texture = useMemo(() => makeGroundTexture(), []);
  const cobbles = useMemo(() => makeStoneTexture(64), []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -18]} receiveShadow>
        <planeGeometry args={[220, 200]} />
        <meshStandardMaterial map={texture} color="#1a1118" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, -9]} receiveShadow>
        <planeGeometry args={[6.6, 34]} />
        <meshStandardMaterial map={cobbles} color="#4a3a3a" roughness={0.95} />
      </mesh>
      {[-3.45, 3.45].map((x) => (
        <mesh key={x} position={[x, 0.09, -9]} receiveShadow castShadow>
          <boxGeometry args={[0.3, 0.18, 34]} />
          <meshStandardMaterial color="#2a2026" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

function Approach() {
  return <ExteriorFence />;
}

const MOON_POSITION: [number, number, number] = [26, 54, -148];

function Moon() {
  const { scene } = useGLTF("/architecture/moon.glb");
  const model = useMemo(() => {
    const prepared = prepareAsset(scene.clone(true), {
      emissive: 1.7,
      shadows: false,
    });
    prepared.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        materials.forEach((material) => {
          (material as THREE.Material & { fog?: boolean }).fog = false;
          material.depthWrite = false;
        });
        mesh.renderOrder = -1;
      }
    });
    return prepared;
  }, [scene]);
  const halo = useMemo(
    () => makeGlowTexture("rgba(210,220,255,0.9)", "rgba(110,130,215,0)"),
    [],
  );
  const core = useMemo(
    () => makeGlowTexture("rgba(255,250,232,0.95)", "rgba(180,190,240,0)"),
    [],
  );
  return (
    <group position={MOON_POSITION}>
      <group scale={13} rotation={[0, -0.4, 0]}>
        <primitive object={model} />
      </group>
      <sprite scale={[46, 46, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false}/>
      </sprite>
      <sprite scale={[19, 19, 1]}>
        <spriteMaterial map={core} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false}/>

      </sprite>
      <pointLight color="#c9d6ff" intensity={340} distance={110} decay={1.2} />
    </group>
  );
}

function ExteriorLights() {
  return (
    <>
      <hemisphereLight args={["#6b5a9e", "#1a1020", 1.55]} />

      <ambientLight color="#7a6a9c" intensity={0.7} />

      <directionalLight position={[38, 46, -66]} color="#d3dcff" intensity={3.1} castShadow shadow-mapSize={[1024, 1024]}>

        <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 1, 120]}/>
      </directionalLight>
      {}

      <pointLight
        position={[0, 4.6, FRONT_Z + 2]} color="#ffc282" intensity={150} distance={30} decay={1.6}/>

      <pointLight position={[0, 3.2, FRONT_Z + 6]} color="#ffd9a0" intensity={60} distance={20} decay={1.7}/>

      {}
      <pointLight position={[-7, 2.4, FRONT_Z + 1.4]} color="#ffb877" intensity={70} distance={16} decay={1.7}/>

      <pointLight position={[7, 2.4, FRONT_Z + 1.4]} color="#ffb877" intensity={70} distance={16} decay={1.7}/>

      <pointLight position={[0, 8, -18]} color="#9a7bff" intensity={45} distance={30} decay={1.8}/>
    </>
  );
}

export default function ExteriorSet() {
  useFog("#191024", 24, 165);
  return (
    <>
      <Sky />
      <ExteriorLights />
      <Mansion />
      <Ground />
      <Approach />
      <Vegetation />
      <Moon />
    </>
  );
}

useGLTF.preload("/models/mansion.glb");
useGLTF.preload("/architecture/outside-railing.glb");
useGLTF.preload("/architecture/moon.glb");
