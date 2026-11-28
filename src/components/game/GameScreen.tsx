import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { GAME_FOV } from "../../game/prepareAsset";
import { sound } from "../../audio/SoundEngine";
import { useAmbience } from "../../audio/useSound";
import ExteriorSet from "./ExteriorSet";
import IntroCinematic from "./IntroCinematic";
import EntranceTransition from "./EntranceTransition";
import MansionInterior from "./MansionInterior";
import HauntedRoom from "./HauntedRoom";
import GameStorm from "./GameStorm";
import GhostFigures from "./GhostFigures";
import InstructionsPanel from "./InstructionsPanel";
import GameSettingsMenu from "./GameSettingsMenu";
import { createStorm } from "../../utils/storm";
import { IconButton } from "../ui/Gothic";
import { IconGear } from "../ui/icons";
import styles from "./GameScreen.module.css";

type Phase = "loading" | "cinematic" | "arrived" | "interior" | "exploring" | "room";

export default function GameScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [whiteIn, setWhiteIn] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsMode, setInstructionsMode] = useState<"start" | "back">("start");
  const [menuOpen, setMenuOpen] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [roomFade, setRoomFade] = useState(false);
  const storm = useRef(createStorm());

  const inside = phase === "interior" || phase === "exploring" || phase === "room";
  useAmbience(inside ? "interior" : "exterior");

  const begin = useCallback(() => {
    setPhase("cinematic");
    sound.unlock();
    sound.startSting();
    sound.thunder(0.9);
  }, []);

  const arrive = useCallback(() => setPhase("arrived"), []);
  const onWhite = useCallback(() => setWhiteIn(true), []);

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

  useEffect(() => {
    if (!inside || menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyF") setFlashlight((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inside, menuOpen]);

  const fpsActive =
    (phase === "exploring" || phase === "room") && !menuOpen && !showInstructions && !roomFade;

  const dismissInstructions = useCallback(() => {
    setShowInstructions(false);
    if (instructionsMode === "start") setPhase("exploring");
  }, [instructionsMode]);

  const enterRoom = useCallback(() => {
    setRoomFade(true);
    sound.doorCreak();
    window.setTimeout(() => {
      setPhase("room");
      setRevealed(true);
      window.setTimeout(() => setRoomFade(false), 350);
    }, 1100);
  }, []);

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
          {!inside && (
            <>
              <ExteriorSet />
              {(phase === "loading" || phase === "cinematic") && (
                <IntroCinematic onStart={begin} onArrive={arrive} />
              )}
              <GameStorm storm={storm} />
              <GhostFigures storm={storm} />
              {phase === "arrived" && <EntranceTransition onWhite={onWhite} />}
            </>
          )}
          {phase === "interior" || phase === "exploring" ? (
            <MansionInterior
              active={fpsActive}
              flashlight={flashlight}
              onEnterRoom={enterRoom}
            />
          ) : null}
          {phase === "room" && (
            <HauntedRoom active={fpsActive} flashlight={flashlight} />
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

      <div
        className={styles.zoneFade}
        style={{
          opacity: roomFade ? 1 : 0,
          transition: roomFade ? "opacity 1s ease" : "opacity 0.9s ease",
        }}
      />

      {showInstructions && !menuOpen && (
        <InstructionsPanel onStart={dismissInstructions} />
      )}

      {inside && (
        <div className={styles.equipment}>
          <span>Flashlight</span>
          <b>{flashlight ? "ON" : "OFF"}</b>
          <em>[F]</em>
        </div>
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