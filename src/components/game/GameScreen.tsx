import { Suspense, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GAME_FOV } from "../../game/prepareAsset";
import ExteriorSet from "./ExteriorSet";
import IntroCinematic from "./IntroCinematic";
import EntranceTransition from "./EntranceTransition";
import MansionInterior from "./MansionInterior";
import InstructionsPanel from "./InstructionsPanel";
import GameSettingsMenu from "./GameSettingsMenu";
import { loadInterior } from "./interiorModel";
import { IconButton } from "../ui/Gothic";
import { IconGear } from "../ui/icons";
import styles from "./GameScreen.module.css";

type Phase = "loading" | "cinematic" | "arrived" | "interior" | "exploring";
type InstructionsMode = "start" | "back";

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [whiteIn, setWhiteIn] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsMode, setInstructionsMode] = useState<InstructionsMode>("start");
  const [menuOpen, setMenuOpen] = useState(false);

  const begin = useCallback(() => setPhase("cinematic"), []);
  const arrive = useCallback(() => setPhase("arrived"), []);
  const onWhite = useCallback(() => setWhiteIn(true), []);

  useEffect(() => {
    loadInterior().catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "arrived") return;
    const id = window.setTimeout(() => setPhase("interior"), 2600);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "interior") return;
    const a = window.setTimeout(() => setRevealed(true), 650);
    const b = window.setTimeout(() => {
      setInstructionsMode("start");
      setShowInstructions(true);
    }, 2100);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [phase]);

  const fpsActive = phase === "exploring" && !menuOpen && !showInstructions;
  const inside = phase === "interior" || phase === "exploring";

  const dismissInstructions = useCallback(() => {
    setShowInstructions(false);
    if (instructionsMode === "start") setPhase("exploring");
  }, [instructionsMode]);

  return (
    <div className={styles.screen}>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: GAME_FOV, near: 0.06, far: 260, position: [0, 12, 0] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
        }}
      >
        <Suspense fallback={null}>
          {inside ? (
            <MansionInterior active={fpsActive} />
          ) : (
            <>
              <ExteriorSet />
              <IntroCinematic onStart={begin} onArrive={arrive} />
              {phase === "arrived" && <EntranceTransition onWhite={onWhite} />}
            </>
          )}
        </Suspense>
      </Canvas>

      {phase === "loading" && (
        <div className={styles.loader}>Preparing the mansion…</div>
      )}

      <div
        className={styles.whiteFade}
        style={{ opacity: whiteIn && phase === "arrived" ? 1 : 0 }}
      />

      {inside && (
        <div
          className={styles.darkFade}
          style={{
            opacity: revealed ? 0 : 1,
            transition: revealed ? "opacity 1.6s ease" : "none",
          }}
        />
      )}

      {showInstructions && !menuOpen && (
        <InstructionsPanel mode={instructionsMode} onDismiss={dismissInstructions} />
      )}

      <div className={styles.topRight}>
        <IconButton
          label="Settings"
          onClick={() => {
            document.exitPointerLock?.();
            setMenuOpen(true);
          }}
        >
          <IconGear />
        </IconButton>
      </div>

      {menuOpen && (
        <GameSettingsMenu
          onClose={() => setMenuOpen(false)}
          onShowControls={() => {
            setMenuOpen(false);
            setInstructionsMode("back");
            setShowInstructions(true);
          }}
          onExit={onExit}
        />
      )}
    </div>
  );
}
