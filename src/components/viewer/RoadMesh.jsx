import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { coordinatesToThreeShape, calculateCentroid } from '../../utils/geometryUtils';

export default function RoadMesh({ road }) {
  const shape = useMemo(() => coordinatesToThreeShape(road.coordinates), [road.coordinates]);
  const centroid = useMemo(() => calculateCentroid(road.coordinates), [road.coordinates]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.1,
    bevelEnabled: false
  }), []);

  return (
    <group>
      {/* 3D Road Plane Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#334155" // Dark asphalt slate
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Road Label */}
      <Html position={[centroid[0], 0.4, centroid[1]]} center distanceFactor={80}>
        <div className="road-label">
          <span>{road.name}</span>
        </div>
      </Html>
    </group>
  );
}

export function GreenAreaMesh({ area }) {
  const shape = useMemo(() => coordinatesToThreeShape(area.coordinates), [area.coordinates]);
  const centroid = useMemo(() => calculateCentroid(area.coordinates), [area.coordinates]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.25,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 1
  }), []);

  return (
    <group>
      {/* Green Lawn Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#15803d" // Lush park grass green
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Decorative 3D Trees on Park */}
      <Tree3D position={[centroid[0] - 8, 0.25, centroid[1] - 4]} />
      <Tree3D position={[centroid[0] + 8, 0.25, centroid[1] + 3]} />
      <Tree3D position={[centroid[0], 0.25, centroid[1] - 5]} />

      <Html position={[centroid[0], 0.6, centroid[1]]} center distanceFactor={70}>
        <div className="park-label">
          <span>🌳 {area.name}</span>
        </div>
      </Html>
    </group>
  );
}

function Tree3D({ position }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 2.4, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.8, 3.5, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
    </group>
  );
}
