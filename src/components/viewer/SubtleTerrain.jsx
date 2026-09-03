import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function SubtleTerrain({ layoutMetadata }) {
  const [centerX, centerY] = layoutMetadata.viewCenter;
  const { maxX, maxY } = layoutMetadata.bounds;

  // Ground plane with natural height variations outside layout
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(640, 560, 64, 64);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + centerX;
      const y = pos.getY(i) + centerY;

      const distFromLayoutX = Math.max(0, -x, x - maxX);
      const distFromLayoutY = Math.max(0, -y, y - maxY);
      const maxDist = Math.max(distFromLayoutX, distFromLayoutY);

      if (maxDist > 10) {
        const height =
          Math.sin(x * 0.02) * Math.cos(y * 0.02) * 3.5 +
          Math.sin(x * 0.05 + y * 0.03) * 1.8;
        pos.setZ(i, Math.max(0, height * (maxDist / 60)));
      } else {
        pos.setZ(i, 0);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [centerX, centerY, maxX, maxY]);

  // Generate dense surrounding perimeter forest tree positions (North, South, East, West surrounding belt)
  const perimeterTrees = useMemo(() => {
    const trees = [];
    // North Forest Belt (Y > maxY + 12)
    for (let x = -40; x <= maxX + 40; x += 12) {
      for (let y = maxY + 14; y <= maxY + 60; y += 14) {
        const jitterX = (Math.sin(x * 17 + y) * 4);
        const jitterY = (Math.cos(x + y * 13) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.0 + (Math.abs(x % 3) * 0.25) });
      }
    }
    // South Forest Belt (Y < -14)
    for (let x = -40; x <= maxX + 40; x += 12) {
      for (let y = -16; y >= -65; y -= 14) {
        const jitterX = (Math.sin(x * 19 + y) * 4);
        const jitterY = (Math.cos(x + y * 11) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 0.9 + (Math.abs(x % 4) * 0.2) });
      }
    }
    // West Forest Belt (X < -14)
    for (let y = -10; y <= maxY + 10; y += 12) {
      for (let x = -16; x >= -60; x -= 14) {
        const jitterX = (Math.sin(x + y * 17) * 4);
        const jitterY = (Math.cos(x * 13 + y) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.1 + (Math.abs(y % 3) * 0.2) });
      }
    }
    // East Forest Belt (X > maxX + 14)
    for (let y = -10; y <= maxY + 10; y += 12) {
      for (let x = maxX + 16; x <= maxX + 65; x += 14) {
        const jitterX = (Math.sin(x + y * 23) * 4);
        const jitterY = (Math.cos(x * 7 + y) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.0 + (Math.abs(y % 4) * 0.25) });
      }
    }
    return trees;
  }, [maxX, maxY]);

  // Boundary wall frame box coordinates around layout
  const wallHeight = 2.2;
  const wallThickness = 0.8;

  return (
    <group>
      {/* Outer Landscape Rolling Meadow Grass Base */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.08, centerY]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#386b31" // Natural rich meadow green
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Internal Development Manicured Lawn Soil Plate */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.04, centerY]}
        receiveShadow
      >
        <planeGeometry args={[maxX + 16, maxY + 16]} />
        <meshStandardMaterial
          color="#4cae4f" // Vibrant development lawn green
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>

      {/* Perimeter Boundary Forest Belt Trees */}
      <group>
        {perimeterTrees.map((t, idx) => (
          <PerimeterTree key={`p-tree-${idx}`} position={t.pos} scale={t.scale} />
        ))}
      </group>

      {/* Perimeter Boundary Wall - West Wall */}
      <mesh position={[-2, wallHeight / 2, centerY]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, maxY + 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - East Wall */}
      <mesh position={[maxX + 2, wallHeight / 2, centerY]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, maxY + 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - North Wall */}
      <mesh position={[centerX, wallHeight / 2, maxY + 2]} receiveShadow castShadow>
        <boxGeometry args={[maxX + 10, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - South Wall */}
      <mesh position={[centerX, wallHeight / 2, -2]} receiveShadow castShadow>
        <boxGeometry args={[maxX + 10, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
    </group>
  );
}

function PerimeterTree({ position, scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 2.4, 8]} />
        <meshStandardMaterial color="#4a2e12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <sphereGeometry args={[1.8, 8, 8]} />
        <meshStandardMaterial color="#1e4620" roughness={0.75} />
      </mesh>
      <mesh position={[0.4, 4.2, 0.3]} castShadow>
        <sphereGeometry args={[1.3, 8, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} />
      </mesh>
    </group>
  );
}
