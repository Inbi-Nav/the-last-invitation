import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeGlowTexture } from "../../utils/textures";

const HOUSE = { x: 0, z: -34 };
const WALKWAY_HALF = 7.4;

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isClear(x: number, z: number) {
  if (Math.abs(x) < WALKWAY_HALF && z > -30 && z < 16) return false;
  if (z < -18 && z > -50 && Math.abs(x) < 15) return false;
  return true;
}

function Instanced({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  matrices: THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, Math.max(1, matrices.length)]}
      count={matrices.length}
      frustumCulled={false}
    />
  );
}

type Planting = {
  trunks: THREE.Matrix4[];
  conifers: THREE.Matrix4[];
  canopies: THREE.Matrix4[];
  branches: THREE.Matrix4[];
  bushes: THREE.Matrix4[];
  grass: THREE.Matrix4[];
};

function plant(): Planting {
  const rand = seeded(20261126);
  const trunks: THREE.Matrix4[] = [];
  const conifers: THREE.Matrix4[] = [];
  const canopies: THREE.Matrix4[] = [];
  const branches: THREE.Matrix4[] = [];
  const bushes: THREE.Matrix4[] = [];
  const grass: THREE.Matrix4[] = [];

  const push = (
    list: THREE.Matrix4[],
    position: THREE.Vector3,
    scale: THREE.Vector3,
    rotY = 0,
    rotZ = 0,
  ) => {
    const matrix = new THREE.Matrix4();
    matrix.compose(
      position,
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, rotZ)),
      scale,
    );
    list.push(matrix);
  };

  const treeSpots: { x: number; z: number; far: boolean }[] = [];
  for (let i = 0; i < 96; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 44 + rand() * 52;
    treeSpots.push({
      x: HOUSE.x + Math.sin(angle) * radius,
      z: HOUSE.z + Math.cos(angle) * radius,
      far: true,
    });
  }
  for (let i = 0; i < 26; i += 1) {
    const side = rand() > 0.5 ? 1 : -1;
    const x = side * (17 + rand() * 16);
    const z = -52 + rand() * 62;
    if (!isClear(x, z)) continue;
    treeSpots.push({ x, z, far: false });
  }

  treeSpots.forEach(({ x, z, far }) => {
    if (!isClear(x, z)) return;
    const conifer = rand() < 0.58;
    const height = (far ? 9 : 7.4) + rand() * (far ? 9 : 4.6);
    const trunkRadius = 0.14 + height * 0.017;
    const lean = (rand() - 0.5) * 0.07;
    push(
      trunks,
      new THREE.Vector3(x, height * 0.42, z),
      new THREE.Vector3(trunkRadius, height * 0.84, trunkRadius),
      rand() * 6.283,
      lean,
    );

    if (conifer) {
      const tiers = 3;
      for (let tier = 0; tier < tiers; tier += 1) {
        const k = tier / (tiers - 1);
        const tierHeight = height * (0.42 - k * 0.15);
        const tierRadius = height * (0.24 - k * 0.07);
        push(
          conifers,
          new THREE.Vector3(x, height * (0.4 + k * 0.24), z),
          new THREE.Vector3(tierRadius, tierHeight, tierRadius),
          rand() * 6.283,
          lean,
        );
      }
    } else if (rand() < 0.34) {
      const forks = 3 + Math.floor(rand() * 3);
      for (let fork = 0; fork < forks; fork += 1) {
        const angle = rand() * Math.PI * 2;
        const tilt = 0.5 + rand() * 0.55;
        const length = height * (0.16 + rand() * 0.18);
        push(
          branches,
          new THREE.Vector3(
            x + Math.cos(angle) * length * 0.42,
            height * (0.62 + rand() * 0.24),
            z + Math.sin(angle) * length * 0.42,
          ),
          new THREE.Vector3(trunkRadius * 0.55, length, trunkRadius * 0.55),
          angle,
          tilt,
        );
      }
    } else {
      const blobs = 3;
      for (let blob = 0; blob < blobs; blob += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = height * (0.1 + rand() * 0.1);
        push(
          canopies,
          new THREE.Vector3(
            x + Math.cos(angle) * radius,
            height * (0.66 + rand() * 0.16),
            z + Math.sin(angle) * radius,
          ),
          new THREE.Vector3(height * 0.16, height * 0.13, height * 0.16),
        );
      }
    }
  });

  for (let i = 0; i < 130; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 13 + rand() * 34;
    const x = Math.sin(angle) * radius;
    const z = HOUSE.z + Math.cos(angle) * radius;
    if (!isClear(x, z)) continue;
    const size = 0.55 + rand() * 1.15;
    push(
      bushes,
      new THREE.Vector3(x, size * 0.55, z),
      new THREE.Vector3(size * 1.25, size, size * 1.25),
      rand() * 6.283,
    );
    if (rand() < 0.45) {
      push(
        bushes,
        new THREE.Vector3(
          x + (rand() - 0.5) * 2.4,
          size * 0.4,
          z + (rand() - 0.5) * 2.4,
        ),
        new THREE.Vector3(size * 0.8, size * 0.62, size * 0.8),
        rand() * 6.283,
      );
    }
  }

  for (let i = 0; i < 260; i += 1) {
    const side = rand() > 0.5 ? 1 : -1;
    const x = side * (WALKWAY_HALF + rand() * 9);
    const z = -24 + rand() * 44;
    if (!isClear(x, z)) continue;
    const size = 0.42 + rand() * 0.5;
    push(
      grass,
      new THREE.Vector3(x, size * 0.42, z),
      new THREE.Vector3(size * 0.9, size, size * 0.9),
      rand() * 6.283,
    );
    push(
      grass,
      new THREE.Vector3(x, size * 0.42, z),
      new THREE.Vector3(size * 0.9, size, size * 0.9),
      rand() * 6.283 + Math.PI / 2,
    );
  }

  return { trunks, conifers, canopies, branches, bushes, grass };
}

