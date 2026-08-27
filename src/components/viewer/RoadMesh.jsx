import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { coordinatesToThreeShape, calculateCentroid } from '../../utils/geometryUtils';

export default function RoadMesh({ road }) {
  const shape = useMemo(() => coordinatesToThreeShape(road.coordinates), [road.coordinates]);
  const centroid = useMemo(() => calculateCentroid(road.coordinates), [road.coordinates]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.12,
    bevelEnabled: false
  }), []);

  const isMainBoulevard = road.id === 'road-main-entrance' || road.id === 'road-18m-top' || road.id === 'road-12m-middle-top' || road.id === 'road-12m-middle-bottom';
  const isEntranceWay = road.id === 'road-18m-central-vertical';

  return (
    <group>
      {/* 3D Development Asphalt Road Bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color="#334155" // Real slate asphalt texture
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Concrete Curb Borders */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })]} />
        <lineBasicMaterial color="#64748b" linewidth={1.5} />
      </lineSegments>

      {/* Main Boulevard Center Lane Markings */}
      {isMainBoulevard && (
        <group position={[130, 0.14, 95]}>
          {Array.from({ length: 22 }).map((_, idx) => (
            <mesh key={`dash-mb-${idx}`} position={[-120 + idx * 11, 0, 0]}>
              <boxGeometry args={[5.5, 0.01, 0.4]} />
              <meshStandardMaterial color="#fef08a" roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {/* Entrance Way Center Lane Markings & Entrance Arch */}
      {isEntranceWay && (
        <group position={[130, 0.14, 95]}>
          {Array.from({ length: 17 }).map((_, idx) => (
            <mesh key={`dash-ew-${idx}`} position={[0, 0, -85 + idx * 10.5]}>
              <boxGeometry args={[0.4, 0.01, 5]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          ))}

          {/* Grand Entrance Gate Monument */}
          <EntranceGateArch position={[0, -0.14, -89]} />
        </group>
      )}

      {/* Road HTML Label */}
      <Html position={[centroid[0], 0.45, centroid[1]]} center distanceFactor={70}>
        <div className="road-label">
          <span>🛣️ {road.name}</span>
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
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1
  }), []);

  // Type-aware material colors
  const areaColor = area.type === 'Water Body' ? '#0284c7'
    : area.type === 'Sports' ? '#1d4ed8'
    : area.type === 'Clubhouse' ? '#f8fafc'
    : '#2e7d32'; // Default park green
  const areaRoughness = area.type === 'Water Body' ? 0.05 : area.type === 'Clubhouse' ? 0.4 : 0.75;
  const areaMetalness = area.type === 'Water Body' ? 0.6 : area.type === 'Clubhouse' ? 0.1 : 0.0;

  return (
    <group>
      {/* Amenity Zone Base Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={areaColor}
          roughness={areaRoughness}
          metalness={areaMetalness}
        />
      </mesh>

      {/* Water Body Fountain & Shoreline */}
      {area.type === 'Water Body' && (
        <group position={[centroid[0], 0.22, centroid[1]]}>
          {/* Water Shoreline Rock Border Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[14, 16.5, 24]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
          </mesh>
          {/* Water Fountain Spray Feature */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <coneGeometry args={[1.2, 2.4, 12]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.1} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <ringGeometry args={[1.5, 3.8, 16]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* Clubhouse Architectural Structure */}
      {area.type === 'Clubhouse' && (
        <group position={[centroid[0], 0.22, centroid[1]]}>
          {/* Main 2-Story Building Mass */}
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[14, 3.6, 10]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
          </mesh>
          {/* Upper Terrace Roof */}
          <mesh position={[0, 3.7, 0]} castShadow>
            <boxGeometry args={[15, 0.4, 11]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>
          {/* Glass Balcony Front */}
          <mesh position={[0, 2.2, 5.1]}>
            <boxGeometry args={[12, 1.4, 0.2]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Sports Courts Feature */}
      {area.type === 'Sports' && (
        <group position={[centroid[0], 0.22, centroid[1]]}>
          {/* Tennis Court 1 (Blue Hardcourt) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.02, 0]} receiveShadow>
            <planeGeometry args={[9, 14]} />
            <meshStandardMaterial color="#2563eb" roughness={0.6} />
          </mesh>
          {/* Tennis Court 2 (Green Court) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.02, 0]} receiveShadow>
            <planeGeometry args={[9, 14]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
          {/* Net Line Divider */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[19, 0.8, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Children's Play Area Equipment */}
      {area.type === 'Children Play Area' && (
        <group position={[centroid[0], 0.22, centroid[1]]}>
          {/* Play Turf Rubber Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <circleGeometry args={[9, 20]} />
            <meshStandardMaterial color="#ea580c" roughness={0.8} />
          </mesh>
          {/* Slide & Climbing Tower */}
          <mesh position={[-2, 1.2, 0]} castShadow>
            <boxGeometry args={[1.8, 2.4, 1.8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.5} />
          </mesh>
          <mesh position={[2, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1.6, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
        </group>
      )}

      <Html position={[centroid[0], 0.65, centroid[1]]} center distanceFactor={60}>
        <div className="park-label">
          <span>🌳 {area.name}</span>
        </div>
      </Html>
    </group>
  );
}

function EntranceGateArch({ position }) {
  return (
    <group position={position}>
      {/* Left Pillars */}
      <mesh position={[-12, 2.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 5.6, 1.8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[-12, 5.8, 0]} castShadow>
        <boxGeometry args={[2.2, 0.4, 2.2]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      {/* Right Pillars */}
      <mesh position={[12, 2.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 5.6, 1.8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[12, 5.8, 0]} castShadow>
        <boxGeometry args={[2.2, 0.4, 2.2]} />
        <meshStandardMaterial color="#475569" roughness={0.5} />
      </mesh>

      {/* Overhead Beam */}
      <mesh position={[0, 5.6, 0]} castShadow>
        <boxGeometry args={[24, 0.9, 0.9]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      <Html position={[0, 5.6, 0.5]} center distanceFactor={45}>
        <div className="entrance-gate-banner">
          <span>🏛️ SKY CADASTRAL — SUNRISE VALLEY</span>
        </div>
      </Html>
    </group>
  );
}
