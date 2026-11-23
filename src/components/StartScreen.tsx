import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import MansionScene from "./MansionScene";
import styles from "./StartScreen.module.css";

interface Props {
  onStart: () => void;
}

export default function StartScreen({ onStart }: Props) {
  const flashRef = useRef<HTMLDivElement | null>(null);

  return (
    <main className={styles.root}>
      <Canvas className={styles.canvas} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 48, near: 0.1, far: 180, position: [0, 5, 17] }}>
        <Suspense fallback={null}>
          <MansionScene flashRef={flashRef} />
        </Suspense>
      </Canvas>

      <div className={styles.scrim} />
      <div ref={flashRef} className={styles.flash} />

      <section className={styles.content} aria-label="Start game">
        <div className={styles.heading}>
          <div className={styles.ornament} aria-hidden="true">
            <span /><span className={styles.symbol}>⚜</span><span />
          </div>
          <h1 className={styles.title}>
            <span>The Last</span>
            <span>Invitation</span>
          </h1>
          <div className={styles.ornament} aria-hidden="true">
            <span /><span className={styles.symbol}>✦</span><span />
          </div>
        </div>
        <button className={styles.startButton} type="button" onClick={onStart}>
          Start
        </button>
      </section>
    </main>
  );
}