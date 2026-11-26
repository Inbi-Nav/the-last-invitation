import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { fitScale, type ItemPiece } from "./itemPieces";

function Turntable({ piece }: { piece: ItemPiece }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.5;
  });
  return (
    <group ref={spin} rotation={[0, -0.5, 0]}>
      <mesh geometry={piece.geometry} material={piece.material} rotation={[Math.PI / 2, 0, 0]} scale={fitScale(piece, 2.1)}/>
    </group>
  );
}

export default function ItemPreview({ piece }: { piece: ItemPiece }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 4.4], fov: 28 }}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}>
      <hemisphereLight args={["#ffffff", "#7a5a8a", 2.2]}/>

      <directionalLight position={[1.5, 2, 3]} intensity={2.6} color="#fff0dd"/>

      <directionalLight position={[-2, -1, 2]} intensity={0.9} color="#b080ff"/>

      <Turntable key={piece.geometry.uuid} piece={piece}/>

      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={(2 * Math.PI) / 3}/>
    </Canvas>
  );
}