import { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {CHARACTERS, STAT_LABELS, STAT_ORDER, type StatKey,} from "../../data/characters";
import { useAmbience } from "../../audio/useSound";
import { usePlayer } from "../../state/PlayerContext";
import HallBackdrop from "../scene/HallBackdrop";
import CharacterModel, { preloadCharacters } from "../scene/CharacterModel";
import { HALL_CAM, placeOnScreen } from "../scene/placement";
import { Divider, Gem, GothicPanel, IconButton, PlateButton,} from "../ui/Gothic";
import { IconBack, IconBolt, IconBrain, IconCheck, IconChevronLeft, IconChevronRight, IconEye, IconPuzzle, IconShield,} from "../ui/icons";
import CharacterPortrait from "./CharacterPortrait";
import styles from "./PlayerScreen.module.css";

const STAT_ICONS: Record<StatKey, () => React.ReactElement> = {
  intelligence: () => <IconBrain />,
  observation: () => <IconEye />,
  agility: () => <IconBolt />,
  courage: () => <IconShield />,
  problemSolving: () => <IconPuzzle />,
};

function PreviewCharacter({ id }: { id: string }) {
  const size = useThree((s) => s.size);
  const { position, height } = placeOnScreen(
    HALL_CAM,
    size.width / size.height,
    0,
    -0.55,
    0.66,
    0.5,
  );
  const char = CHARACTERS.find((c) => c.id === id)!;
  return (
    <group position={position}>
      <CharacterModel key={char.id} id={char.id} height={height} />
    </group>
  );
}

export default function PlayerScreen({ onBack }: { onBack: () => void }) {
  const { selectedId, select } = usePlayer();
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      CHARACTERS.findIndex((c) => c.id === selectedId),
    ),
  );
  const [ready, setReady] = useState(false);
  const current = CHARACTERS[index];
  const confirmed = current.id === selectedId;
  useAmbience("lobby");

  useEffect(() => {
    preloadCharacters();
  }, []);

  const step = (d: number) =>
    setIndex((i) => (i + d + CHARACTERS.length) % CHARACTERS.length);
  const confirm = () => select(current.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Enter") select(CHARACTERS[index].id);
      else if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onBack, select]);

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
        }} onCreated={() => setReady(true)}>
        <Suspense fallback={null}>
          <HallBackdrop cam={HALL_CAM}>
            <Suspense fallback={null}>
              <PreviewCharacter id={current.id} />
            </Suspense>
          </HallBackdrop>
        </Suspense>
      </Canvas>
      <div className={styles.grade} />
      <div className={styles.vignette} />

      <header className={styles.top}>
        <IconButton
          label="Back to lobby"
          onClick={onBack}
          className={styles.back}>
          <IconBack />
        </IconButton>
        <div className={styles.mini}>
          <span>Last</span>
          <strong>Invitation</strong>
          <Gem size={10} />
        </div>
        <h1 className={styles.heading}>
          <Divider className={styles.hLine} />
          <span>Player Selection</span>
        </h1>
      </header>

      <section className={styles.left} aria-live="polite">
        <div className={styles.oval}>
          <div className={styles.ovalInner}>
            <CharacterPortrait id={current.id} />
          </div>
          <Gem className={styles.ovalGemTop} />
          <Gem className={styles.ovalGemBottom} />
        </div>
        <div className={styles.nameplate}>
          <h2>{current.name}</h2>
        </div>
        <div className={styles.parchment}>
          <p>{current.description}</p>
          <span className={styles.seal} aria-hidden>
            <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="#f1c9c9" strokeWidth="1.4" strokeLinejoin="round">
              <path d="M12 3c2 3 1 5 0 7 1 1 3 1 5-1 0 3-2 5-5 6 2 .3 3 2 1.5 3.8L12 20l-1.5-1.2C9 17 10 15.300 12 16c-3-1-5-3-5-6 2 2 4 2 5 1-1-2-2-4 0-8z"/ >
            </svg>
          </span>
        </div>
      </section>

      <GothicPanel className={styles.details}>
        <h2 className={styles.detailsTitle}>Character Details</h2>
        <ul className={styles.stats}>
          {STAT_ORDER.map((k) => (
            <li key={k} className={styles.stat}>
              <span className={styles.statIcon}>{STAT_ICONS[k]()}</span>
              <div className={styles.statBody}>
                <div className={styles.statHead}>
                  <span>{STAT_LABELS[k]}</span>
                  <b>{current.stats[k]} / 100</b>
                </div>
                <div className={styles.bar} role="progressbar" aria-label={STAT_LABELS[k]} aria-valuenow={current.stats[k]} aria-valuemin={0} aria-valuemax={100}>
                  <i style={{ width: `${current.stats[k]}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </GothicPanel>

      <nav className={styles.selector} aria-label="Choose player">
        <IconButton label="Previous player" shape="hex" onClick={() => step(-1)}>
          <IconChevronLeft />
        </IconButton>
        <PlateButton onClick={confirm} className={confirmed ? styles.confirmed : ""} aria-pressed={confirmed}>
          {confirmed ? (
            <>
              <IconCheck size={20} /> Selected
            </>
          ) : (
            "Select"
          )}
        </PlateButton>
        <IconButton label="Next player" shape="hex" onClick={() => step(1)}>
          <IconChevronRight />
        </IconButton>
      </nav>
    </div>
  );
}