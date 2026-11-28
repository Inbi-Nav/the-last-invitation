import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import FpsControls, { type MoveLimits } from "./fpsControls";

const ROOM = { w: 10, d: 10, h: 3.4 };
const SPAWN = {
  x: 0,
  z: 3.2,
  lookAt: [0, 1.4, -3] as [number, number, number],
};
const BOUNDS: MoveLimits = {
  minX: -ROOM.w / 2 + 0.4,
  maxX: ROOM.w / 2 - 0.4,
  minZ: -ROOM.d / 2 + 0.4,
  maxZ: ROOM.d / 2 - 0.4,
};
const floorAt = () => 0;

function Flashlight({ enabled }: { enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!light.current) return;
    light.current.position.copy(camera.position);
    camera.getWorldDirection(direction);
    target.position.copy(camera.position).addScaledVector(direction, 12);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        target={target}
        color="#fff3db"
        intensity={enabled ? 420 : 0}
        distance={28}
        angle={0.57}
        penumbra={0.45}
        decay={1.4}
      />
    </>
  );
}

function FlickerLight() {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime;
    light.current.intensity =
      1.1 +
      Math.sin(t * 13.7) * 0.18 +
      Math.sin(t * 3.1) * 0.22 +
      (Math.random() < 0.02 ? -0.6 : 0);
  });
  return (
    <pointLight
      ref={light}
      position={[0, 2.6, -1]}
      color="#ffb066"
      distance={9}
      decay={1.6}
    />
  );
}

function GhostFigure({ position }: { position: [number, number, number] }) {
  const body = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.elapsedTime;
    body.current.position.y = Math.sin(t * 0.8) * 0.08;
    const material = body.current.material as THREE.MeshStandardMaterial;
    material.opacity = 0.16 + Math.abs(Math.sin(t * 0.5)) * 0.14;
  });
  return (
    <group position={position}>
      <mesh ref={body}>
        <capsuleGeometry args={[0.26, 1.1, 4, 10]} />
        <meshStandardMaterial
          color="#cfd6ff"
          transparent
          opacity={0.22}
          emissive="#8899ff"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial
          color="#e8ecff"
          transparent
          opacity={0.28}
          emissive="#aabbff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

function Candle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.28, 8]} />
        <meshStandardMaterial color="#d8cdb8" />
      </mesh>
      <pointLight
        position={[0, 0.36, 0]}
        color="#ff9a3c"
        intensity={0.55}
        distance={2.4}
        decay={1.7}
      />
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
    </group>
  );
}

export default function HauntedRoom({
  active,
  flashlight,
}: {
  active: boolean;
  flashlight: boolean;
}) {
  const floorTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#241a16";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    return t;
  }, []);

  return (
    <>
      <color attach="background" args={["#050308"]} />
      <fog attach="fog" args={["#050308", 3, 14]} />
      <ambientLight color="#4a3a66" intensity={0.22} />
      <FlickerLight />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial map={floorTex} color="#6b5a4c" roughness={0.95} />
      </mesh>
      <mesh position={[0, ROOM.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color="#181018" roughness={1} />
      </mesh>
      <mesh position={[0, ROOM.h / 2, -ROOM.d / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <meshStandardMaterial color="#2a1e22" roughness={1} />
      </mesh>
      <mesh position={[0, ROOM.h / 2, ROOM.d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <meshStandardMaterial color="#2a1e22" roughness={1} />
      </mesh>
      <mesh
        position={[-ROOM.w / 2, ROOM.h / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color="#2a1e22" roughness={1} />
      </mesh>
      <mesh
        position={[ROOM.w / 2, ROOM.h / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color="#2a1e22" roughness={1} />
      </mesh>
      <group position={[-3.4, 1.5, -4.85]}>
        <mesh>
          <boxGeometry args={[1.6, 2.2, 0.08]} />
          <meshStandardMaterial color="#1a1418" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.3, 1.9]} />
          <meshStandardMaterial
            color="#0c0c14"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
      </group>
      <Candle position={[-4.2, 0, -3.5]} />
      <Candle position={[4.3, 0, -2.2]} />
      <Candle position={[3.6, 0, 3.6]} />
      <Candle position={[-3.8, 0, 3.2]} />
      <GhostFigure position={[-2.6, 1.05, -3.4]} />
      <GhostFigure position={[2.9, 1.05, -4.0]} />
      {(
        [
          [-1.8, -1.5, 0.6, 0],
          [1.4, -2.6, -0.9, 0.5],
          [0.4, 2.2, 2.2, 0],
        ] as const
      ).map(([x, z, ry, tilt], i) => (
        <group key={i} position={[x, 0, z]} rotation={[tilt, ry, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
          <mesh position={[0, 0.75, -0.2]}>
            <boxGeometry args={[0.45, 0.6, 0.05]} />
            <meshStandardMaterial color="#3a2a20" />
          </mesh>
          {(
            [
              [-0.19, -0.19],
              [0.19, -0.19],
              [-0.19, 0.19],
              [0.19, 0.19],
            ] as const
          ).map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.22, lz]}>
              <cylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
              <meshStandardMaterial color="#2c2018" />
            </mesh>
          ))}
        </group>
      ))}
      <Flashlight enabled={flashlight} />
      <FpsControls
        active={active}
        bounds={BOUNDS}
        floorAt={floorAt}
        spawn={SPAWN}
      />
    </>
  );
}
