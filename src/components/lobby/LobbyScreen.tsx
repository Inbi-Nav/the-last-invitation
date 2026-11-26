import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useAmbience } from "../../audio/useSound";
import { usePlayer } from "../../state/PlayerContext";
import HallBackdrop from "../scene/HallBackdrop";
import CharacterModel from "../scene/CharacterModel";
import { HALL_CAM, placeOnScreen } from "../scene/placement";
import { useThree } from "@react-three/fiber";
import { IconBriefcase, IconExit, IconGear, IconUser } from "../ui/icons";
import { IconButton, PlateButton, TitleLogo } from "../ui/Gothic";
import SettingsModal from "../ui/SettingsModal";
import GhostLayer from "./GhostLayer";
import styles from "./LobbyScreen.module.css";

function LobbyCharacter() {
  const { selectedId } = usePlayer();
  const size = useThree((s) => s.size);
  const { position, height } = placeOnScreen(
    HALL_CAM,
    size.width / size.height,
    0,
    -0.7,
    0.45,
    0.62,
  );
  return (
    <group position={position}>
      <CharacterModel key={selectedId} id={selectedId} height={height} />
    </group>
  );
}

interface Props {
  onInventory: () => void;
  onPlayer: () => void;
  onStart: () => void;
  onExit: () => void;
}

export default function LobbyScreen({ onInventory, onPlayer, onExit }: Props) {
  const [settings, setSettings] = useState(false);
  const [ready, setReady] = useState(false);
  useAmbience("lobby");

  return (
    <div className={`${styles.screen} ${ready ? styles.ready : ""}`}>
      <Canvas className={styles.canvas} dpr={[1, 1.5]}
        camera={{
          position: HALL_CAM.pos,
          fov: HALL_CAM.fov,
          near: 0.01,
          far: 50,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,
        }}
        onCreated={() => setReady(true)}>
        <Suspense fallback={null}>
          <HallBackdrop cam={HALL_CAM}>
            <LobbyCharacter />
            <GhostLayer cam={HALL_CAM} />
          </HallBackdrop>
        </Suspense>
      </Canvas>

      <div className={styles.grade} />
      <div className={styles.vignette} />

      <TitleLogo className={styles.logo} />

      <div className={styles.bottomLeft}>
        <IconButton label="Inventory" shape="hex" onClick={onInventory}>
          <IconBriefcase />
        </IconButton>
        <IconButton label="Select player" shape="hex" onClick={onPlayer}>
          <IconUser />
        </IconButton>
      </div>

      <div className={styles.topRight}>
        <IconButton label="Settings" onClick={() => setSettings(true)}>
          <IconGear />
        </IconButton>
        <IconButton label="Exit to title" onClick={onExit}>
          <IconExit />
        </IconButton>
      </div>
      <div className={styles.start} style={{ pointerEvents: "none" }}>
        <PlateButton onClick={() => {}}>Start Game</PlateButton>
      </div>

      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}