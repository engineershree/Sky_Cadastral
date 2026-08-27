import React from 'react';

// Key coordinates along roads for street light placement
const STREET_LIGHT_POSITIONS = [
  // Along 60ft Main Boulevard
  [20, 0, 82],
  [60, 0, 82],
  [100, 0, 82],
  [160, 0, 82],
  [200, 0, 82],
  [240, 0, 82],
  [20, 0, 108],
  [60, 0, 108],
  [100, 0, 108],
  [160, 0, 108],
  [200, 0, 108],
  [240, 0, 108],
  // Along Central Entrance Way
  [118, 0, 20],
  [118, 0, 55],
  [118, 0, 135],
  [118, 0, 170],
  [142, 0, 20],
  [142, 0, 55],
  [142, 0, 135],
  [142, 0, 170]
];

export default function StreetLightMesh() {
  return (
    <group>
      {STREET_LIGHT_POSITIONS.map((pos, idx) => (
        <SingleStreetLight key={`light-${idx}`} position={pos} />
      ))}
    </group>
  );
}

function SingleStreetLight({ position }) {
  return (
    <group position={position}>
      {/* Base Foundation */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 0.3, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Vertical Metal Pole */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 3.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Horizontal Arm */}
      <mesh position={[0.25, 3.3, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
        <boxGeometry args={[0.6, 0.06, 0.08]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Luminaire Casing */}
      <mesh position={[0.5, 3.25, 0]} castShadow>
        <boxGeometry args={[0.25, 0.1, 0.16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Emissive Lamp Lens */}
      <mesh position={[0.5, 3.19, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.12]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fde047"
          emissiveIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* Soft Point Light Accent */}
      <pointLight
        position={[0.5, 3.1, 0]}
        intensity={0.6}
        distance={12}
        color="#fef3c7"
        decay={2}
      />
    </group>
  );
}
