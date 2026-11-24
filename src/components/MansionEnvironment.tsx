import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { fitModel } from "../utils/fitModel";
import {
  makeBranchTexture,
  makeCloudTexture,
  makeGlowTexture,
  makeGroundTexture,
} from "../utils/textures";
import FlyingBirds from "./FlyingBirds";

const MOON_POS = new THREE.Vector3(-1.2, 20.5, -24);

function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {},
        vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP; void main(){
          float h = clamp(vP.y*1.4+0.1, 0.0, 1.0);
          vec3 horizon = vec3(0.30,0.14,0.36);
          vec3 mid = vec3(0.13,0.06,0.20);
          vec3 top = vec3(0.03,0.02,0.07);
          vec3 c = mix(horizon, mid, smoothstep(0.0,0.35,h));
          c = mix(c, top, smoothstep(0.35,1.0,h));
          gl_FragColor = vec4(c,1.0);
        }`,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-10}>
      <sphereGeometry args={[90, 32, 16]} />
    </mesh>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < 500; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * 0.45 * Math.PI;
      pts.push(
        80 * Math.cos(th) * Math.sin(ph),
        80 * Math.cos(ph),
        80 * Math.sin(th) * Math.sin(ph),
      );
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={0.25}
        color="#d8c8ff"
        transparent
        opacity={0.7}
        fog={false}
      />
    </points>
  );
}

function Moon() {
  const { scene } = useGLTF("/architecture/moon.glb");
  const moon = useMemo(() => {
    const m = fitModel(scene, 3.4, "height");
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if ("emissive" in mat) {
          mat.emissive = new THREE.Color("#c9c4ff");
          mat.emissiveIntensity = 1.8;
          if (mat.map) mat.emissiveMap = mat.map;
        }
        mat.fog = false;
      }
    });
    return m;
  }, [scene]);
  const glow = useMemo(
    () => makeGlowTexture("rgba(220,210,255,0.9)", "rgba(140,90,220,0)"),
    [],
  );
  return (
    <group position={MOON_POS}>
      <primitive object={moon} position={[0, -1.7, 0]} />
      <sprite scale={[14, 14, 1]} position={[0, 0, -1]}>
        <spriteMaterial
          map={glow}
          transparent
          depthWrite={false}
          fog={false}
          opacity={0.55}
        />
      </sprite>
    </group>
  );
}

function Clouds() {
  const textures = useMemo(
    () => [1, 7, 13].map((s) => makeCloudTexture(s)),
    [],
  );
  const group = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () => [
      { p: [-7, 16.5, -20], s: [16, 6], c: "#5a2d7a", o: 0.9, t: 0 },
      { p: [3, 13.2, -21], s: [14, 5], c: "#43205f", o: 0.85, t: 1 },
      { p: [-3, 12, -18], s: [11, 4], c: "#6d3a8c", o: 0.7, t: 2 },
      { p: [9, 18, -24], s: [20, 7], c: "#3a1a52", o: 0.9, t: 0 },
      { p: [-14, 11, -22], s: [16, 6], c: "#4a2366", o: 0.8, t: 1 },
      { p: [0, 20, -26], s: [26, 8], c: "#2a1240", o: 0.9, t: 2 },
    ],
    [],
  );
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      c.position.x =
        clouds[i].p[0] + Math.sin(clock.elapsedTime * 0.05 + i) * 1.2;
    });
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.p as [number, number, number]}>
          <planeGeometry args={c.s as [number, number]} />
          <meshBasicMaterial
            map={textures[c.t]}
            color={c.c}
            transparent
            opacity={c.o}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function GroundFog() {
  const tex = useMemo(() => makeCloudTexture(21), []);
  const group = useRef<THREE.Group>(null);
  const layers = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: -10 + ((i * 37) % 24),
        z: -6 + ((i * 53) % 20),
        y: 0.3 + (i % 3) * 0.35,
        w: 10 + (i % 4) * 3,
        speed: 0.08 + (i % 5) * 0.03,
      })),
    [],
  );
  useFrame(({ clock, camera }) => {
    group.current?.children.forEach((m, i) => {
      const l = layers[i];
      m.position.x = l.x + Math.sin(clock.elapsedTime * l.speed + i) * 2;
      m.quaternion.copy(camera.quaternion);
    });
  });
  return (
    <group ref={group}>
      {layers.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]}>
          <planeGeometry args={[l.w, l.w * 0.35]} />
          <meshBasicMaterial
            map={tex}
            color={i % 2 ? "#8a5aa8" : "#6e4a8e"}
            transparent
            opacity={0.45}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Branches() {
  const tex = useMemo(() => makeBranchTexture(5), []);
  const { camera, size } = useThree();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
  });
  const persp = camera as THREE.PerspectiveCamera;
  const d = 4;
  const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(persp.fov / 2));
  const w = h * (size.width / size.height);
  const s = h * 0.75;
  return (
    <group ref={group}>
      <mesh
        position={[-w / 2 + s / 2 - 0.05, h / 2 - s / 2 + 0.05, -d]}
        renderOrder={10}
      >
        <planeGeometry args={[s, s]} />
        <meshBasicMaterial
          map={tex}
          transparent
          depthTest={false}
          fog={false}
        />
      </mesh>
      <mesh
        position={[w / 2 - s / 2 + 0.05, h / 2 - s / 2 + 0.05, -d]}
        scale={[-1, 1, 1]}
        renderOrder={10}
      >
        <planeGeometry args={[s, s]} />
        <meshBasicMaterial
          map={tex}
          transparent
          depthTest={false}
          fog={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Ground() {
  const tex = useMemo(() => makeGroundTexture(), []);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial map={tex} color="#4a3a58" roughness={0.9} />
    </mesh>
  );
}

function Lights() {
  const moonLight = useRef<THREE.DirectionalLight>(null);
  useFrame(({ clock }) => {
    if (moonLight.current)
      moonLight.current.intensity =
        1.6 + Math.sin(clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <>
      <hemisphereLight args={["#7a6ad0", "#2a1030", 0.9]} />
      <ambientLight color="#6a4a9a" intensity={0.5} />
      <directionalLight
        ref={moonLight}
        position={MOON_POS.toArray()}
        color="#a8a4ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[10, 6, 12]}
        color="#b04a8a"
        intensity={0.8}
      />
    </>
  );
}

function Lightning() {
  const light = useRef<THREE.DirectionalLight>(null);
  const timer = useRef(0);
  const nextStorm = useRef(6);

  useFrame((_, delta) => {
    nextStorm.current -= delta;

    if (nextStorm.current <= 0 && timer.current <= 0) {
      timer.current = 2.5;
      nextStorm.current = 5 + Math.random() * 5;
    }
    let intensity = 0;

    if (timer.current > 0) {
      timer.current = Math.max(0, timer.current - delta);

      const elapsed = 2.5 - timer.current;
      const flash1 = elapsed < 0.15;
      const flash2 = elapsed > 0.4 && elapsed < 0.65;
      const flash3 = elapsed > 1.1 && elapsed < 1.35;
      const flash4 = elapsed > 1.8 && elapsed < 2.15;
      intensity = flash1 || flash2 || flash3 || flash4 ? 9 : 0.4;
    }

    if (light.current) {
      light.current.intensity = intensity;
    }
  });

  return (
    <directionalLight ref={light} position={[-8, 18, 8]} color="#d1d9ff" intensity={0}/>
  );
}

export default function MansionEnvironment() {
  return (
    <>
      <color attach="background" args={["#0d0716"]} />
      <fog attach="fog" args={["#2a1838", 14, 55]} />
      <Sky />
      <Stars />
      <Lights />
      <Ground />
      <FlyingBirds />
      <Clouds />
      <GroundFog />
      <Branches />
      <Lightning />
    </>
  );
}

export function MoonLayer() {
  return <Moon />;
}

useGLTF.preload("/architecture/moon.glb");
