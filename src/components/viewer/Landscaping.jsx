import React from 'react';

// Tree coordinates along green corridors, road avenues, and park perimeters
const TREE_POSITIONS = [
  // Central Park (West Green Zone)
  { pos: [15, 0, 90], type: 'oak', scale: 1.1 },
  { pos: [40, 0, 91], type: 'cypress', scale: 1.2 },
  { pos: [24, 0, 98], type: 'flowering', scale: 0.95 },
  { pos: [42, 0, 97], type: 'oak', scale: 1.0 },
  { pos: [16, 0, 99], type: 'pine', scale: 1.15 },

  // East Green Corridor & Amenity Borders
  { pos: [216, 0, 90], type: 'cypress', scale: 1.3 },
  { pos: [244, 0, 91], type: 'oak', scale: 1.1 },
  { pos: [222, 0, 98], type: 'flowering', scale: 1.0 },
  { pos: [245, 0, 99], type: 'pine', scale: 1.2 },
  { pos: [225, 0, 140], type: 'palm', scale: 1.1 },
  { pos: [240, 0, 160], type: 'palm', scale: 1.2 },
  { pos: [250, 0, 130], type: 'oak', scale: 1.0 },

  // South-West Eco Garden
  { pos: [15, 0, 9], type: 'oak', scale: 1.0 },
  { pos: [40, 0, 9], type: 'cypress', scale: 1.1 },

  // Entrance Avenue Boulevard Border Trees (Central Vertical Road)
  { pos: [114, 0, 15], type: 'cypress', scale: 0.95 },
  { pos: [146, 0, 15], type: 'cypress', scale: 0.95 },
  { pos: [114, 0, 45], type: 'cypress', scale: 0.95 },
  { pos: [146, 0, 45], type: 'cypress', scale: 0.95 },
  { pos: [114, 0, 75], type: 'palm', scale: 1.0 },
  { pos: [146, 0, 75], type: 'palm', scale: 1.0 },
  { pos: [114, 0, 115], type: 'cypress', scale: 0.95 },
  { pos: [146, 0, 115], type: 'cypress', scale: 0.95 },
  { pos: [114, 0, 155], type: 'cypress', scale: 0.95 },
  { pos: [146, 0, 155], type: 'cypress', scale: 0.95 },

  // Internal Road Avenues (Horizontals)
  { pos: [65, 0, 47], type: 'palm', scale: 0.9 },
  { pos: [95, 0, 47], type: 'palm', scale: 0.9 },
  { pos: [165, 0, 47], type: 'palm', scale: 0.9 },
  { pos: [195, 0, 47], type: 'palm', scale: 0.9 },
  { pos: [65, 0, 142], type: 'flowering', scale: 0.95 },
  { pos: [95, 0, 142], type: 'flowering', scale: 0.95 },
  { pos: [165, 0, 142], type: 'flowering', scale: 0.95 },
  { pos: [195, 0, 142], type: 'flowering', scale: 0.95 },

  // Boundary Perimeter Corner Trees
  { pos: [4, 0, 4], type: 'pine', scale: 0.85 },
  { pos: [254, 0, 4], type: 'pine', scale: 0.85 },
  { pos: [4, 0, 185], type: 'pine', scale: 0.85 },
  { pos: [254, 0, 185], type: 'oak', scale: 0.9 }
];

// Vehicles parked on roads
const VEHICLE_POSITIONS = [
  { pos: [126, 0.13, 30], rot: [0, 0, 0], color: '#38bdf8' },
  { pos: [134, 0.13, 60], rot: [0, Math.PI, 0], color: '#ef4444' },
  { pos: [80, 0.13, 91], rot: [0, Math.PI / 2, 0], color: '#f59e0b' },
  { pos: [180, 0.13, 99], rot: [0, -Math.PI / 2, 0], color: '#e2e8f0' }
];

export default function Landscaping() {
  return (
    <group>
      {/* 3D Trees */}
      {TREE_POSITIONS.map((item, idx) => (
        <Tree3D
          key={`tree-${idx}`}
          position={item.pos}
          type={item.type}
          scale={item.scale}
        />
      ))}

      {/* Central Park Amenities */}
      <ParkAmenities />

      {/* Vehicles */}
      {VEHICLE_POSITIONS.map((item, idx) => (
        <Vehicle3D key={`car-${idx}`} position={item.pos} rotation={item.rot} color={item.color} />
      ))}
    </group>
  );
}

export function Tree3D({ position, type = 'oak', scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Tree Trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 1.8, 8]} />
        <meshStandardMaterial color="#543310" roughness={0.9} />
      </mesh>

      {/* Tree Foliage */}
      {type === 'cypress' && (
        <mesh position={[0, 2.8, 0]} castShadow>
          <coneGeometry args={[0.9, 3.8, 8]} />
          <meshStandardMaterial color="#1e4620" roughness={0.75} />
        </mesh>
      )}

      {type === 'pine' && (
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <coneGeometry args={[1.3, 1.8, 8]} />
            <meshStandardMaterial color="#143619" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[1.0, 1.6, 8]} />
            <meshStandardMaterial color="#1c4723" roughness={0.8} />
          </mesh>
        </group>
      )}

      {type === 'flowering' && (
        <mesh position={[0, 2.5, 0]} castShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#f43f5e" roughness={0.65} />
        </mesh>
      )}

      {type === 'palm' && (
        <group position={[0, 2.6, 0]}>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            return (
              <mesh key={`frond-${i}`} position={[Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8]} rotation={[0.4, angle, 0]} castShadow>
                <coneGeometry args={[0.5, 2.2, 4]} />
                <meshStandardMaterial color="#15803d" roughness={0.6} />
              </mesh>
            );
          })}
        </group>
      )}

      {type === 'oak' && (
        <group position={[0, 2.4, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.7} />
          </mesh>
          <mesh position={[0.4, 0.5, 0.2]} castShadow>
            <sphereGeometry args={[0.8, 8, 8]} />
            <meshStandardMaterial color="#386b31" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function ParkAmenities() {
  return (
    <group>
      {/* Central Park Walking Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[29, 0.21, 95]} receiveShadow>
        <ringGeometry args={[7, 10, 24, 1, 0, Math.PI * 1.5]} />
        <meshStandardMaterial color="#d97706" roughness={0.95} />
      </mesh>

      {/* Central Gazebo Pavilion */}
      <group position={[29, 0.22, 95]}>
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[3.2, 3.5, 0.2, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <mesh
              key={`post-${i}`}
              position={[Math.cos(angle) * 2.8, 1.4, Math.sin(angle) * 2.8]}
              castShadow
            >
              <boxGeometry args={[0.2, 2.6, 0.2]} />
              <meshStandardMaterial color="#451a03" roughness={0.6} />
            </mesh>
          );
        })}

        <mesh position={[0, 3.2, 0]} castShadow>
          <coneGeometry args={[3.8, 1.4, 8]} />
          <meshStandardMaterial color="#92400e" roughness={0.5} />
        </mesh>
      </group>

      {/* Benches */}
      <ParkBench position={[20, 0.22, 92]} rotation={[0, Math.PI / 4, 0]} />
      <ParkBench position={[38, 0.22, 98]} rotation={[0, -Math.PI / 3, 0]} />
    </group>
  );
}

function ParkBench({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.4, 0.1, 0.5]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
    </group>
  );
}

function Vehicle3D({ position, rotation, color = '#38bdf8' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Chassis */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.8, 0.6, 3.6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Cabin Roof */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.5, 2.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}
