import { Sparkles, Stars, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ASSETS = {
  moon: "/architecture/moon.glb",
  path: "/architecture/outside-path.glb",
  railing: "/architecture/outside-railing.glb",
  lamp: "/architecture/lamp.glb",
};

type Props = {
  centerX: number;
  centerZ: number;
  frontZ: number;
  groundY: number;
  mansionHeight: number;
};

type FittedAssetProps = {
  source: THREE.Object3D;
  position: [number, number, number];
  maxLength?: number;
  maxHeight?: number;
  rotationY?: number;
  pivot?: "bottom" | "center";
};

function FittedAsset({
  source,
  position,
  maxLength,
  maxHeight,
  rotationY = 0,
  pivot = "bottom",
}: FittedAssetProps) {
  const object = useMemo(() => {
    const model = source.clone(true);
    const rotated = new THREE.Group();
    rotated.add(model);
    rotated.rotation.y = rotationY;
    rotated.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(rotated);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const midpoint = bounds.getCenter(new THREE.Vector3());
    const factor = maxHeight !== undefined
      ? maxHeight / Math.max(dimensions.y, 0.001)
      : maxLength !== undefined
        ? maxLength / Math.max(dimensions.z, 0.001)
        : 1;

    const normalized = new THREE.Group();
    rotated.position.set(-midpoint.x, pivot === "center" ? -midpoint.y : -bounds.min.y, -midpoint.z);
    normalized.scale.setScalar(factor);
    normalized.add(rotated);
    return normalized;
  }, [source, maxLength, maxHeight, rotationY, pivot]);

  return <primitive object={object} position={position} />;
}

function BareTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const segments = useMemo(() => {
    const branches: { from: THREE.Vector3; to: THREE.Vector3; radius: number }[] = [];
    const add = (a: [number, number, number], b: [number, number, number], radius: number) => {
      branches.push({ from: new THREE.Vector3(...a), to: new THREE.Vector3(...b), radius });
    };
    add([0, 0, 0], [0.1, 5.4, 0], 0.29);
    add([0.1, 3.4, 0], [-2.4, 6.5, 0.2], 0.16);
    add([0.1, 4.5, 0], [2.3, 7.1, -0.4], 0.17);
    add([0.1, 5.4, 0], [-0.3, 8.9, 0.3], 0.14);
    add([-2.4, 6.5, 0.2], [-4.6, 8.2, 0], 0.07);
    add([-2.4, 6.5, 0.2], [-2.9, 9.2, 0.5], 0.07);
    add([2.3, 7.1, -0.4], [4.5, 9.4, -0.3], 0.07);
    add([2.3, 7.1, -0.4], [2.5, 10.2, -0.6], 0.07);
    add([-0.3, 8.9, 0.3], [-1.3, 11.2, 0], 0.055);
    return branches;
  }, []);

  return (
    <group position={position} scale={scale}>
      {segments.map(({ from, to, radius }, index) => {
        const vector = new THREE.Vector3().subVectors(to, from);
        const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), vector.clone().normalize()
        );
        return (
          <mesh key={index} position={midpoint} quaternion={quaternion}>
            <cylinderGeometry args={[radius * 0.55, radius, vector.length(), 6]} />
            <meshStandardMaterial color="#100c17" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

const mistVertex = ` varying vec2 vUv;
 void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const mistFragment = `
 uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * vec2(7.0, 3.0);
    float wave = sin(p.x * 2.8 + uTime * 0.15) * sin(p.y * 4.5 - uTime * 0.12);
    float edge = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.70, 1.0, vUv.y));
    edge *= smoothstep(0.0, 0.14, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));
    float opacity = edge * (0.18 + 0.17 * wave);
    gl_FragColor = vec4(0.48, 0.33, 0.68, max(0.0, opacity));
  }
`;

function GroundMist({ position }: { position: [number, number, number] }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: mistVertex,
    fragmentShader: mistFragment,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), []);
  useFrame(({ clock }) => { material.uniforms.uTime.value = clock.getElapsedTime(); });
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <planeGeometry args={[24, 12]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function MansionEnvironment({ centerX, centerZ, frontZ, groundY, mansionHeight }: Props) {
  const moon = useGLTF(ASSETS.moon);
  const path = useGLTF(ASSETS.path);
  const railing = useGLTF(ASSETS.railing);
  const lamp = useGLTF(ASSETS.lamp);
  const pathStart = frontZ + 0.35;
  const pathLength = 6.6;
  const pathCenter = pathStart + pathLength / 2;
  const railingRotation = useMemo(() => {
    const dims = new THREE.Box3().setFromObject(railing.scene).getSize(new THREE.Vector3());
    return dims.x > dims.z ? Math.PI / 2 : 0;
  }, [railing.scene]);

  const lamps: [number, number, number][] = [
    [centerX - 3.3, groundY, pathStart + 0.6],
    [centerX + 3.3, groundY, pathStart + 0.6],
    [centerX - 3.8, groundY, pathStart + 4.5],
    [centerX + 3.8, groundY, pathStart + 4.5],
  ];

  return (
    <group>
      <Stars radius={75} depth={30} count={450} factor={1.5} fade speed={0.08} />
      <FittedAsset source={moon.scene} position={[centerX - 8, groundY + mansionHeight + 1.2, centerZ - 4]} maxHeight={2.4} pivot="center"/>

      <pointLight position={[centerX - 8, groundY + mansionHeight + 1.2, centerZ - 3]} color="#b4a2da" intensity={9} distance={18}/>

      <FittedAsset source={path.scene} position={[centerX, groundY + 0.03, pathCenter]} maxLength={pathLength}/>
      {[-1, 1].map((side) => (
        <FittedAsset key={side} source={railing.scene} position={[centerX + side * 3.3, groundY, pathCenter]} maxLength={pathLength} rotationY={railingRotation + (side > 0 ? Math.PI : 0)}/>
      ))}

      {lamps.map((position, index) => (
        <group key={index}>
          <FittedAsset source={lamp.scene} position={position} maxHeight={2.25} />
          <pointLight  position={[position[0], position[1] + 1.85, position[2]]} color="#ffb16d" intensity={13} distance={6} decay={2}/>
        </group>
      ))}

      <BareTree position={[centerX - 10.5, groundY, frontZ + 1.4]} scale={1.15} />
      <BareTree position={[centerX + 10.5, groundY, frontZ + 1.4]} scale={1.1} />
      <GroundMist position={[centerX, groundY + 0.12, pathStart + 3]} />
      <Sparkles count={35} scale={[20, 4, 13]} position={[centerX, groundY + 2.4, pathCenter]} size={1.5} speed={0.11} opacity={0.22} color="#cba3df"/>
    </group>
  );
}

Object.values(ASSETS).forEach((path) => useGLTF.preload(path));