import { useGLTF, Center } from "@react-three/drei";

export default function Mansion() {
  const { scene } = useGLTF("/models/mansion.glb");

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

useGLTF.preload("/models/mansion.glb");