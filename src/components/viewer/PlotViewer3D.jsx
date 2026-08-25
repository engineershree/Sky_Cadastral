import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import PlotMesh from './PlotMesh';
import RoadMesh, { GreenAreaMesh } from './RoadMesh';
import { ROADS, GREEN_AREAS, LAYOUT_METADATA } from '../../data/plots';
import { calculateCentroid } from '../../utils/geometryUtils';

// Helper component to smoothly move OrbitControls target when plot selected
function CameraRig({ selectedPlot }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (selectedPlot) {
      const [cx, cy] = calculateCentroid(selectedPlot.coordinates);

      // Smoothly transition OrbitControls target
      const targetPos = new THREE.Vector3(cx, 0, cy);
      const camPos = new THREE.Vector3(cx + 35, 55, cy + 55);

      let animationFrameId;
      const startTime = performance.now();
      const duration = 1000; // 1 second smooth lerp

      const startTarget = controlsRef.current?.target.clone() || new THREE.Vector3(110, 0, 80);
      const startCam = camera.position.clone();

      const animateCamera = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        if (controlsRef.current) {
          controlsRef.current.target.lerpVectors(startTarget, targetPos, easeProgress);
          camera.position.lerpVectors(startCam, camPos, easeProgress);
          controlsRef.current.update();
        }

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animateCamera);
        }
      };

      animationFrameId = requestAnimationFrame(animateCamera);

      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [selectedPlot, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[LAYOUT_METADATA.viewCenter[0], 0, LAYOUT_METADATA.viewCenter[1]]}
      maxPolarAngle={Math.PI / 2.15} // Prevent camera going below ground
      minDistance={15}
      maxDistance={250}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

export default function PlotViewer3D({
  plots,
  selectedPlotId,
  onSelectPlot,
  statusFilter = 'ALL'
}) {
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [110, 110, 190], fov: 45 }}
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      >
        {/* Sky & Lighting */}
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 150, 400]} />

        <ambientLight intensity={0.75} />
        <directionalLight
          position={[120, 180, 80]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={400}
          shadow-camera-left={-150}
          shadow-camera-right={150}
          shadow-camera-top={150}
          shadow-camera-bottom={-150}
        />
        <hemisphereLight intensity={0.4} groundColor="#1e293b" />

        {/* Camera Controls */}
        <CameraRig selectedPlot={selectedPlot} />

        {/* Master Base Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[110, -0.05, 80]} receiveShadow>
          <planeGeometry args={[450, 400]} />
          <meshStandardMaterial color="#1e293b" roughness={0.95} />
        </mesh>

        {/* Plot Layout Base Substrate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[110, -0.02, 80]} receiveShadow>
          <planeGeometry args={[240, 180]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Grid Floor Overlay */}
        <gridHelper
          args={[400, 80, '#334155', '#1e293b']}
          position={[110, 0.01, 80]}
        />

        {/* Render 3D Roads */}
        {ROADS.map((road) => (
          <RoadMesh key={road.id} road={road} />
        ))}

        {/* Render 3D Green Parks */}
        {GREEN_AREAS.map((area) => (
          <GreenAreaMesh key={area.id} area={area} />
        ))}

        {/* Render 3D Plot Meshes */}
        {plots.map((plot) => {
          const isSelected = plot.id === selectedPlotId;
          const matchesFilter =
            statusFilter === 'ALL' ||
            plot.status.toUpperCase() === statusFilter.toUpperCase();
          const isDimmed = !matchesFilter;

          return (
            <PlotMesh
              key={plot.id}
              plot={plot}
              isSelected={isSelected}
              isDimmed={isDimmed}
              onSelectPlot={onSelectPlot}
            />
          );
        })}

        {/* Soft Contact Shadows */}
        <ContactShadows
          position={[110, 0, 80]}
          opacity={0.6}
          scale={280}
          blur={1.5}
          far={10}
        />
      </Canvas>

      {/* Viewport Overlay Controls Guide */}
      <div className="viewer-controls-badge">
        <span>🖱️ Left-Click: Rotate 3D</span>
        <span>🖱️ Right-Click / Touch: Pan</span>
        <span>🔍 Scroll / Pinch: Zoom</span>
      </div>
    </div>
  );
}