function Mist() {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(
    () => makeGlowTexture("rgba(170,160,205,0.30)", "rgba(120,110,170,0)"),
    [],
  );
  const banks = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const rand = seeded(700 + index);
        return {
          position: [
            (rand() - 0.5) * 58,
            0.35 + rand() * 0.9,
            -70 + rand() * 88,
          ] as [number, number, number],
          scale: 17 + rand() * 15,
          speed: 0.02 + rand() * 0.05,
          phase: rand() * 6.283,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, index) => {
      const bank = banks[index];
      child.position.x =
        bank.position[0] +
        Math.sin(clock.elapsedTime * bank.speed + bank.phase) * 4.5;
    });
  });

  return (
    <group ref={group}>
      {banks.map((bank, index) => (
        <sprite
          key={index}
          position={bank.position}
          scale={[bank.scale, bank.scale * 0.4, 1]}
        >
          <spriteMaterial
            map={texture}
            transparent
            opacity={0.19}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

function Fireflies() {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const rand = seeded(4242);
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (rand() - 0.5) * 54;
      positions[i * 3 + 1] = 0.4 + rand() * 3.4;
      positions[i * 3 + 2] = -58 + rand() * 72;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = Math.sin(clock.elapsedTime * 0.04) * 0.25;
      points.current.position.y = Math.sin(clock.elapsedTime * 0.22) * 0.25;
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color="#d8c48a"
        size={0.09}
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Lanterns() {
  const spots = useMemo(
    () => [
      { x: -5.4, z: -5, lit: true },
      { x: 5.4, z: -5, lit: true },
      { x: -5.4, z: -20, lit: false },
      { x: 5.4, z: -20, lit: false },
    ],
    [],
  );

  return (
    <group>
      {spots.map(({ x, z, lit }) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 1.05, 0]}>
            <cylinderGeometry args={[0.075, 0.13, 2.1, 8]} />
            <meshStandardMaterial
              color="#1b1417"
              roughness={0.72}
              metalness={0.35}
            />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[0.34, 0.42, 0.34]} />
            <meshStandardMaterial
              color="#191216"
              roughness={0.6}
              metalness={0.4}
            />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[0.2, 0.28, 0.2]} />
            <meshBasicMaterial color="#ffbd80" toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.48, 0]}>
            <coneGeometry args={[0.26, 0.22, 4]} />
            <meshStandardMaterial
              color="#1b1417"
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
          {lit && (
            <pointLight
              position={[0, 2.2, 0]}
              color="#ffb173"
              intensity={14}
              distance={8}
              decay={1.8}
            />
          )}
        </group>
      ))}
    </group>
  );
}

export default function Vegetation() {
  const planting = useMemo(() => plant(), []);

  const materials = useMemo(
    () => ({
      bark: new THREE.MeshStandardMaterial({
        color: "#211917",
        roughness: 0.95,
        flatShading: true,
      }),
      conifer: new THREE.MeshStandardMaterial({
        color: "#0e1a15",
        roughness: 1,
        flatShading: true,
      }),
      canopy: new THREE.MeshStandardMaterial({
        color: "#131d18",
        roughness: 1,
        flatShading: true,
      }),
      bush: new THREE.MeshStandardMaterial({
        color: "#101b15",
        roughness: 1,
        flatShading: true,
      }),
      grass: new THREE.MeshStandardMaterial({
        color: "#16221a",
        roughness: 1,
        side: THREE.DoubleSide,
        flatShading: true,
      }),
    }),
    [],
  );

  const geometries = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.8, 1, 1, 6, 1),
      cone: new THREE.ConeGeometry(1, 1, 7, 1),
      blob: new THREE.IcosahedronGeometry(1, 0),
      branch: new THREE.CylinderGeometry(0.6, 1, 1, 5, 1),
      tuft: new THREE.ConeGeometry(1, 1, 4, 1),
    }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      Object.values(materials).forEach((material) => material.dispose());
    };
  }, [geometries, materials]);

  return (
    <group>
      <Instanced
        geometry={geometries.trunk}
        material={materials.bark}
        matrices={planting.trunks}
      />
      <Instanced
        geometry={geometries.cone}
        material={materials.conifer}
        matrices={planting.conifers}
      />
      <Instanced
        geometry={geometries.blob}
        material={materials.canopy}
        matrices={planting.canopies}
      />
      <Instanced
        geometry={geometries.branch}
        material={materials.bark}
        matrices={planting.branches}
      />
      <Instanced
        geometry={geometries.blob}
        material={materials.bush}
        matrices={planting.bushes}
      />
      <Instanced
        geometry={geometries.tuft}
        material={materials.grass}
        matrices={planting.grass}
      />
      <Lanterns />
      <Mist />
      <Fireflies />
    </group>
  );
}
