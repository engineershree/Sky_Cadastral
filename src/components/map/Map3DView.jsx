import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';

export default function Map3DView({ onOpenBookingModal }) {
  const { plots, setSelectedPlotId, setActiveModule, setMapMode } = useApp();
  const mountRef = useRef(null);
  const [selected3DPlot, setSelected3DPlot] = useState(plots[0] || null);

  const formatCurrency = (val) =>
    `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 550;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001229); // Deep Sky Navy
    scene.fog = new THREE.FogExp2(0x001229, 0.008);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(0, 75, 110);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xa67c27, 2, 100);
    pointLight.position.set(0, 30, 0);
    scene.add(pointLight);

    // 4. Ground Grid Terrain
    const gridHelper = new THREE.GridHelper(160, 32, 0xa67c27, 0x1e3a5f);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x011c3b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2;
    planeMesh.position.y = -0.2;
    planeMesh.receiveShadow = true;
    scene.add(planeMesh);

    // 5. Build 3D Plot Extrusions in Spatial Grid
    const plotMeshes = [];
    const cols = 5;
    const spacing = 24;

    plots.forEach((plot, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = (col - (cols - 1) / 2) * spacing;
      const z = (row - 1.5) * spacing;

      const plotWidth = Math.max(12, plot.width * 0.4);
      const plotDepth = Math.max(12, plot.length * 0.4);
      const plotHeight = plot.status === 'Sold' ? 8 : plot.status === 'Booked' ? 6 : 4;

      const geometry = new THREE.BoxGeometry(plotWidth, plotHeight, plotDepth);

      let colorHex = 0x10b981; // Available Emerald
      if (plot.status === 'Booked') colorHex = 0xf59e0b; // Booked Amber
      if (plot.status === 'Sold') colorHex = 0x3b82f6; // Sold Blue

      const material = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.4,
        emissive: colorHex,
        emissiveIntensity: 0.15,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, plotHeight / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { plot };

      scene.add(mesh);
      plotMeshes.push(mesh);
    });

    // 6. Interactive Raycasting for 3D Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(plotMeshes);

      if (intersects.length > 0) {
        const clickedPlot = intersects[0].object.userData.plot;
        setSelected3DPlot(clickedPlot);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 7. Interactive Orbit Rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y,
      };

      const deltaRotationQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, (deltaMove.x * Math.PI) / 180 * 0.5, 0, 'XYZ')
      );

      scene.quaternion.multiplyQuaternions(deltaRotationQuaternion, scene.quaternion);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 8. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      scene.rotation.y += 0.001; // Subtle slow orbit rotation
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [plots]);

  const handleOpenDetails = (plotId) => {
    setSelectedPlotId(plotId);
    setActiveModule('Plot Details');
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-700">view_in_ar</span>
            <h2 className="text-xl font-bold text-[#001B3A]">3D Spatial GIS Plot Viewer</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Interactive Three.js 3D spatial terrain visualization. Drag mouse to orbit view, click plots to inspect.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMapMode('2D View')}
            className="px-3.5 py-1.5 rounded-md text-xs font-bold text-gray-600 hover:text-[#001B3A]"
          >
            2D Layout Grid
          </button>
          <button
            onClick={() => setMapMode('3D View')}
            className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#001B3A] text-white shadow-xs"
          >
            3D Spatial Viewer
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WebGL Canvas */}
        <div className="lg:col-span-2 bg-[#001229] rounded-xl border border-gray-800 shadow-2xl relative overflow-hidden h-[550px] flex flex-col justify-between">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Controls Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-[10px] text-amber-300 font-mono tracking-wider border border-white/10">
            Click Plot Block to Inspect • Mouse Drag to Rotate 3D Camera
          </div>
        </div>

        {/* Selected Plot Drawer Overlay */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs flex flex-col justify-between">
          {selected3DPlot ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    3D Spatial Selected Plot
                  </span>
                  <h3 className="text-xl font-black text-[#001B3A]">
                    Plot {selected3DPlot.plotNumber}
                  </h3>
                </div>
                <span
                  className={`status-tag ${
                    selected3DPlot.status === 'Available'
                      ? 'status-success'
                      : selected3DPlot.status === 'Booked'
                      ? 'status-pending'
                      : 'status-drafting bg-blue-100 text-blue-800'
                  }`}
                >
                  {selected3DPlot.status}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between">
                  <span className="text-gray-500">Project / Layout:</span>
                  <span className="font-bold text-[#001B3A]">{selected3DPlot.project}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Spatial Dimensions:</span>
                  <span className="font-mono font-bold">{selected3DPlot.length} × {selected3DPlot.width} ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plot Area:</span>
                  <span className="font-bold text-emerald-800">{selected3DPlot.area} sq.ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valuation:</span>
                  <span className="font-bold text-[#001B3A]">{formatCurrency(selected3DPlot.valuation)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-500">Owner / Customer:</span>
                  <span className="font-bold text-gray-800">{selected3DPlot.customerName || '— Unassigned —'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleOpenDetails(selected3DPlot.id)}
                  className="w-full py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>View Details & Verification</span>
                </button>

                {selected3DPlot.status === 'Available' && (
                  <button
                    onClick={() => onOpenBookingModal(selected3DPlot)}
                    className="w-full py-2 bg-[#A67C27] hover:bg-[#8e681e] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    <span>Book Plot Now</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-xs">
              Click any 3D plot extrusion block to view spatial specs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
