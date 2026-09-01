import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function LayoutUploadModal({ isOpen, onClose }) {
  const { areas, uploadLayoutPdf } = useApp();

  const [selectedProjectId, setSelectedProjectId] = useState(areas[0]?.id || 'AREA-001');
  const [layoutName, setLayoutName] = useState('');
  const [file, setFile] = useState(null);
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
      if (!layoutName) {
        setLayoutName(selectedFile.name.replace('.pdf', '').replace(/_/g, ' '));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;

    const targetProject = areas.find((a) => a.id === selectedProjectId);

    setIsUploading(true);
    setUploadStep(1);

    setTimeout(() => {
      setUploadStep(2);
    }, 1000);

    setTimeout(() => {
      uploadLayoutPdf({
        projectId: selectedProjectId,
        projectName: targetProject?.name || 'Sky Cadastral Layout',
        name: layoutName || file.name.replace('.pdf', ''),
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        originalPdfUrl: URL.createObjectURL(file)
      });
      setIsUploading(false);
      setUploadStep(3);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 relative">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#A67C27] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#001B3A]">Upload Layout PDF Document</h3>
              <p className="text-xs text-gray-500">Official cadastral demarcation plan for vector & OCR extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
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
              placeholder="e.g. Master Demarcation Layout 2026 Phase 1"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none focus:border-[#A67C27]"
            />
          </div>

          {/* PDF Dropzone */}
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

          {/* Processing Status Stepper */}
          {isUploading && (
            <div className="bg-[#001229] text-white p-4 rounded-xl space-y-3 font-mono">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#A67C27] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A67C27] animate-ping" />
                  PDF Cadastral Processing Pipeline
                </span>
                <span className="text-gray-400">Job ID: #JOB-{(Date.now()).toString().slice(-4)}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${uploadStep >= 1 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadStep > 1 ? 'check_circle' : 'sync'}
                  </span>
                  <span>Step 1 — Store Original Source PDF Document</span>
                </div>

                <div className={`flex items-center gap-2 ${uploadStep >= 2 ? 'text-amber-400 animate-pulse' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadStep > 2 ? 'check_circle' : 'extension'}
                  </span>
                  <span>Step 2 — Vector Path Extraction & OCR Plot Number Recognition</span>
                </div>

                <div className={`flex items-center gap-2 ${uploadStep >= 3 ? 'text-emerald-400' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">schema</span>
                  <span>Step 3 — Build Normalized Plot Geometries & Specifications</span>
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
              disabled={!file || isUploading}
              className="px-5 py-2 bg-[#001B3A] hover:bg-[#002652] text-white font-bold rounded-lg shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>{isUploading ? 'Extracting Plots...' : 'Upload & Process PDF'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
