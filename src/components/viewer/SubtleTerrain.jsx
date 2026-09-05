import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function SubtleTerrain({ layoutMetadata }) {
  const minX = layoutMetadata?.bounds?.minX || 0;
  const minY = layoutMetadata?.bounds?.minY || 0;
  const maxX = layoutMetadata?.bounds?.maxX || 800;
  const maxY = layoutMetadata?.bounds?.maxY || 600;
  const spanX = Math.max(100, maxX - minX);
  const spanY = Math.max(100, maxY - minY);
  const centerX = minX + spanX / 2;
  const centerY = minY + spanY / 2;

  // Ground plane with natural height variations outside layout
  const terrainGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(spanX * 2.5, spanY * 2.5, 64, 64);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + centerX;
      const y = pos.getY(i) + centerY;

      const distFromLayoutX = Math.max(0, minX - 15 - x, x - (maxX + 15));
      const distFromLayoutY = Math.max(0, minY - 15 - y, y - (maxY + 15));
      const maxDist = Math.max(distFromLayoutX, distFromLayoutY);

      if (maxDist > 0) {
        const height =
          Math.sin(x * 0.015) * Math.cos(y * 0.015) * 4.0 +
          Math.sin(x * 0.04 + y * 0.02) * 2.0;
        pos.setZ(i, Math.max(0, height * Math.min(1, maxDist / 50)));
      } else {
        pos.setZ(i, 0);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [centerX, centerY, minX, minY, maxX, maxY, spanX, spanY]);

  // Generate dense surrounding perimeter forest tree positions (North, South, East, West surrounding belt)
  const perimeterTrees = useMemo(() => {
    const trees = [];
    // North Forest Belt (Y > maxY + 12)
    for (let x = minX - 40; x <= maxX + 40; x += 16) {
      for (let y = maxY + 14; y <= maxY + 60; y += 16) {
        const jitterX = (Math.sin(x * 17 + y) * 4);
        const jitterY = (Math.cos(x + y * 13) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.0 + (Math.abs(x % 3) * 0.25) });
      }
    }
    // South Forest Belt (Y < minY - 14)
    for (let x = minX - 40; x <= maxX + 40; x += 16) {
      for (let y = minY - 16; y >= minY - 65; y -= 16) {
        const jitterX = (Math.sin(x * 19 + y) * 4);
        const jitterY = (Math.cos(x + y * 11) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 0.9 + (Math.abs(x % 4) * 0.2) });
      }
    }
    // West Forest Belt (X < minX - 14)
    for (let y = minY - 10; y <= maxY + 10; y += 16) {
      for (let x = minX - 16; x >= minX - 60; x -= 16) {
        const jitterX = (Math.sin(x + y * 17) * 4);
        const jitterY = (Math.cos(x * 13 + y) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.1 + (Math.abs(y % 3) * 0.2) });
      }
    }
    // East Forest Belt (X > maxX + 14)
    for (let y = minY - 10; y <= maxY + 10; y += 16) {
      for (let x = maxX + 16; x <= maxX + 65; x += 16) {
        const jitterX = (Math.sin(x + y * 23) * 4);
        const jitterY = (Math.cos(x * 7 + y) * 4);
        trees.push({ pos: [x + jitterX, 0, y + jitterY], scale: 1.0 + (Math.abs(y % 4) * 0.25) });
      }
    }
    return trees;
  }, [minX, minY, maxX, maxY]);

  // Boundary wall frame box coordinates around layout
  const wallHeight = 2.2;
  const wallThickness = 0.8;

  return (
    <group>
      {/* Outer Landscape Rolling Meadow Grass Base */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.3, centerY]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#2e5a28" // Natural rich deep meadow green
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Internal Development Manicured Lawn Soil Plate */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, -0.15, centerY]}
        receiveShadow
      >
        <planeGeometry args={[spanX + 30, spanY + 30]} />
        <meshStandardMaterial
          color="#388e3c" // Vibrant development lawn green
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
      <mesh position={[minX - 2, wallHeight / 2, centerY]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, spanY + 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - East Wall */}
      <mesh position={[maxX + 2, wallHeight / 2, centerY]} receiveShadow castShadow>
        <boxGeometry args={[wallThickness, wallHeight, spanY + 10]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - North Wall */}
      <mesh position={[centerX, wallHeight / 2, maxY + 2]} receiveShadow castShadow>
        <boxGeometry args={[spanX + 10, wallHeight, wallThickness]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* Perimeter Boundary Wall - South Wall */}
      <mesh position={[centerX, wallHeight / 2, minY - 2]} receiveShadow castShadow>
        <boxGeometry args={[spanX + 10, wallHeight, wallThickness]} />
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
