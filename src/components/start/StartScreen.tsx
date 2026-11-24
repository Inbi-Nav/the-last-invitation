import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useCallback, useState } from "react";
import * as THREE from "three";
import MansionScene from "./MansionScene";
import MansionEnvironment, { MoonLayer } from "./MansionEnvironment";
import styles from "./StartScreen.module.css";
import { sound } from "../../audio/SoundEngine";
import { uiSound, useAmbience } from "../../audio/useSound";
import SoundToggle from "../ui/SoundToggle";

const LOOK_AT = new THREE.Vector3(1.4, 5.2, 0);
const CAM_BASE = new THREE.Vector3(-2.4, 2.4, 17);

function CameraRig() {
  useFrame(({ camera }) => {
    camera.position.copy(CAM_BASE);
    camera.lookAt(LOOK_AT);
  });

  return null;
}

function Ornament({ flip = false }: { flip?: boolean }) {
  return (
    <svg className={`${styles.ornament} ${flip ? styles.flip : ""}`} viewBox="0 0 400 40" aria-hidden>
      <path d="M10 20 H160" />
      <path d="M240 20 H390" />
      <path d="M160 20 C175 5, 190 5, 200 20 C210 5, 225 5, 240 20" />
      <path d="M160 20 C175 35, 190 35, 200 20 C210 35, 225 35, 240 20" />
      <path d="M200 4 L206 20 L200 36 L194 20 Z" className={styles.fill} />
      <circle cx="140" cy="20" r="3" className={styles.fill} />
      <circle cx="260" cy="20" r="3" className={styles.fill} />
      <path d="M60 20 C80 10, 100 10, 120 20 M280 20 C300 10, 320 10, 340 20" />
    </svg>
  );
}

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  useAmbience("exterior");

  const handleStart = () => {
    if (leaving) return;
    sound.unlock();
    sound.startSting();
    sound.flutter();
    setLeaving(true);
    window.setTimeout(onStart, 1400);
  };

  return (
    <div className={`${styles.screen} ${leaving ? styles.leaving : ""}`} data-scene-ready={ready || undefined}>
      
      <Canvas className={styles.canvas} shadows dpr={[1, 1.75]}  camera={{ 
        position: CAM_BASE.toArray(), 
        fov: 42, 
        near: 0.1, far: 200 
      }} 
      gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}>

        <MansionEnvironment />
        <CameraRig />
        <Suspense fallback={null}>
          <MoonLayer />
          <MansionScene onReady={handleReady} />
        </Suspense>
      </Canvas>

      <div className={styles.vignette} />

      <div className={styles.soundToggle}>
        <SoundToggle />
      </div>

      <div className={styles.ui}>
        <Ornament />
        <h1 className={styles.title}>
          <span className={styles.small}>The Last</span>
          <span className={styles.big}>Invitation</span>
        </h1>
        <Ornament flip />
        <button type="button" className={styles.start} {...uiSound} onClick={handleStart}>
          <span>Start</span>
        </button>
      </div>

      {!ready && <div className={styles.loading}>Loading…</div>}
    </div>
  );
}