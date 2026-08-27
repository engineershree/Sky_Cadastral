import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import PlotMesh from './PlotMesh';
import RoadMesh, { GreenAreaMesh } from './RoadMesh';
import SubtleTerrain from './SubtleTerrain';
import StreetLightMesh from './StreetLightMesh';
import Landscaping from './Landscaping';
import { ROADS, GREEN_AREAS } from '../../data/plots';
import { calculateCentroid } from '../../utils/geometryUtils';

// Canonical 45° Elevated Aerial View Target & Camera Position
const DEFAULT_TARGET = new THREE.Vector3(130, 0, 95);
const DEFAULT_CAMERA_POS = new THREE.Vector3(130, 165, 260); // ~45° downward viewing angle

function CameraRig({ selectedPlot, cameraPreset, zoomCommand, onCommandHandled }) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const animIdRef = useRef(null);
  const isFirstMountRef = useRef(true);

  // Set default controls target imperatively on mount to prevent React prop override
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.update();
    }
  }, []);

  // Handle external toolbar zoom commands (Zoom In, Zoom Out, Reset, Fit)
  useEffect(() => {
    if (!zoomCommand || !controlsRef.current) return;

    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }

    const currentCamPos = camera.position.clone();
    const currentTarget = controlsRef.current.target.clone();
    const dir = currentCamPos.clone().sub(currentTarget);

    if (zoomCommand === 'IN') {
      dir.multiplyScalar(0.75); // Zoom 25% closer
      camera.position.copy(currentTarget.clone().add(dir));
      controlsRef.current.update();
    } else if (zoomCommand === 'OUT') {
      dir.multiplyScalar(1.3); // Zoom 30% out
      camera.position.copy(currentTarget.clone().add(dir));
      controlsRef.current.update();
    } else if (zoomCommand === 'RESET' || zoomCommand === 'FIT') {
      camera.position.copy(DEFAULT_CAMERA_POS);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.update();
    }

    if (onCommandHandled) onCommandHandled();
  }, [zoomCommand, camera, onCommandHandled]);

  // Smooth camera lerp on plot selection or preset change
  useEffect(() => {
    // Skip initial lerp on first render if no plot is selected
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (!selectedPlot && cameraPreset === '3D') {
        return;
      }
    }

    let targetPos, camPos;

    if (selectedPlot) {
      const [cx, cy] = calculateCentroid(selectedPlot.coordinates);
      targetPos = new THREE.Vector3(cx, 0, cy);
      camPos = new THREE.Vector3(cx + 35, 48, cy + 48);
    } else if (cameraPreset === 'TOP') {
      targetPos = DEFAULT_TARGET.clone();
      camPos = new THREE.Vector3(130, 270, 95.1); // Top down 90° view
    } else {
      targetPos = DEFAULT_TARGET.clone();
      camPos = DEFAULT_CAMERA_POS.clone();
    }

    const startTime = performance.now();
    const duration = 850;

    const startTarget = controlsRef.current?.target.clone() || DEFAULT_TARGET.clone();
    const startCam = camera.position.clone();

    // Interrupt listener if user starts dragging during camera animation
    const onControlsStart = () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    };

    const controls = controlsRef.current;
    if (controls) {
      controls.addEventListener('start', onControlsStart);
    }

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
        animIdRef.current = requestAnimationFrame(animateCamera);
      } else {
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(animateCamera);

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      if (controls) {
        controls.removeEventListener('start', onControlsStart);
      }
    };
  }, [selectedPlot, cameraPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      screenSpacePanning={false} // CRITICAL FIX: forces panning to slide along ground plane (x, 0, z)
      panSpeed={1.2}
      rotateSpeed={0.8}
      zoomSpeed={1.0}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      maxPolarAngle={Math.PI / 2.15} // Prevent camera going below ground
      minDistance={15}
      maxDistance={380}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

export default function PlotViewer3D({
  plots,
  selectedPlotId,
  onSelectPlot,
  statusFilter = 'ALL',
  facingFilter = 'ALL',
  cameraPreset = '3D',
  zoomCommand,
  onCommandHandled,
  onResetCamera
}) {
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <div
      className="canvas-container"
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()} // Suppress browser right-click menu for smooth panning
    >
      <Canvas
        camera={{ position: [130, 165, 260], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        {/* Real-Estate Light Daylight Atmosphere */}
        <color attach="background" args={['#dbeafe']} />
        <fog attach="fog" args={['#dbeafe', 280, 700]} />

        {/* Natural Sun & Daylight Hemisphere Lighting */}
        <ambientLight intensity={0.85} />
        <hemisphereLight intensity={0.7} color="#ffffff" groundColor="#386b31" />

        {/* Sunlight Directional Light with Soft Shadows */}
        <directionalLight
          position={[210, 260, 110]}
          intensity={2.1}
          color="#fffbeb"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={550}
          shadow-camera-left={-240}
          shadow-camera-right={240}
          shadow-camera-top={240}
          shadow-camera-bottom={-240}
          shadow-bias={-0.0001}
        />

        {/* Camera Rig & Orbit Controls with Ground Panning Enabled */}
        <CameraRig
          selectedPlot={selectedPlot}
          cameraPreset={cameraPreset}
          zoomCommand={zoomCommand}
          onCommandHandled={onCommandHandled}
        />

        {/* 3D Ground Terrain & Boundary Walls */}
        <SubtleTerrain />

        {/* Asphalt Roads & Entrance Arch Gate */}
        {ROADS.map((road) => (
          <RoadMesh key={road.id} road={road} />
        ))}

        {/* Green Amenity Parks */}
        {GREEN_AREAS.map((area) => (
          <GreenAreaMesh key={area.id} area={area} />
        ))}

        {/* 3D Street Light Poles */}
        <StreetLightMesh />

        {/* 3D Trees, Park Gazebos, Playground & Vehicles */}
        <Landscaping />

        {/* Extruded 3D Land Plot Meshes */}
        {plots.map((plot) => {
          const isSelected = plot.id === selectedPlotId;
          const matchesStatus =
            statusFilter === 'ALL' ||
            plot.status.toUpperCase() === statusFilter.toUpperCase();
          const matchesFacing =
            facingFilter === 'ALL' ||
            plot.facing.toLowerCase().includes(facingFilter.toLowerCase());
          const isDimmed = !(matchesStatus && matchesFacing);

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

        {/* Soft Ground Contact Shadows — Baked once */}
        <ContactShadows
          position={[130, 0, 95]}
          opacity={0.55}
          scale={400}
          blur={1.8}
          far={15}
          frames={1}
        />
      </Canvas>

      {/* Viewport Control Guide Badge */}
      <div className="viewer-controls-badge">
        <span>🖱️ Left: Orbit / Touch 1-Finger</span>
        <span>🖱️ Right: Slide / Touch 2-Finger</span>
        <span>🔍 Scroll: Zoom / Pinch</span>
        {onResetCamera && (
          <button className="reset-cam-btn" onClick={onResetCamera}>
            🔄 Reset View (45° Aerial)
          </button>
        )}
      </div>
    </div>
  );
}
