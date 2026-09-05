import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import PlotMesh from './PlotMesh';
import RoadMesh, { GreenAreaMesh } from './RoadMesh';
import SubtleTerrain from './SubtleTerrain';
import StreetLightMesh from './StreetLightMesh';
import Landscaping from './Landscaping';
import { ROADS, GREEN_AREAS } from '../../data/plots';
import { calculateCentroid, getLayoutCameraDefaults } from '../../utils/geometryUtils';

function CameraRig({
  selectedPlot,
  cameraPreset,
  zoomCommand,
  onCommandHandled,
  cameraDefaults,
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const animIdRef = useRef(null);
  const isFirstMountRef = useRef(true);

  const defaultTarget = useMemo(
    () => new THREE.Vector3(...cameraDefaults.target),
    [cameraDefaults.target]
  );
  const defaultCameraPos = useMemo(
    () => new THREE.Vector3(...cameraDefaults.position),
    [cameraDefaults.position]
  );
  const topCameraPos = useMemo(
    () => new THREE.Vector3(...cameraDefaults.topPosition),
    [cameraDefaults.topPosition]
  );

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.copy(defaultTarget);
      controlsRef.current.update();
    }
  }, [defaultTarget]);

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
      dir.multiplyScalar(0.75);
      camera.position.copy(currentTarget.clone().add(dir));
      controlsRef.current.update();
    } else if (zoomCommand === 'OUT') {
      dir.multiplyScalar(1.3);
      camera.position.copy(currentTarget.clone().add(dir));
      controlsRef.current.update();
    } else if (zoomCommand === 'RESET' || zoomCommand === 'FIT') {
      camera.position.copy(defaultCameraPos);
      controlsRef.current.target.copy(defaultTarget);
      controlsRef.current.update();
    }

    if (onCommandHandled) onCommandHandled();
  }, [zoomCommand, camera, onCommandHandled, defaultCameraPos, defaultTarget]);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (!selectedPlot && cameraPreset === '3D') {
        return;
      }
    }

    let targetPos;
    let camPos;

    if (selectedPlot) {
      const [cx, cy] = calculateCentroid(selectedPlot.coordinates);
      const offset = cameraDefaults.selectOffset;
      targetPos = new THREE.Vector3(cx, 0, cy);
      camPos = new THREE.Vector3(cx + offset, offset * 1.35, cy + offset);
    } else if (cameraPreset === 'TOP') {
      targetPos = defaultTarget.clone();
      camPos = topCameraPos.clone();
    } else {
      targetPos = defaultTarget.clone();
      camPos = defaultCameraPos.clone();
    }

    const startTime = performance.now();
    const duration = 850;
    const startTarget = controlsRef.current?.target.clone() || defaultTarget.clone();
    const startCam = camera.position.clone();

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
      const easeProgress = 1 - Math.pow(1 - progress, 3);

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
  }, [selectedPlot, cameraPreset, camera, defaultTarget, defaultCameraPos, topCameraPos, cameraDefaults.selectOffset]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      screenSpacePanning={false}
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
      maxPolarAngle={Math.PI / 2.15}
      minDistance={15}
      maxDistance={cameraDefaults.maxDistance}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

export default function PlotViewer3D({
  plots,
  layoutMetadata,
  selectedPlotId,
  onSelectPlot,
  statusFilter = 'ALL',
  facingFilter = 'ALL',
  cameraPreset = '3D',
  zoomCommand,
  onCommandHandled,
  onResetCamera,
  showDemoInfrastructure = false,
}) {
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);
  const cameraDefaults = useMemo(
    () => getLayoutCameraDefaults(layoutMetadata),
    [layoutMetadata]
  );

  return (
    <div
      className="canvas-container"
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        camera={{ position: cameraDefaults.position, fov: 45 }}
        shadows
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        onCreated={({ gl }) => {
          if (gl && gl.domElement) {
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault();
            }, false);
          }
        }}
        dpr={[1, 2]}
        style={{ touchAction: 'none' }}
      >
        <color attach="background" args={['#dbeafe']} />
        <fog attach="fog" args={['#dbeafe', cameraDefaults.maxDistance * 0.7, cameraDefaults.maxDistance * 1.8]} />

        <ambientLight intensity={0.85} />
        <hemisphereLight intensity={0.7} color="#ffffff" groundColor="#386b31" />

        <directionalLight
          position={[
            layoutMetadata.bounds.maxX * 0.75,
            layoutMetadata.bounds.maxY * 0.9,
            layoutMetadata.bounds.maxX * 0.4,
          ]}
          intensity={2.1}
          color="#fffbeb"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={550}
          shadow-camera-left={-layoutMetadata.bounds.maxX}
          shadow-camera-right={layoutMetadata.bounds.maxX}
          shadow-camera-top={layoutMetadata.bounds.maxY}
          shadow-camera-bottom={-layoutMetadata.bounds.maxY}
          shadow-bias={-0.0001}
        />

        <CameraRig
          selectedPlot={selectedPlot}
          cameraPreset={cameraPreset}
          zoomCommand={zoomCommand}
          onCommandHandled={onCommandHandled}
          cameraDefaults={cameraDefaults}
        />

        <SubtleTerrain layoutMetadata={layoutMetadata} />

        {/* Extracted 3D PDF Infrastructure Meshes */}
        {((layoutMetadata?.infrastructureGeometry?.roads || layoutMetadata?.infrastructure?.roads || []).length > 0) ? (
          (layoutMetadata?.infrastructureGeometry?.roads || layoutMetadata?.infrastructure?.roads).map((road, idx) => (
            <RoadMesh key={road.id || `extracted-3d-road-${idx}`} road={road} />
          ))
        ) : (showDemoInfrastructure && (
          ROADS.map((road) => (
            <RoadMesh key={road.id} road={road} />
          ))
        ))}

        {((layoutMetadata?.infrastructureGeometry?.openSpaces || layoutMetadata?.infrastructure?.openSpaces || []).length > 0) ? (
          (layoutMetadata?.infrastructureGeometry?.openSpaces || layoutMetadata?.infrastructure?.openSpaces).map((space, idx) => (
            <GreenAreaMesh key={space.id || `extracted-3d-green-${idx}`} area={space} />
          ))
        ) : (showDemoInfrastructure && (
          GREEN_AREAS.map((area) => (
            <GreenAreaMesh key={area.id} area={area} />
          ))
        ))}

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

        <ContactShadows
          position={cameraDefaults.shadowPosition}
          opacity={0.55}
          scale={cameraDefaults.shadowScale}
          blur={1.8}
          far={15}
          frames={1}
        />
      </Canvas>

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
