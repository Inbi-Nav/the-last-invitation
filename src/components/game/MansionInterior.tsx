import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import FpsControls, { type MoveLimits } from "./fpsControls";
import { sound } from "../../audio/SoundEngine";

const HALL = { minX: -8, maxX: 8, minZ: -9, maxZ: 8, h: 6 };
const STAIR = { baseZ: 1.5, topZ: -4.5, topY: 3, halfW: 1.5 };
const LANDING_Z = STAIR.topZ;
const DOOR_Y = STAIR.topY;

const SPAWN = { x: 0, z: 6.2, lookAt: [0, 1.6, 0] as [number, number, number] };

const BOUNDS: MoveLimits = {
  minX: HALL.minX + 0.45,
  maxX: HALL.maxX - 0.45,
  minZ: HALL.minZ + 0.45,
  maxZ: HALL.maxZ - 0.45,
  blockers: [
    {
      x1: -STAIR.halfW - 0.3,
      x2: -STAIR.halfW + 0.05,
      z1: STAIR.topZ,
      z2: STAIR.baseZ,
    },
    {
      x1: STAIR.halfW - 0.05,
      x2: STAIR.halfW + 0.3,
      z1: STAIR.topZ,
      z2: STAIR.baseZ,
    },
    {
      x1: HALL.minX,
      x2: -STAIR.halfW - 0.1,
      z1: LANDING_Z - 0.25,
      z2: LANDING_Z + 0.1,
    },
    {
      x1: STAIR.halfW + 0.1,
      x2: HALL.maxX,
      z1: LANDING_Z - 0.25,
      z2: LANDING_Z + 0.1,
    },
  ],
};

function floorAt(x: number, z: number): number {
  if (z <= LANDING_Z) return STAIR.topY;
  if (z < STAIR.baseZ && Math.abs(x) <= STAIR.halfW + 0.05) {
    const t = THREE.MathUtils.clamp(
      (STAIR.baseZ - z) / (STAIR.baseZ - STAIR.topZ),
      0,
      1,
    );
    return t * STAIR.topY;
  }
  return 0;
}


function carpetTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4a0d14";
  g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "#8a6a2a";
  g.lineWidth = 6;
  g.strokeRect(14, 14, 228, 484);
  g.strokeRect(30, 30, 196, 452);
  g.fillStyle = "#5e1119";
  for (let y = 60; y < 470; y += 52) {
    for (let x = 48; x < 220; x += 52) {
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.strokeStyle = "rgba(0,0,0,0.35)";
  g.lineWidth = 2;
  for (let i = 0; i < 220; i++) {
    g.beginPath();
    const x = Math.random() * 256,
      y = Math.random() * 512;
    g.moveTo(x, y);
    g.lineTo(x + Math.random() * 8 - 4, y + Math.random() * 8 - 4);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ritualFloorTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#241a1c";
  g.fillRect(0, 0, 512, 512);
  g.translate(256, 256);
  g.strokeStyle = "#7a5a28";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(0, 0, 220, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 180, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#9a3a2a";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 140, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#8a2a2a";
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI * 2) / 5;
    const x = Math.cos(a) * 138,
      y = Math.sin(a) * 138;
    i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();
  g.strokeStyle = "#6a4a1e";
  g.lineWidth = 3;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * 190, Math.sin(a) * 190);
    g.lineTo(Math.cos(a + 0.09) * 212, Math.sin(a + 0.09) * 212);
    g.stroke();
  }
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(10,4,4,${Math.random() * 0.4})`;
    g.beginPath();
    g.arc(
      (Math.random() - 0.5) * 480,
      (Math.random() - 0.5) * 480,
      Math.random() * 14,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const PORTRAIT_IMAGES = [
  "/images/hall-portraits/frame.png",
  "/images/hall-portraits/joker.png",
  "/images/hall-portraits/manor.jpg",
  "/images/hall-portraits/raven.jpg",
  "/images/hall-portraits/vanitas.jpg",
] as const;


function Candle({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.elapsedTime;
    light.current.intensity =
      1.5 + Math.sin(t * 11 + position[0]) * 0.35 + Math.random() * 0.2;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.32, 8]} />
        <meshStandardMaterial color="#d8cdb0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffd27a" toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.42, 0]}
        color="#ff9a3c"
        intensity={1.5}
        distance={5}
        decay={1.7}
      />
    </group>
  );
}

function Portrait({
  position,
  rotationY,
  seed,
}: {
  position: [number, number, number];
  rotationY: number;
  seed: number;
}) {
  const texture = useTexture(
    PORTRAIT_IMAGES[(seed - 1) % PORTRAIT_IMAGES.length],
  );
  const frameW = 1.22;
  const frameH = 1.82;
  const thickness = 0.105;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[frameW, frameH, 0.065]} />
        <meshStandardMaterial color="#1d1011" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[frameW - 0.2, frameH - 0.2]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive="#ffffff"
          emissiveIntensity={0.1}
          roughness={0.92}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (frameW / 2 - 0.085), 0, 0.08]}>
            <boxGeometry args={[0.035, frameH - 0.13, 0.032]} />
            <meshStandardMaterial
              color="#b08b4d"
              metalness={0.7}
              roughness={0.36}
            />
          </mesh>
          <mesh position={[0, side * (frameH / 2 - 0.085), 0.08]}>
            <boxGeometry args={[frameW - 0.13, 0.035, 0.032]} />
            <meshStandardMaterial
              color="#b08b4d"
              metalness={0.7}
              roughness={0.36}
            />
          </mesh>
          <mesh position={[side * (frameW / 2 - thickness / 2), 0, 0.088]}>
            <boxGeometry args={[thickness, frameH, 0.11]} />
            <meshStandardMaterial
              color="#4a2820"
              metalness={0.2}
              roughness={0.48}
            />
          </mesh>
          <mesh position={[0, side * (frameH / 2 - thickness / 2), 0.088]}>
            <boxGeometry args={[frameW, thickness, 0.11]} />
            <meshStandardMaterial
              color="#4a2820"
              metalness={0.2}
              roughness={0.48}
            />
          </mesh>
          <mesh position={[side * (frameW / 2 - 0.05), 0, 0.16]}>
            <boxGeometry args={[0.015, frameH - 0.03, 0.018]} />
            <meshStandardMaterial
              color="#c49b56"
              metalness={0.82}
              roughness={0.28}
            />
          </mesh>
        </group>
      ))}
      <mesh
        position={[0, frameH / 2 + 0.035, 0.1]}
        rotation={[0, 0, Math.PI / 4]}
      >
        <boxGeometry args={[0.14, 0.14, 0.09]} />
        <meshStandardMaterial
          color="#a78245"
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

function StairRailing({ side }: { side: 1 | -1 }) {
  const x = side * (STAIR.halfW + 0.12);
  const run = STAIR.baseZ - STAIR.topZ;
  const slope = Math.atan2(STAIR.topY, run);
  const midZ = (STAIR.baseZ + STAIR.topZ) / 2;
  const midY = STAIR.topY / 2;
  const length = Math.hypot(run, STAIR.topY);
  const posts = 13;
  return (
    <group>
      <group position={[x, midY + 1.03, midZ]} rotation={[slope, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.14, length + 0.08]} />
          <meshStandardMaterial color="#563522" roughness={0.56} />
        </mesh>
        <mesh position={[0, 0.084, 0]}>
          <boxGeometry args={[0.19, 0.025, length + 0.1]} />
          <meshStandardMaterial
            color="#ad7f43"
            metalness={0.46}
            roughness={0.45}
          />
        </mesh>
      </group>
      <group position={[x, midY + 0.19, midZ]} rotation={[slope, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.095, 0.08, length]} />
          <meshStandardMaterial color="#3b251b" roughness={0.6} />
        </mesh>
      </group>
      {Array.from({ length: posts }, (_, i) => {
        const t = i / (posts - 1);
        const z = STAIR.baseZ - t * run;
        const y = t * STAIR.topY;
        const end = i === 0 || i === posts - 1;
        return (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.52, 0]} castShadow>
              <boxGeometry
                args={[end ? 0.17 : 0.075, 1.04, end ? 0.17 : 0.075]}
              />
              <meshStandardMaterial
                color={end ? "#523522" : "#312018"}
                roughness={0.66}
              />
            </mesh>
            {end && (
              <mesh position={[0, 1.09, 0]}>
                <sphereGeometry args={[0.105, 10, 8]} />
                <meshStandardMaterial
                  color="#ab824d"
                  metalness={0.62}
                  roughness={0.34}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function LandingRailing({ from, to }: { from: number; to: number }) {
  const length = to - from;
  if (length <= 0.2) return null;
  const mid = (from + to) / 2;
  const posts = Math.max(3, Math.ceil(length / 0.55));
  return (
    <group position={[mid, STAIR.topY, LANDING_Z]}>
      <mesh position={[0, 1.03, 0]} castShadow>
        <boxGeometry args={[length + 0.08, 0.14, 0.16]} />
        <meshStandardMaterial color="#563522" roughness={0.56} />
      </mesh>
      <mesh position={[0, 1.115, 0]}>
        <boxGeometry args={[length + 0.08, 0.025, 0.19]} />
        <meshStandardMaterial
          color="#ad7f43"
          metalness={0.46}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <boxGeometry args={[length, 0.08, 0.095]} />
        <meshStandardMaterial color="#3b251b" roughness={0.6} />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => {
        const end = i === 0 || i === posts;
        const px = -length / 2 + (i / posts) * length;
        return (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, 0.52, 0]} castShadow>
              <boxGeometry
                args={[end ? 0.16 : 0.07, 1.04, end ? 0.16 : 0.07]}
              />
              <meshStandardMaterial
                color={end ? "#523522" : "#312018"}
                roughness={0.65}
              />
            </mesh>
            {end && (
              <mesh position={[0, 1.1, 0]}>
                <sphereGeometry args={[0.105, 10, 8]} />
                <meshStandardMaterial
                  color="#ab824d"
                  metalness={0.62}
                  roughness={0.34}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}


type DoorId = "left" | "center" | "right";
const DOORS: { id: DoorId; x: number; locked: boolean }[] = [
  { id: "left", x: -2.6, locked: true },
  { id: "center", x: 0, locked: true },
  { id: "right", x: 2.6, locked: false },
];
const DOOR_W = 1.3;
const DOOR_H = 2.4;
const DOOR_Z = HALL.minZ + 0.08;

function Door({
  x,
  locked,
  state,
  opening,
  showPrompt,
}: {
  x: number;
  locked: boolean;
  state: "idle" | "lockedMsg";
  opening: boolean;
  showPrompt: boolean;
}) {
  const hinge = useRef<THREE.Group>(null);
  const angle = useRef(0);

  useFrame((_, delta) => {
    if (!hinge.current) return;
    const target = opening ? -THREE.MathUtils.degToRad(100) : 0;
    angle.current = THREE.MathUtils.damp(angle.current, target, 3, delta);
    hinge.current.rotation.y = angle.current;
  });

  const prompt =
    state === "lockedMsg"
      ? "Door Locked"
      : locked
        ? "Locked"
        : "Unlocked — Press E to Enter";

  return (
    <group position={[x, DOOR_Y, DOOR_Z]}>
      <mesh position={[0, DOOR_H / 2, 0]}>
        <boxGeometry args={[DOOR_W + 0.24, DOOR_H + 0.14, 0.18]} />
        <meshStandardMaterial color="#1c1210" roughness={0.9} />
      </mesh>
      <group ref={hinge} position={[-DOOR_W / 2, 0, 0.1]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0]} castShadow>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.09]} />
          <meshStandardMaterial
            color={locked ? "#3a2018" : "#4a2c1c"}
            roughness={0.75}
          />
        </mesh>
        <mesh position={[DOOR_W / 2, DOOR_H * 0.68, 0.06]}>
          <boxGeometry args={[DOOR_W * 0.6, DOOR_H * 0.32, 0.02]} />
          <meshStandardMaterial color="#2c1812" roughness={0.8} />
        </mesh>
        <mesh position={[DOOR_W / 2, DOOR_H * 0.3, 0.06]}>
          <boxGeometry args={[DOOR_W * 0.6, DOOR_H * 0.32, 0.02]} />
          <meshStandardMaterial color="#2c1812" roughness={0.8} />
        </mesh>
        <mesh position={[DOOR_W - 0.16, DOOR_H / 2, 0.09]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial
            color="#b49350"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
      </group>
      {showPrompt && (
        <Html
          position={[0, DOOR_H + 0.55, 0.2]}
          center
          distanceFactor={7}
          zIndexRange={[5, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(14,6,12,0.82)",
              border: "1px solid rgba(211,172,99,0.6)",
              color: "#f2e4c8",
              fontFamily: "Cinzel, Georgia, serif",
              fontSize: "13px",
              letterSpacing: "0.14em",
              padding: "7px 13px",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {prompt}
          </div>
        </Html>
      )}
    </group>
  );
}


export default function MansionInterior({
  active,
  flashlight,
  onEnterRoom,
}: {
  active: boolean;
  flashlight: boolean;
  onEnterRoom: () => void;
}) {
  const [nearDoor, setNearDoor] = useState<DoorId | null>(null);
  const [lockedMsg, setLockedMsg] = useState<DoorId | null>(null);
  const [opening, setOpening] = useState(false);
  const entered = useRef(false);
  const lastFloorY = useRef(0);
  const stairSoundAt = useRef(0);

  const carpet = useMemo(carpetTexture, []);
  const ritual = useMemo(ritualFloorTexture, []);
  const wallTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2b2026";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.22})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    g.strokeStyle = "rgba(60,44,40,0.5)";
    g.lineWidth = 1;
    for (let y = 0; y <= 256; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 3);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const handleFrame = (pos: THREE.Vector3) => {
    let nearest: DoorId | null = null;
    let best = Infinity;
    if (pos.y > DOOR_Y + 1.2) {
      for (const d of DOORS) {
        const dist = Math.hypot(pos.x - d.x, pos.z - (DOOR_Z + 0.6));
        if (dist < 2.25 && dist < best) {
          best = dist;
          nearest = d.id;
        }
      }
    }
    setNearDoor((prev) => (prev === nearest ? prev : nearest));

    const fy = floorAt(pos.x, pos.z);
    if (fy !== lastFloorY.current) {
      const now = performance.now();
      if (now - stairSoundAt.current > 420) {
        stairSoundAt.current = now;
        sound.stairsCreak(fy > lastFloorY.current);
      }
      lastFloorY.current = fy;
    }
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || !nearDoor || opening || entered.current) return;
      const door = DOORS.find((d) => d.id === nearDoor)!;
      if (door.locked) {
        setLockedMsg(door.id);
        sound.doorLocked();
        window.setTimeout(() => setLockedMsg(null), 2000);
      } else {
        setOpening(true);
        sound.doorCreak();
        window.setTimeout(() => {
          if (!entered.current) {
            entered.current = true;
            onEnterRoom();
          }
        }, 1500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, nearDoor, opening, onEnterRoom]);

  return (
    <>
      <color attach="background" args={["#070409"]} />
      <fog attach="fog" args={["#070409", 6, 30]} />
      <ambientLight color="#4a3a5e" intensity={0.25} />
      <hemisphereLight args={["#3a2c50", "#140a12", 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HALL.maxX - HALL.minX, HALL.maxZ - HALL.minZ]} />
        <meshStandardMaterial color="#3a2c24" roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, (STAIR.baseZ + HALL.maxZ) / 2]}
        receiveShadow
      >
        <planeGeometry args={[3, HALL.maxZ - STAIR.baseZ]} />
        <meshStandardMaterial map={carpet} roughness={0.9} />
      </mesh>

      <mesh position={[0, HALL.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HALL.maxX - HALL.minX, HALL.maxZ - HALL.minZ]} />
        <meshStandardMaterial color="#171017" roughness={1} />
      </mesh>

      <mesh position={[0, HALL.h / 2, HALL.minZ]} receiveShadow>
        <planeGeometry args={[HALL.maxX - HALL.minX, HALL.h]} />
        <meshStandardMaterial map={wallTex} color="#8a7a72" roughness={1} />
      </mesh>
      <mesh
        position={[0, HALL.h / 2, HALL.maxZ]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL.maxX - HALL.minX, HALL.h]} />
        <meshStandardMaterial map={wallTex} color="#8a7a72" roughness={1} />
      </mesh>
      <mesh
        position={[HALL.minX, HALL.h / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL.maxZ - HALL.minZ, HALL.h]} />
        <meshStandardMaterial map={wallTex} color="#8a7a72" roughness={1} />
      </mesh>
      <mesh
        position={[HALL.maxX, HALL.h / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL.maxZ - HALL.minZ, HALL.h]} />
        <meshStandardMaterial map={wallTex} color="#8a7a72" roughness={1} />
      </mesh>

      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          position={[0, (i + 0.5) * 0.25, STAIR.baseZ - (i + 0.5) * 0.5]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[STAIR.halfW * 2, 0.25, 0.5]} />
          <meshStandardMaterial color="#4a3626" roughness={0.85} />
        </mesh>
      ))}
      <StairRailing side={-1} />
      <StairRailing side={1} />

      <mesh
        position={[0, STAIR.topY - 0.06, (HALL.minZ + LANDING_Z) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[HALL.maxX - HALL.minX, LANDING_Z - HALL.minZ]} />
        <meshStandardMaterial color="#3c2e26" roughness={0.95} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, STAIR.topY + 0.005, HALL.minZ + 1.1]}
      >
        <planeGeometry args={[7.4, 2.2]} />
        <meshStandardMaterial
          map={ritual}
          roughness={0.9}
          transparent
          opacity={0.96}
        />
      </mesh>
      <LandingRailing from={HALL.minX} to={-STAIR.halfW - 0.15} />
      <LandingRailing from={STAIR.halfW + 0.15} to={HALL.maxX} />

      {[-5.4, -2.4, 0.6, 3.6, 6.4].map((z) => (
        <group key={`cl${z}`}>
          <Candle position={[HALL.minX + 0.45, 0, z]} />
          <Candle position={[HALL.maxX - 0.45, 0, z]} />
        </group>
      ))}
      <Candle position={[-STAIR.halfW - 0.55, STAIR.topY, HALL.minZ + 0.7]} />
      <Candle position={[STAIR.halfW + 0.55, STAIR.topY, HALL.minZ + 0.7]} />

      <Portrait
        position={[-4.5, 2.4, HALL.maxZ - 0.06]}
        rotationY={Math.PI}
        seed={1}
      />
      <Portrait
        position={[4.5, 2.4, HALL.maxZ - 0.06]}
        rotationY={Math.PI}
        seed={2}
      />
      <Portrait
        position={[HALL.minX + 0.06, 2.6, 4.5]}
        rotationY={Math.PI / 2}
        seed={3}
      />
      <Portrait
        position={[HALL.maxX - 0.06, 2.6, 4.5]}
        rotationY={-Math.PI / 2}
        seed={4}
      />
      <Portrait
        position={[HALL.minX + 0.06, 2.6, -1]}
        rotationY={Math.PI / 2}
        seed={5}
      />
      <Portrait
        position={[HALL.maxX - 0.06, 2.6, -1]}
        rotationY={-Math.PI / 2}
        seed={6}
      />

      {DOORS.map((d) => (
        <Door
          key={d.id}
          x={d.x}
          locked={d.locked}
          state={lockedMsg === d.id ? "lockedMsg" : "idle"}
          opening={opening && d.id === "right"}
          showPrompt={active && !opening && nearDoor === d.id}
        />
      ))}

      <Flashlight enabled={flashlight} />
      <FpsControls
        active={active && !opening}
        bounds={BOUNDS}
        floorAt={floorAt}
        spawn={SPAWN}
        onFrame={handleFrame}
      />
    </>
  );
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
        color="#fff3d6"
        intensity={enabled ? 105 : 0}
        distance={24}
        angle={0.62}
        penumbra={0.42}
        decay={2}
      />
    </>
  );
}
