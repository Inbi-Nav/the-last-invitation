import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { StormState } from "../../utils/storm";
import { stepStorm } from "../../utils/storm";
import { sound } from "../../audio/SoundEngine";

export default function GameStorm({
  storm,
}: {
  storm: { current: StormState };
}) {
  const light = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    const intensity = stepStorm(storm.current, Math.min(delta, 0.1), () => {
      sound.thunder(0.05);
      sound.thunder(1.2);
      if (Math.random() < 0.5) sound.crow();
    });
    if (light.current) light.current.intensity = intensity;
    if (fill.current)
      fill.current.intensity = storm.current.flashing ? 0.55 : 0;
  });

  return (
    <>
      <directionalLight ref={light} position={[-38, 46, 30]} color="#d1d9ff" intensity={0}/>
      
      <ambientLight ref={fill} color="#b9a8ff" intensity={0} />
    </>
  );
}
