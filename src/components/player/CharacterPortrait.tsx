import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { CharacterId } from "../../data/characters";
import CharacterModel from "../scene/CharacterModel";

export default function CharacterPortrait({ id }: { id: CharacterId }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.915, 0.62], fov: 24, near: 0.05, far: 10 }}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)} style={{ background: "transparent" }}>
      <hemisphereLight args={["#c8b4ff", "#40204a", 1.6]} />
      <directionalLight position={[1.2, 1.6, 2]} intensity={2.2} color="#ffe2c0"/>

      <directionalLight position={[-1.5, 1, -1]} intensity={1.2} color="#a070ff"/>

      <Suspense fallback={null}>
        <CharacterModel key={id} id={id} height={1} breathe={false} />
      </Suspense>
    </Canvas>
  );
}