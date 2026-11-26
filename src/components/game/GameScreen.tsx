import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GAME_FOV } from "../../game/prepareAsset";
import ExteriorSet from "./ExteriorSet";
import IntroCinematic from "./IntroCinematic";
import styles from "./GameScreen.module.css";

type Phase = "loading" | "cinematic" | "arrived";


export default function GameScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const begin = useCallback(() => setPhase("cinematic"), []);
  const arrive = useCallback(() => setPhase("arrived"), []);

  return (
    <div className={styles.screen}>
      <Canvas dpr={[1, 1.75]} shadows gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: GAME_FOV, near: 0.06, far: 260, position: [0, 12, 0] }}
 onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
        }}>
        <Suspense fallback={null}>
          <ExteriorSet />
          <IntroCinematic onStart={begin} onArrive={arrive} />
        </Suspense>
      </Canvas>

      {phase === "loading" && (
        <div className={styles.loader}>Preparing the mansion…</div>
      )}

      <button type="button" className={styles.exit} onClick={onExit}>
        Exit to Lobby
      </button>

      {phase === "arrived" && (
        <p className={styles.arrived}>The entrance awaits…</p>
      )}
    </div>
  );
}