import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  if (!toast.show) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold text-white ${
          isError ? 'bg-rose-800 border-rose-900' : 'bg-[#001B3A] border-[#A67C27]'
        }`}
      >
        <span className="material-symbols-outlined text-lg text-[#A67C27]">
          {isError ? 'error' : 'check_circle'}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
