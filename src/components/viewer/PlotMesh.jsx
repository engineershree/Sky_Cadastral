import React, { useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { calculateCentroid, coordinatesToThreeShape, getStatusTheme, formatPrice } from '../../utils/geometryUtils';

export default function PlotMesh({
  plot,
  isSelected,
  onSelectPlot,
  isDimmed = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [zoomTier, setZoomTier] = useState('FAR'); // 'FAR', 'MEDIUM', 'CLOSE'
  const zoomTierRef = useRef('FAR');
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  const meshRef = useRef();
  const currentLiftRef = useRef(0);

  const centroid = useMemo(() => calculateCentroid(plot.coordinates), [plot.coordinates]);
  const centroidVector = useMemo(() => new THREE.Vector3(centroid[0], 0, centroid[1]), [centroid]);

  const shape = useMemo(() => {
    return coordinatesToThreeShape(plot.coordinates);
  }, [plot.coordinates]);

  const theme = useMemo(() => {
    return getStatusTheme(plot.status, isSelected, isHovered);
  }, [plot.status, isSelected, isHovered]);

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: theme.extrusionHeight,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2
  }), [theme.extrusionHeight]);

  // Edges geometry for sharp CAD wireframe boundary outline
  const edgesGeometry = useMemo(() => {
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    return new THREE.EdgesGeometry(geom);
  }, [shape, extrudeSettings]);

  // Frame update for smooth vertical animation & throttled distance tier calculation
  useFrame((state, delta) => {
    // Measure distance from camera to plot centroid without triggering React re-renders unless tier changes
    const dist = state.camera.position.distanceTo(centroidVector);
    const newTier = dist > 170 ? 'FAR' : dist > 100 ? 'MEDIUM' : 'CLOSE';
    if (zoomTierRef.current !== newTier) {
      zoomTierRef.current = newTier;
      setZoomTier(newTier);
    }

    const targetLift = isSelected ? 0.35 : isHovered ? 0.15 : 0;
    currentLiftRef.current = THREE.MathUtils.lerp(currentLiftRef.current, targetLift, delta * 10);
    if (meshRef.current) {
      meshRef.current.position.y = currentLiftRef.current;
    }
  });

  const effectiveOpacity = isDimmed && !isSelected ? theme.opacity * 0.35 : theme.opacity;

  // Zoom-dependent label detail determination
  const isZoomedOut = zoomTier === 'FAR';
  const isMediumZoom = zoomTier === 'MEDIUM';
  const isCloseZoom = zoomTier === 'CLOSE' || isSelected;

  const handlePointerDown = (e) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    e.stopPropagation();
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Only select plot if movement is below drag threshold (6px)
    if (dist < 6) {
      onSelectPlot(plot);
    }
  };

  return (
    <group
      ref={meshRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'default';
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 3D Real-Estate Plot Extruded Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          attach="material-0"
          color={theme.fillColor}
          roughness={0.4}
          metalness={0.05}
          transparent={true}
          opacity={effectiveOpacity}
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
        <meshStandardMaterial
          attach="material-1"
          color={isSelected ? '#d97706' : isHovered ? '#2e7d32' : '#1e293b'}
          roughness={0.6}
          metalness={0.1}
          transparent={true}
          opacity={effectiveOpacity}
        />
      </mesh>

      {/* CAD Boundary Line Trim */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <primitive object={edgesGeometry} attach="geometry" />
        <lineBasicMaterial
          color={isSelected ? '#fbbf24' : isHovered ? '#ffffff' : theme.borderColor}
          linewidth={isSelected ? 2.8 : isHovered ? 2.0 : 1.0}
        />
      </lineSegments>

      {/* Floating 3D Plot Badge with Zoom-Dependent Detail */}
      <Html
        position={[centroid[0], theme.extrusionHeight + 0.5 + currentLiftRef.current, centroid[1]]}
        center
        distanceFactor={70}
        zIndexRange={[100, 0]}
      >
        <div
          className={`plot-3d-badge ${plot.status.toLowerCase()} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
          onMouseDown={(e) => {
            pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            const dx = e.clientX - pointerDownPosRef.current.x;
            const dy = e.clientY - pointerDownPosRef.current.y;
            if (Math.hypot(dx, dy) < 6) {
              onSelectPlot(plot);
            }
          }}
        >
          <span className="badge-plot-num">{plot.plotNumber}</span>

          {/* Medium Zoom Detail: Area */}
          {isMediumZoom && !isZoomedOut && (
            <span className="badge-plot-sub">{plot.area} sq.ft</span>
          )}

          {/* Close Zoom Detail: Area + Facing */}
          {isCloseZoom && (
            <span className="badge-plot-sub">{plot.area} sq.ft • {plot.facing}</span>
          )}

          {/* Hover / Select Detailed Tooltip Overlay */}
          {(isHovered || isSelected) && (
            <div className="badge-hover-tooltip">
              <span className="tooltip-status">{plot.status.toUpperCase()}</span>
              <span className="tooltip-area">{plot.area} sq.ft • {plot.facing}</span>
              <span className="tooltip-price">{formatPrice(plot.price)}</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

