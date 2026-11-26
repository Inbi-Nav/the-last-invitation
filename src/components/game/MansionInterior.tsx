import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { loadInterior } from "./interiorModel";

const EYE_HEIGHT = 0.22;
const WALK_SPEED = 0.55;
const SPRINT_MULT = 1.85;
const GRAVITY = 4.2;
const BOUNDS = { minX: -1.05, maxX: 0.65, minZ: -0.8, maxZ: 1.05 };
const START = { x: -0.2, z: 0.75 };

function FpsControls({ active }: { active: boolean }) {
  const camera = useThree((s) => s.camera);
  const keys = useRef<Set<string>>(new Set());
  const vy = useRef(0);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)
      ) {
        e.preventDefault();
      }
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      keys.current.clear();
    };
  }, [active]);

  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(delta, 0.05);

    vy.current -= GRAVITY * dt;
    camera.position.y += vy.current * dt;
    if (camera.position.y <= EYE_HEIGHT) {
      camera.position.y = EYE_HEIGHT;
      vy.current = 0;
    }

    const k = keys.current;
    const forward =
      (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const strafe =
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
      (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    if (forward === 0 && strafe === 0) return;

    const sprint = k.has("ShiftLeft") || k.has("ShiftRight");
    const speed = WALK_SPEED * (sprint ? SPRINT_MULT : 1);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
    dir.normalize();
    const right = new THREE.Vector3()
      .crossVectors(dir, new THREE.Vector3(0, 1, 0))
      .normalize();
    const move = dir.multiplyScalar(forward).add(right.multiplyScalar(strafe));
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      camera.position.x = THREE.MathUtils.clamp(
        camera.position.x + move.x,
        BOUNDS.minX,
        BOUNDS.maxX,
      );
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z + move.z,
        BOUNDS.minZ,
        BOUNDS.maxZ,
      );
    }
  });

  if (!active) return null;
  return <PointerLockControls makeDefault />;
}

function Flashlight({ enabled }: { enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    if (!light.current) return;
    light.current.position.copy(camera.position);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    target.position.copy(camera.position).addScaledVector(forward, 2);
    target.updateMatrixWorld();
  });
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        target={target}
        color="#ffe9cc"
        intensity={enabled ? 5 : 0}
        distance={5}
        angle={0.45}
        penumbra={0.6}
      />
    </>
  );
}

export default function MansionInterior({
  active,
  flashlight = false,
}: {
  active: boolean;
  flashlight?: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const [model, setModel] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let alive = true;
    loadInterior().then((m) => {
      if (alive) setModel(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    camera.position.set(START.x, EYE_HEIGHT, START.z);
    camera.lookAt(-0.2, 0.25, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return (
    <>
      <color attach="background" args={["#0b0611"]} />
      <hemisphereLight args={["#8a7ad0", "#2a1030", 0.85]} />
      <ambientLight color="#9a70ff" intensity={0.45} />
      <directionalLight
        position={[0.5, 2, 2]}
        color="#ffd2a0"
        intensity={1.1}
      />
      <pointLight
        position={[-0.2, 0.6, -0.2]}
        color="#ffa850"
        intensity={2.2}
        distance={3}
        decay={1.5}
      />
      <pointLight
        position={[0.3, 0.4, 0.4]}
        color="#b24dff"
        intensity={1.2}
        distance={2.5}
        decay={1.5}
      />
      <pointLight
        position={[-0.2, 0.5, -0.55]}
        color="#ffbf6a"
        intensity={1.4}
        distance={2.2}
        decay={1.5}
      />
      {model && <primitive object={model} />}
      <Flashlight enabled={flashlight} />
      <FpsControls active={active && model !== null} />
    </>
  );
}
