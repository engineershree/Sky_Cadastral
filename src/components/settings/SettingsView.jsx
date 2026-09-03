import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SettingsView() {
  const { letterhead, updateSystemSettings } = useApp();

  const [formConfig, setFormConfig] = useState(letterhead);

  React.useEffect(() => {
    setFormConfig(letterhead);
  }, [letterhead]);

  const handleSave = (e) => {
    e.preventDefault();
    updateSystemSettings(formConfig);
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-[#E5E9EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001B3A]">settings</span>
            <h2 className="text-xl font-bold text-[#001B3A]">System & Official Letterhead Settings</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure admin profile details, official company letterhead branding, and report templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Letterhead Configuration Form */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <span className="material-symbols-outlined text-[#A67C27]">badge</span>
            <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
              Official Sky Cadastral Letterhead
            </h3>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={formConfig.companyName}
                onChange={(e) => setFormConfig({ ...formConfig, companyName: e.target.value })}
                className="w-full p-2 border rounded outline-none focus:border-[#A67C27] font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tagline / Subtitle</label>
              <input
                type="text"
                value={formConfig.tagline}
                onChange={(e) => setFormConfig({ ...formConfig, tagline: e.target.value })}
                className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lead Surveyor / Valuer</label>
                <input
                  type="text"
                  value={formConfig.proprietor}
                  onChange={(e) => setFormConfig({ ...formConfig, proprietor: e.target.value })}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">RERA / Reg Number</label>
                <input
                  type="text"
                  value={formConfig.regNumber}
                  onChange={(e) => setFormConfig({ ...formConfig, regNumber: e.target.value })}
                  className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Official Address</label>
              <input
                type="text"
                value={formConfig.address}
                onChange={(e) => setFormConfig({ ...formConfig, address: e.target.value })}
                className="w-full p-2 border rounded outline-none focus:border-[#A67C27]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formConfig.phone}
                  onChange={(e) => setFormConfig({ ...formConfig, phone: e.target.value })}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Contact Email</label>
                <input
                  type="text"
                  value={formConfig.email}
                  onChange={(e) => setFormConfig({ ...formConfig, email: e.target.value })}
                  className="w-full p-2 border rounded outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#001B3A] text-white font-bold rounded-lg hover:bg-[#002652] shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Live Letterhead Preview Card */}
        <div className="bg-white rounded-xl border border-[#E5E9EB] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <span className="material-symbols-outlined text-blue-600">visibility</span>
            <h3 className="text-sm font-bold text-[#001B3A] uppercase tracking-wider">
              Letterhead Live Preview
            </h3>
          </div>

          <div className="p-6 bg-gray-50 border-2 border-dashed rounded-xl space-y-4 text-xs">
            <div className="border-b-2 border-[#A67C27] pb-4 flex justify-between items-start">
              <div>
                <h4 className="font-black text-sm text-[#001B3A] uppercase">{formConfig.companyName}</h4>
                <p className="text-[10px] text-[#A67C27] font-bold">{formConfig.tagline}</p>
                <p className="text-[10px] text-gray-600 mt-1">Valuer: {formConfig.proprietor}</p>
              </div>
              <div className="text-right text-[10px] text-gray-500 font-mono">
                <p className="font-bold text-[#001B3A]">{formConfig.regNumber}</p>
                <p>{formConfig.phone}</p>
                <p>{formConfig.email}</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded border text-center text-gray-400 text-xs italic">
              Official Sky Cadastral Land Statement & Revenue Certificate Template
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
