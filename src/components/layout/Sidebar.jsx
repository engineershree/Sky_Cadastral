import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo.jpeg';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const {
    activeModule,
    setActiveModule,
    plotsFilter,
    setPlotsFilter,
    setSelectedAreaFilter,
    logout,
    plots,
    areas
  } = useApp();

  const [plotsDropdownOpen, setPlotsDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard' },
    {
      name: 'Plots',
      icon: 'landscape',
      hasSubnav: true,
      subItems: [
        { name: 'All Plots', action: 'all', count: plots.length },
        { name: 'Areas', action: 'areas', count: areas.length },
      ],
    },
    { name: 'Bookings', icon: 'bookmark_added' },
    { name: 'Daily Diary', icon: 'edit_calendar' },
    { name: 'Revenue', icon: 'payments' },
    { name: 'Reports', icon: 'assessment' },
    { name: 'Settings', icon: 'settings' },
  ];

  const handlePlotsSubNav = (action) => {
    if (action === 'all') {
      setActiveModule('Plots');
      setPlotsFilter('All');
      setSelectedAreaFilter('All');
    } else if (action === 'areas') {
      setActiveModule('Areas');
    }
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside
      id="sidebar"
      className={`fixed md:sticky top-0 z-50 h-screen flex flex-col transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Sky Cadastral Logo"
            className="w-10 h-10 rounded-lg object-cover border border-[#A67C27] shadow-sm"
          />
          <div>
            <h1 className="font-display-lg text-[18px] leading-tight font-black uppercase tracking-widest text-white">
              Sky Cadastral
            </h1>
            <p className="text-[10px] text-[#A67C27] font-mono font-bold tracking-wider uppercase">
              Land Admin Control
            </p>
          </div>
        </div>
        {setMobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-white/70 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeModule === item.name || (item.name === 'Plots' && activeModule === 'Areas');

          if (item.hasSubnav) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveModule(item.name);
                    setPlotsDropdownOpen(!plotsDropdownOpen);
                    if (setMobileOpen) setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(166,124,39,0.2)] to-transparent border-l-2 border-[#A67C27] text-[#A67C27]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <span
                    className={`material-symbols-outlined text-xs transition-transform duration-200 ${
                      plotsDropdownOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Sub-navigation Links (Closed by default) */}
                {plotsDropdownOpen && (
                  <div className="pl-9 pr-2 space-y-1 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.subItems.map((sub) => {
                      const isSubActive =
                        (sub.action === 'all' && activeModule === 'Plots') ||
                        (sub.action === 'areas' && activeModule === 'Areas');

                      return (
                        <button
                          key={sub.name}
                          onClick={() => handlePlotsSubNav(sub.action)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-[11px] font-medium transition-all ${
                            isSubActive
                              ? 'bg-[#A67C27]/20 text-[#A67C27] font-bold'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span>{sub.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-700 text-gray-300">
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => {
                setActiveModule(item.name);
                if (setMobileOpen) setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[rgba(166,124,39,0.2)] to-transparent border-l-2 border-[#A67C27] text-[#A67C27]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full ring-2 ring-[#A67C27] overflow-hidden flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              alt="Akash Kamble"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKEbT-uIJi_QETpg2XEco4v4qg5z-fsO_HMAO4WuEH-8OXe8ZoPzX9077w0ZbNo9LGMSfMKauGZ5gKiHgWDIcMT9RClsWF5hEotjqMyZOowUul2X99csb3QevQAfHzycawMqPMqNjXmV0SHWPIA1WA4vMuOwqnFxhr8eVEg7nelQvmOGPL4tKeHeCPft6KkMmjzFm5ijddt5n75dghShcfzaw7FX6-tBuYru2wCtE5AJ49NrAfjUQdJg"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">Akash Kamble</p>
            <p className="text-[10px] text-[#A67C27] font-medium uppercase tracking-wider">Lead Land Surveyor</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-white/60 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          title="Sign Out Admin"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </aside>
  );
}
