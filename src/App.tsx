import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import Mansion from "./components/Masion";

export default function App() {
  return (
    <Canvas
      camera={{
        position: [0, 5, 12],
        fov: 45,
      }}
      style={{
        width: "100vw",
        height: "100vh",
     }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2} />

      <Suspense fallback={null}>
        <Mansion />
      </Suspense>

      <OrbitControls />
    </Canvas>
  );
}