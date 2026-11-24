import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sound } from "../../audio/SoundEngine";

interface BirdProps {
  position: [number, number, number];
  speed: number;
  delay: number;
  scale: number;
}

function Bird({ position, speed, delay, scale }: BirdProps) {
  const bird = useRef<THREE.Group>(null);
  const leftWing = useRef<THREE.Mesh>(null);
  const rightWing = useRef<THREE.Mesh>(null);
  const lastLoop = useRef(-1);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + delay;
    const progress = (t % 18) / 18;

    // wing flutter each time this bird starts a new pass across the sky
    const loop = Math.floor(t / 18);
    if (lastLoop.current !== -1 && loop !== lastLoop.current) {
      if (Math.random() < 0.6) sound.flutter();
    }
    lastLoop.current = loop;

    if (bird.current) {
      bird.current.position.set(
        position[0] + 12 - progress * 24,
        position[1] - progress * 3.5 + Math.sin(t * 2) * 0.15,
        position[2] + progress * 3,
      );
    }

    const flap = Math.sin(t * 9) * 0.55;

    if (leftWing.current) {
      leftWing.current.rotation.z = flap;
    }

    if (rightWing.current) {
      rightWing.current.rotation.z = -flap;
    }
  });

  const wingGeometry = new THREE.BufferGeometry();

  wingGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [0, 0, 0, -0.45, 0.18, 0, -0.95, -0.05, 0],
      3,
    ),
  );

  const material = new THREE.MeshBasicMaterial({
    color: "#181818",
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return (
    <group ref={bird} scale={scale}>
      <mesh ref={leftWing} geometry={wingGeometry} material={material} />

      <mesh ref={rightWing} material={material}>
        <primitive attach="geometry" object={wingGeometry} />
        <group scale={[-1, 1, 1]} />
      </mesh>
    </group>
  );
}

export default function FlyingBirds() {
  return (
    <group>
      <Bird position={[0, 9, 2]} speed={1.1} delay={0} scale={1.2} />
      <Bird position={[1, 10, 1]} speed={1.0} delay={2} scale={0.9} />
      <Bird position={[-1, 8, 2]} speed={1.2} delay={4} scale={1.1} />
      <Bird position={[2, 11, 0]} speed={0.9} delay={6} scale={1.0} />
      <Bird position={[0, 9, 1]} speed={1.1} delay={8} scale={1.3} />
    </group>
  );
}
