import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function LayoutUploadModal({ isOpen, onClose, onProcessCadastralPdf }) {
  const { areas } = useApp();

  const [mode, setMode] = useState('js'); // 'js' or 'pdf'
  const [selectedProjectId, setSelectedProjectId] = useState(areas[0]?.id || 'AREA-001');
  const [layoutName, setLayoutName] = useState('Pure JS Demarcation Plan 2026');
  const [file, setFile] = useState(null);
  
  // JS Generator State
  const [totalPlots, setTotalPlots] = useState(30);
  const [plotWidthFt, setPlotWidthFt] = useState(30);
  const [plotLengthFt, setPlotLengthFt] = useState(50);
  const [roadWidthFt, setRoadWidthFt] = useState(40);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file (.pdf)');
        return;
      }
      setFile(selectedFile);
      if (!layoutName || layoutName.startsWith('Pure JS')) {
        setLayoutName(selectedFile.name.replace('.pdf', '').replace(/_/g, ' '));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadStep(1);

    const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://sky-cadastral.onrender.com/api');

    try {
      if (mode === 'js') {
        setUploadStep(2);
        const res = await fetch(`${apiBase}/cadastral/generate-js-layout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layoutName: layoutName || 'Pure JS Demarcation Plan',
            projectName: areas.find(a => a.id === selectedProjectId)?.name || 'Sky Cadastral JS Phase 1',
            totalPlots: Number(totalPlots) || 30,
            plotsPerRow: 6,
            plotWidthFt: Number(plotWidthFt) || 30,
            plotLengthFt: Number(plotLengthFt) || 50,
            roadWidthFt: Number(roadWidthFt) || 40
          })
        });

        setUploadStep(3);
        if (res.ok) {
          const data = await res.json();
          setIsUploading(false);
          if (onProcessCadastralPdf) {
            onProcessCadastralPdf(data);
          } else {
            onClose();
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to generate JS layout');
          setIsUploading(false);
        }
      } else { // Mode: PDF
        if (!file) {
          alert('Please select a PDF file');
          setIsUploading(false);
          return;
        }

        setUploadStep(2);
        const formData = new FormData();
        formData.append('pdfFile', file);

        const res = await fetch(`${apiBase}/cadastral/parse-pdf`, {
          method: 'POST',
          body: formData
        });

        setUploadStep(3);
        if (res.ok) {
          const data = await res.json();
          setIsUploading(false);
          if (onProcessCadastralPdf) {
            onProcessCadastralPdf(data);
          } else {
            onClose();
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || 'Failed to parse PDF');
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.error('Error generating layout:', err);
      alert(`Error generating layout: ${err.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#A67C27] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">architecture</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#001B3A]">Register Cadastral Demarcation Plan</h3>
              <p className="text-xs text-gray-500">Generate clean plot outlines via Pure JS Engine or upload PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('js')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'js' ? 'bg-[#001B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            <span>Pure JS Vector Engine (No PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('pdf')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'pdf' ? 'bg-[#001B3A] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>Upload Cadastral PDF File</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Target Project Dropdown */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Target Project / Layout Area</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border rounded-lg text-xs outline-none focus:border-[#A67C27]"
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} — {area.address}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Plan Name */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">Layout Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Pure JS Cadastral Demarcation Plan"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
            />
          </div>

          {mode === 'js' ? (
            /* Pure JS Engine Controls */
            <div className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-[#001B3A] font-black text-xs">
                <span className="material-symbols-outlined text-amber-600">bolt</span>
                <span>JavaScript Vector Geometry Controls</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Total Plots to Generate</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={totalPlots}
                    onChange={(e) => setTotalPlots(e.target.value)}
                    className="w-full p-2 bg-white border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Facing Road Width (ft)</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={roadWidthFt}
                    onChange={(e) => setRoadWidthFt(e.target.value)}
                    className="w-full p-2 bg-white border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Plot Width (ft)</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={plotWidthFt}
                    onChange={(e) => setPlotWidthFt(e.target.value)}
                    className="w-full p-2 bg-white border rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 mb-1">Plot Length (ft)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={plotLengthFt}
                    onChange={(e) => setPlotLengthFt(e.target.value)}
                    className="w-full p-2 bg-white border rounded-lg outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-amber-800/90 font-medium">
                ⚡ JS Engine automatically constructs non-overlapping 2D polygon rings, edge length annotations, area statements, facing directions, and 40ft layout road geometry.
              </p>
            </div>
          ) : (
            /* PDF Upload Dropzone */
            <div>
              <label className="block font-bold text-gray-700 mb-1">Official Layout PDF File</label>
              <div className="border-2 border-dashed border-gray-300 hover:border-[#A67C27] bg-gray-50/50 p-6 rounded-xl text-center relative cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">picture_as_pdf</span>
                {file ? (
                  <div>
                    <p className="font-bold text-[#001B3A]">{file.name}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Valid Vector/Raster Layout PDF
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-gray-700">Click or drag & drop layout PDF file here</p>
                    <p className="text-[11px] text-gray-400 mt-1">Supports CAD Vector PDFs, Scanned Drawings & Layout Maps (Up to 50MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Status Stepper */}
          {isUploading && (
            <div className="bg-[#001229] text-white p-4 rounded-xl space-y-3 font-mono">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#A67C27] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A67C27] animate-ping" />
                  Cadastral Plan Processing Pipeline
                </span>
                <span className="text-gray-400">Job ID: #JOB-{(Date.now()).toString().slice(-4)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${uploadStep >= 1 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadStep > 1 ? 'check_circle' : 'sync'}
                  </span>
                  <span>Step 1 — Initialize Demarcation Plan Specification</span>
                </div>

                <div className={`flex items-center gap-2 ${uploadStep >= 2 ? 'text-amber-400 animate-pulse' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadStep > 2 ? 'check_circle' : 'extension'}
                  </span>
                  <span>Step 2 — Calculate Vector Coordinates, Edge Dimensions & Infrastructure</span>
                </div>

                <div className={`flex items-center gap-2 ${uploadStep >= 3 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">schema</span>
                  <span>Step 3 — Build Normalized Plot Geometries & Plan Outline</span>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (mode === 'pdf' && !file)}
              className="px-5 py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold rounded-lg shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>
                {isUploading
                  ? 'Generating Layout...'
                  : mode === 'js'
                  ? 'Generate JS Cadastral Plan'
                  : 'Upload & Process PDF'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
