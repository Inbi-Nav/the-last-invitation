import { createContext, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createStorm, stepStorm, STORM } from "../../utils/storm";
import { sound } from "../../audio/SoundEngine";

interface StormFlash {
  flashing: { current: boolean };
}

export const StormFlashContext = createContext<StormFlash>({
  flashing: { current: false },
});

export default function CinematicStorm({ children }: { children?: ReactNode }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const storm = useRef(createStorm());
  const flashing = useRef(false);
  const value = useMemo(() => ({ flashing }), []);

  useFrame((_, delta) => {
    const intensity = stepStorm(storm.current, Math.min(delta, 0.1), () => {
      sound.thunder(0.05);
      sound.thunder(1.2);
      if (Math.random() < 0.4) sound.crow();
    });
    flashing.current = intensity >= STORM.flashIntensity;
    if (light.current) light.current.intensity = intensity;
  });

  return (
    <StormFlashContext.Provider value={value}>
      <directionalLight
        ref={light}
        position={[-30, 40, 20]}
        color="#d1d9ff"
        intensity={0}
      />
      {children}
    </StormFlashContext.Provider>
  );
}
