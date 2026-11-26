import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { loadInterior } from "./interiorModel";

const EYE_STAND = 0.22;
const EYE_CROUCH = 0.13;
const WALK_SPEED = 0.55;
const CROUCH_MULT = 0.5;
const SPRINT_MULT = 1.85;
const GRAVITY = 4.2;
const STEP_LIMIT = 0.35;
const BOUNDS = { minX: -1.05, maxX: 0.65, minZ: -0.8, maxZ: 1.05 };
const START = { x: -0.2, z: 0.75 };

function FpsControls({
  active,
  model,
  eye,
}: {
  active: boolean;
  model: THREE.Object3D | null;
  eye: React.MutableRefObject<number>;
}) {
  const camera = useThree((s) => s.camera);
  const keys = useRef<Set<string>>(new Set());
  const vy = useRef(0);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const origin = useMemo(() => new THREE.Vector3(), []);

  const floorAt = useCallback(
    (x: number, z: number, fromY: number): number | null => {
      if (!model) return null;
      origin.set(x, fromY + 0.6, z);
      raycaster.set(origin, down);
      raycaster.far = 4;
      const hits = raycaster.intersectObject(model, true);
      return hits.length ? hits[0].point.y : null;
    },
    [model, raycaster, down, origin],
  );

  useEffect(() => {
    if (!active) return;
    const down2 = (e: KeyboardEvent) => keys.current.add(e.code);
    const up2 = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", down2);
    window.addEventListener("keyup", up2);
    return () => {
      window.removeEventListener("keydown", down2);
      window.removeEventListener("keyup", up2);
    };
  }, [active]);

  useFrame((_, delta) => {
    if (!active) return;
    const dt = Math.min(delta, 0.05);
    const k = keys.current;

    const crouching = k.has("KeyC") || k.has("ControlLeft");
    const targetEye = crouching ? EYE_CROUCH : EYE_STAND;
    eye.current += (targetEye - eye.current) * Math.min(1, dt * 10);

    const floor = floorAt(
      camera.position.x,
      camera.position.z,
      camera.position.y,
    );
    const baseY = floor ?? 0;
    const targetY = baseY + eye.current;

    if (camera.position.y > targetY + 0.002) {
      vy.current -= GRAVITY * dt;
      camera.position.y += vy.current * dt;
      if (camera.position.y <= targetY) {
        camera.position.y = targetY;
        vy.current = 0;
      }
    } else {
      vy.current = 0;
      camera.position.y += (targetY - camera.position.y) * Math.min(1, dt * 12);
    }

    const forward = (k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0);
    const strafe = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    if (forward === 0 && strafe === 0) return;

    const sprint = (k.has("ShiftLeft") || k.has("ShiftRight")) && !crouching;
    const speed =
      WALK_SPEED * (crouching ? CROUCH_MULT : 1) * (sprint ? SPRINT_MULT : 1);

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
    dir.normalize();
    const right = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), dir)
      .multiplyScalar(-1);
    const move = dir.multiplyScalar(forward).add(right.multiplyScalar(strafe));
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(speed * dt);

    const nextX = THREE.MathUtils.clamp(
      camera.position.x + move.x,
      BOUNDS.minX,
      BOUNDS.maxX,
    );
    const nextZ = THREE.MathUtils.clamp(
      camera.position.z + move.z,
      BOUNDS.minZ,
      BOUNDS.maxZ,
    );

    const nextFloor = floorAt(nextX, nextZ, camera.position.y);
    if (nextFloor !== null && nextFloor - baseY > STEP_LIMIT) return;

    camera.position.x = nextX;
    camera.position.z = nextZ;
  });

  if (!active) return null;
  return <PointerLockControls makeDefault />;
}

function PlayerBody({
  active,
  eye,
}: {
  active: boolean;
  eye: React.MutableRefObject<number>;
}) {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!group.current || !active) return;
    camera.getWorldDirection(dir);
    group.current.position.set(
      camera.position.x,
      camera.position.y - eye.current,
      camera.position.z,
    );
    group.current.rotation.y = Math.atan2(dir.x, dir.z);
  });

  if (!active) return null;

  return (
    <group ref={group} visible>
      <mesh position={[0, 0.32, 0]}>
        <capsuleGeometry args={[0.055, 0.09, 4, 8]} />
        <meshStandardMaterial color="#241531" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.435, 0]}>
        <sphereGeometry args={[0.038, 10, 8]} />
        <meshStandardMaterial color="#c9a284" roughness={0.8} />
      </mesh>
      <mesh position={[-0.03, 0.11, 0]}>
        <capsuleGeometry args={[0.02, 0.1, 3, 6]} />
        <meshStandardMaterial color="#1a0f24" roughness={0.95} />
      </mesh>
      <mesh position={[0.03, 0.11, 0]}>
        <capsuleGeometry args={[0.02, 0.1, 3, 6]} />
        <meshStandardMaterial color="#1a0f24" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function MansionInterior({ active }: { active: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const eye = useRef(EYE_STAND);

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
    camera.position.set(START.x, EYE_STAND, START.z);
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
      <PlayerBody active={active} eye={eye} />
      <FpsControls active={active} model={model} eye={eye} />
    </>
  );
}
