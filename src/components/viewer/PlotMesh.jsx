import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { calculateCentroid, coordinatesToThreeShape, getStatusTheme, formatPrice } from '../../utils/geometryUtils';

export default function PlotMesh({
  plot,
  isSelected,
  onSelectPlot,
  isDimmed = false
}) {
  const [isHovered, setIsHovered] = useState(false);

  const centroid = useMemo(() => calculateCentroid(plot.coordinates), [plot.coordinates]);

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
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 2
  }), [theme.extrusionHeight]);

  // Edges geometry for sharp CAD outline
  const edgesGeometry = useMemo(() => {
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    return new THREE.EdgesGeometry(geom);
  }, [shape, extrudeSettings]);

  const effectiveOpacity = isDimmed && !isSelected ? theme.opacity * 0.4 : theme.opacity;

  return (
    <group
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
      onClick={(e) => {
        e.stopPropagation();
        onSelectPlot(plot);
      }}
    >
      {/* 3D Extruded Plot Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial
          color={theme.fillColor}
          roughness={0.3}
          metalness={0.1}
          transparent={true}
          opacity={effectiveOpacity}
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* CAD Boundary Wireframe Edges */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <primitive object={edgesGeometry} attach="geometry" />
        <lineBasicMaterial
          color={isSelected ? '#0284c7' : isHovered ? '#047857' : theme.borderColor}
          linewidth={isSelected || isHovered ? 3 : 1.5}
        />
      </lineSegments>

      {/* Floating 3D Plot Label */}
      <Html
        position={[centroid[0], theme.extrusionHeight + 0.8, centroid[1]]}
        center
        distanceFactor={60}
        zIndexRange={[100, 0]}
      >
        <div
          className={`plot-3d-badge ${plot.status.toLowerCase()} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPlot(plot);
          }}
        >
          <span className="badge-plot-num">{plot.plotNumber}</span>
          {(isHovered || isSelected) && (
            <div className="badge-hover-tooltip">
              <span className="tooltip-status">{plot.status.toUpperCase()}</span>
              <span className="tooltip-area">{plot.area} sq.ft</span>
              <span className="tooltip-price">{formatPrice(plot.price)}</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
