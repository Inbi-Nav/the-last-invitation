// Straight-only wrought-iron railing modules for the exterior path.
// The original mixed GLB geometry is not instantiated.
// Adjust these positions to the real path edges if necessary.
export const PATH_HALF_WIDTH = 3.45;
export const PATH_START_Z = 13.0;
export const PATH_END_Z = -21.0;
const RAIL_TOP = 1.5;
const GOLD = "#9c825d";
const IRON = "#29232c";

function RailPanel({ length }: { length: number }) {
  const bars = Math.max(2, Math.round(length / 0.32));
  return (
    <group>
      <mesh position={[0, RAIL_TOP, 0]}>
        <boxGeometry args={[length, 0.075, 0.09]} />
        <meshStandardMaterial color={GOLD} metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[length, 0.06, 0.07]} />
        <meshStandardMaterial color={IRON} metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: bars + 1 }, (_, i) => {
        const x = -length / 2 + (i / bars) * length;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 1.2, 6]} />
              <meshStandardMaterial color={IRON} metalness={0.82} roughness={0.29}/>
            </mesh>
            <mesh position={[0, 1.55, 0]}>
              <coneGeometry args={[0.07, 0.22, 5]} />
              <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3}/>
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Post({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.24, 1.6, 0.24]} />
        <meshStandardMaterial color="#30272f" roughness={0.75} metalness={0.2}/>
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <boxGeometry args={[0.33, 0.12, 0.33]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Side({ x }: { x: number }) {
  const segment = 3.4;
  const count = Math.ceil((PATH_START_Z - PATH_END_Z) / segment);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const zA = PATH_START_Z - i * segment;
        const zB = Math.max(PATH_END_Z, zA - segment);
        return (
          <group key={i}>
            <group position={[x, 0, (zA + zB) / 2]} rotation={[0, Math.PI / 2, 0]}>
              <RailPanel length={zA - zB} />
            </group>
            <Post x={x} z={zA} />
            {i === count - 1 && <Post x={x} z={zB} />}
          </group>
        );
      })}
    </group>
  );
}

export default function ExteriorFence() {
  return (
    <group>
      <Side x={-PATH_HALF_WIDTH} />
      <Side x={PATH_HALF_WIDTH} />
    </group>
  );
}
