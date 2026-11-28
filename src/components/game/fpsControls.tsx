import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

export const EYE_HEIGHT = 1.6;
export const WALK_SPEED = 3.2;
export const SPRINT_MULT = 1.8;
export const GRAVITY = 14;
const STEP_UP = 0.55;

export type FloorSampler = (x: number, z: number) => number;

export interface MoveLimits {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  blockers?: Array<{ x1: number; x2: number; z1: number; z2: number }>;
}

export function sampleMove(
  pos: THREE.Vector3,
  move: THREE.Vector3,
  limits: MoveLimits,
  floorAt: FloorSampler,
) {
  const nx = THREE.MathUtils.clamp(pos.x + move.x, limits.minX, limits.maxX);
  const nz = THREE.MathUtils.clamp(pos.z + move.z, limits.minZ, limits.maxZ);
  let bx = nx,
    bz = nz;
  for (const b of limits.blockers ?? []) {
    const insideX = bx > b.x1 && bx < b.x2;
    const insideZ = bz > b.z1 && bz < b.z2;
    if (insideX && insideZ) {
      const dl = Math.abs(bx - b.x1),
        dr = Math.abs(b.x2 - bx);
      const dn = Math.abs(bz - b.z1),
        df = Math.abs(b.z2 - bz);
      const m = Math.min(dl, dr, dn, df);
      if (m === dl) bx = b.x1;
      else if (m === dr) bx = b.x2;
      else if (m === dn) bz = b.z1;
      else bz = b.z2;
    }
  }
  const targetY = floorAt(bx, bz) + EYE_HEIGHT;
  if (targetY - pos.y <= STEP_UP) {
    pos.x = bx;
    pos.z = bz;
  }
}

export default function FpsControls({
  active,
  bounds,
  floorAt,
  spawn,
  onFrame,
}: {
  active: boolean;
  bounds: MoveLimits;
  floorAt: FloorSampler;
  spawn: { x: number; z: number; lookAt: [number, number, number] };
  onFrame?: (pos: THREE.Vector3) => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const keys = useRef<Set<string>>(new Set());
  const vy = useRef(0);

  useEffect(() => {
    camera.position.set(
      spawn.x,
      floorAt(spawn.x, spawn.z) + EYE_HEIGHT,
      spawn.z,
    );
    camera.lookAt(spawn.lookAt[0], spawn.lookAt[1], spawn.lookAt[2]);
  }, [camera]);

  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault();
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

    const groundY = floorAt(camera.position.x, camera.position.z) + EYE_HEIGHT;
    vy.current -= GRAVITY * dt;
    camera.position.y += vy.current * dt;
    if (camera.position.y <= groundY) {
      camera.position.y = groundY;
      vy.current = 0;
    }

    const k = keys.current;
    const forward =
      (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
      (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const strafe =
      (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
      (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    if (forward === 0 && strafe === 0) {
      onFrame?.(camera.position);
      return;
    }

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
      sampleMove(camera.position, move, bounds, floorAt);
    }
    onFrame?.(camera.position);
  });

  if (!active) return null;
  return <PointerLockControls makeDefault />;
}
