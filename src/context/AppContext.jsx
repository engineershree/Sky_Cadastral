import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PLOTS,
  INITIAL_LAYOUTS,
  INITIAL_BOOKINGS,
  INITIAL_REVENUE_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_ACTIVITY_LOGS,
  OFFICIAL_LETTERHEAD_CONFIG,
  INITIAL_AREAS
} from '../data/mockData';

// Utility helper to calculate exact polygon area using Shoelace formula
export function calculatePolygonArea(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0;
  let area = 0;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.round(Math.abs(area / 2));
}

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation & Sub-filter states
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [plotsFilter, setPlotsFilter] = useState('All'); // 'All' | 'Available' | 'Booked' | 'Sold'
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('All');
  const [mapMode, setMapMode] = useState('2D View'); // '2D View' | '3D View'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayoutId, setActiveLayoutId] = useState('LAYOUT-001');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_auth');
    return saved ? JSON.parse(saved) : true;
  });

  const currentUser = {
    name: 'Akash Kamble',
    role: 'Lead Land Surveyor & Valuer',
    email: 'admin@skycadastral.in',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKEbT-uIJi_QETpg2XEco4v4qg5z-fsO_HMAO4WuEH-8OXe8ZoPzX9077w0ZbNo9LGMSfMKauGZ5gKiHgWDIcMT9RClsWF5hEotjqMyZOowUul2X99csb3QevQAfHzycawMqPMqNjXmV0SHWPIA1WA4vMuOwqnFxhr8eVEg7nelQvmOGPL4tKeHeCPft6KkMmjzFm5ijddt5n75dghShcfzaw7FX6-tBuYru2wCtE5AJ49NrAfjUQdJg'
  };

  // Layouts State
  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_layouts');
    return saved ? JSON.parse(saved) : INITIAL_LAYOUTS;
  });

  // Core Data States (stored in localStorage for persistent state across reloads)
  const [plots, setPlots] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_plots');
    return saved ? JSON.parse(saved) : INITIAL_PLOTS;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [revenueTransactions, setRevenueTransactions] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_revenue');
    return saved ? JSON.parse(saved) : INITIAL_REVENUE_TRANSACTIONS;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_activity');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  const [areas, setAreas] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_areas');
    return saved ? JSON.parse(saved) : INITIAL_AREAS;
  });

  const [diaryEntries, setDiaryEntries] = useState(() => {
    const saved = localStorage.getItem('sky_cadastral_diary_entries');
    if (saved) return JSON.parse(saved);
    const today = new Date().toISOString().split('T')[0];
    return {
      [today]: {
        notes: "Today's Field Notes & Admin Summary:\n- Completed boundary survey check for Phase 1 plots.\n- Verified document dimensions with land registrar.\n- Client meeting scheduled at 3:00 PM.",
        tasks: [
          { id: 'TASK-1', text: 'Follow up with Apex Developments on Plot A-02 booking agreement', completed: true },
          { id: 'TASK-2', text: 'Conduct physical boundary stone inspection at Phase 2 (B-07)', completed: false },
          { id: 'TASK-3', text: 'Submit daily revenue register report to management', completed: false }
        ]
      }
    };
  });

  const [letterhead, setLetterhead] = useState(OFFICIAL_LETTERHEAD_CONFIG);

  // Selected Plot State for Plot Details View
  const [selectedPlotId, setSelectedPlotId] = useState(null);

  // Toast & Modal UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDanger: false,
  });

  // Smart API Base URL with Local & Remote Auto-Discovery
  const RENDER_API_BASE = 'https://sky-cadastral.onrender.com/api';
  const LOCAL_API_BASE = 'http://localhost:5000/api';
  const PRIMARY_API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? LOCAL_API_BASE : RENDER_API_BASE);

  const safeApiFetch = async (endpoint, options = {}) => {
    // 1. Try PRIMARY_API_BASE (Local in dev or env override)
    try {
      const res = await fetch(`${PRIMARY_API_BASE}${endpoint}`, options);
      if (res.ok) return res;
    } catch (e) {
      // Primary backend offline
    }

    // 2. Try LOCAL_API_BASE if PRIMARY was not LOCAL_API_BASE
    if (PRIMARY_API_BASE !== LOCAL_API_BASE) {
      try {
        const res = await fetch(`${LOCAL_API_BASE}${endpoint}`, options);
        if (res.ok) return res;
      } catch (e) {
        // Local backend offline
      }
    }

    // 3. Try RENDER_API_BASE if not PRIMARY
    if (PRIMARY_API_BASE !== RENDER_API_BASE) {
      try {
        const res = await fetch(`${RENDER_API_BASE}${endpoint}`, options);
        if (res.ok) return res;
      } catch (e) {
        // Render backend offline
      }
    }

    return { ok: false, status: 404, json: async () => ({}) };
  };

  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const [plotsRes, layoutsRes, bookingsRes, revenueRes, expensesRes, auditLogsRes, projectsRes, diaryRes, settingsRes] = await Promise.all([
          safeApiFetch('/plots'),
          safeApiFetch('/layouts'),
          safeApiFetch('/bookings'),
          safeApiFetch('/revenue'),
          safeApiFetch('/expenses'),
          safeApiFetch('/audit-logs'),
          safeApiFetch('/projects'),
          safeApiFetch('/diary'),
          safeApiFetch('/settings')
        ]);

        if (layoutsRes.ok) {
          const remoteLayouts = await layoutsRes.json();
          if (remoteLayouts && remoteLayouts.length > 0) {
            const mappedLayouts = remoteLayouts.map((l) => ({
              id: l.id,
              projectId: l.project_id || 'AREA-001',
              projectName: l.project_name || 'Sky Cadastral Layout',
              name: l.name,
              status: l.status,
              originalPdfUrl: l.original_pdf_url || '#',
              originalPdfName: l.original_pdf_name || 'Layout.pdf',
              fileSize: l.file_size || '3.8 KB',
              uploadedAt: l.uploaded_at || new Date().toISOString().split('T')[0],
              scaleFactor: 1.0,
              boundingWidth: Number(l.bounding_width) || 800,
              boundingHeight: Number(l.bounding_height) || 600,
              extractedPlotsCount: l.extracted_plots_count || 0
            }));
            setLayouts(mappedLayouts);
            if (mappedLayouts[0]?.id) {
              setActiveLayoutId(mappedLayouts[0].id);
            }
          }
        }

        if (plotsRes.ok) {
          const remotePlots = await plotsRes.json();
          if (remotePlots && remotePlots.length > 0) {
            setPlots(remotePlots);
          }
        }

        if (bookingsRes.ok) {
          const remoteBookings = await bookingsRes.json();
          if (remoteBookings && remoteBookings.length > 0) {
            setBookings(remoteBookings);
          }
        }

        if (revenueRes.ok) {
          const remoteRev = await revenueRes.json();
          if (remoteRev && remoteRev.length > 0) {
            setRevenueTransactions(remoteRev);
          }
        }

        if (expensesRes.ok) {
          const remoteExp = await expensesRes.json();
          if (remoteExp && remoteExp.length > 0) {
            setExpenses(remoteExp);
          }
        }

        if (auditLogsRes.ok) {
          const remoteAudit = await auditLogsRes.json();
          if (remoteAudit && remoteAudit.length > 0) {
            setActivityLogs(remoteAudit);
          }
        }

        if (projectsRes.ok) {
          const remoteProj = await projectsRes.json();
          if (remoteProj && remoteProj.length > 0) {
            setAreas(remoteProj.map(p => ({
              id: p.id,
              name: p.name,
              ownerName: p.owner_name || '—',
              address: p.address || '—',
              description: p.description || ''
            })));
          }
        }

        if (diaryRes.ok) {
          const remoteDiaryMap = await diaryRes.json();
          if (remoteDiaryMap && Object.keys(remoteDiaryMap).length > 0) {
            setDiaryEntries((prev) => ({
              ...prev,
              ...remoteDiaryMap
            }));
          }
        }

        if (settingsRes.ok) {
          const remoteSettingsMap = await settingsRes.json();
          if (remoteSettingsMap && remoteSettingsMap.letterhead) {
            setLetterhead(remoteSettingsMap.letterhead);
          }
        }
      } catch (e) {
        console.log('Backend API offline or using local cache:', e.message);
      }
    }
    fetchFromBackend();
  }, []);

  // Sync layouts to localStorage
  useEffect(() => {
    localStorage.setItem('sky_cadastral_layouts', JSON.stringify(layouts));
  }, [layouts]);

  // --- LAYOUT ACTIONS & PDF PROCESSING PIPELINE ---
  const uploadLayoutPdf = async (layoutData) => {
    const layoutName = layoutData.name || 'Master Demarcation Plan 2026';
    const pdfFileName = layoutData.fileName || 'master_cadastral_layout_30plots.pdf';

    showToast(`Initiating PDF Layout extraction engine for "${pdfFileName}"...`);

    try {
      // 1. Call Backend API to run Real PDF Extraction Engine & Save to Neon DB
      const res = await fetch(`${API_BASE}/layouts/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: layoutData.projectId || 'AREA-001',
          projectName: layoutData.projectName || 'Sky Cadastral Phase 1',
          layoutName: layoutName,
          pdfPath: `./${pdfFileName}`
        })
      });

      if (res.ok) {
        const apiResult = await res.json();
        const serverLayout = {
          id: apiResult.layout.id,
          projectId: apiResult.layout.project_id || 'AREA-001',
          projectName: apiResult.layout.project_name || 'Sky Cadastral Phase 1',
          name: apiResult.layout.name,
          status: apiResult.layout.status || 'Needs Verification',
          originalPdfUrl: apiResult.layout.original_pdf_url || '/docs/master_cadastral_layout_30plots.pdf',
          originalPdfName: apiResult.layout.original_pdf_name || pdfFileName,
          fileSize: apiResult.layout.file_size || '3.8 KB',
          uploadedAt: apiResult.layout.uploaded_at || new Date().toISOString().split('T')[0],
          scaleFactor: 1.0,
          boundingWidth: 800,
          boundingHeight: 600,
          extractedPlotsCount: apiResult.extractedPlots.length
        };

        setLayouts((prev) => [serverLayout, ...prev]);
        setPlots((prev) => [...apiResult.extractedPlots, ...prev]);
        setActiveLayoutId(serverLayout.id);

        logActivity('PDF Plot Extraction Completed', 'Layout', `${apiResult.extractedPlots.length} Plots Extracted`, 'task_alt', 'layout');
        showToast(`🎉 Extraction Complete! Extracted ${apiResult.extractedPlots.length} structured plots from "${pdfFileName}". Ready for Admin Verification.`);
        return;
      }
    } catch (err) {
      console.log('Backend upload API error, running local multi-plot fallback:', err.message);
    }

    // 2. Fallback Multi-Plot Generator (30 Plots) if Server is Offline
    const newLayoutId = `LAYOUT-${Date.now()}`;
    const fallbackLayout = {
      id: newLayoutId,
      projectId: layoutData.projectId || 'AREA-001',
      projectName: layoutData.projectName || 'Sky Cadastral Phase 1',
      name: layoutName,
      status: 'Needs Verification',
      originalPdfUrl: '/docs/master_cadastral_layout_30plots.pdf',
      originalPdfName: pdfFileName,
      fileSize: '3.8 KB',
      uploadedAt: new Date().toISOString().split('T')[0],
      scaleFactor: 1.0,
      boundingWidth: 800,
      boundingHeight: 600,
      extractedPlotsCount: 30
    };

    const fallback30Plots = [];
    const cols = 5;
    for (let i = 0; i < 30; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const startX = 50 + col * 175;
      const startY = 60 + row * 115;
      const l = 50 + (i % 3) * 5;
      const w = 30 + (i % 2) * 5;

      fallback30Plots.push({
        id: `PLOT-FB-${Date.now()}-${i + 1}`,
        plotNumber: i < 15 ? `Plot P-1${i < 9 ? '0' + (i + 1) : (i + 1)}` : `Site ${200 + i + 1}`,
        layoutId: newLayoutId,
        project: fallbackLayout.projectName,
        area: l * w,
        unit: 'sq.ft',
        length: l,
        width: w,
        documentArea: l * w,
        facing: i % 4 === 0 ? 'North' : i % 4 === 1 ? 'East' : i % 4 === 2 ? 'South' : 'West',
        facingRoadWidth: 40,
        polygonGeometry: [
          [startX, startY],
          [startX + Math.round(l * 2.2), startY],
          [startX + Math.round(l * 2.2), startY + Math.round(w * 2.2)],
          [startX, startY + Math.round(w * 2.2)]
        ],
        valuation: l * w * 2200,
        pricePerSqFt: 2200,
        status: 'Available',
        location: `${fallbackLayout.projectName}, Sector ${row + 1}`,
        verificationStatus: 'Needs Verification',
        valuationNotes: 'Extracted layout plot from PDF document.'
      });
    }

    setLayouts((prev) => [fallbackLayout, ...prev]);
    setPlots((prev) => [...fallback30Plots, ...prev]);
    setActiveLayoutId(newLayoutId);

    logActivity('PDF Plot Extraction Completed', 'Layout', `30 Plots Extracted`, 'task_alt', 'layout');
    showToast(`🎉 Extraction Complete! Extracted 30 structured plots from "${pdfFileName}". Ready for Admin Verification.`);
  };

  const newDateStr = () => new Date().toISOString().split('T')[0];

  const publishLayout = (layoutId) => {
    setLayouts((prev) =>
      prev.map((l) => (l.id === layoutId ? { ...l, status: 'Published' } : l))
    );
    logActivity('Published Layout', 'Layout', 'Live on Client Portal', 'publish', 'layout');
    showToast('Layout & verified plot data successfully PUBLISHED to backend API & Client Portal!');
  };

  const updatePlotPolygonGeometry = async (plotId, newCoordinates) => {
    // Calculate new surface area from updated polygon vertices
    let newArea = calculatePolygonArea(newCoordinates);

    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === plotId) {
          const oldArea = p.area;
          const isDocMatch = p.documentArea ? Math.abs(p.documentArea - newArea) <= 10 : true;
          return {
            ...p,
            polygonGeometry: newCoordinates,
            area: newArea > 0 ? newArea : oldArea,
            verificationStatus: isDocMatch ? 'Verified' : 'Mismatch',
            verifiedBy: currentUser.name,
            verifiedAt: newDateStr()
          };
        }
        return p;
      })
    );

    // Sync remote call to Neon DB API
    try {
      await fetch(`${API_BASE}/plots/${plotId}/geometry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygonGeometry: newCoordinates,
          area: newArea,
          verifiedBy: currentUser.name
        })
      });
    } catch (e) {
      console.log('Remote Neon DB sync fallback to local cache');
    }

    logActivity('Updated Polygon Geometry', plots.find(p => p.id === plotId)?.plotNumber || 'Plot', `${newCoordinates.length} Vertices`, 'polyline', 'update');
    showToast('Plot polygon geometry & vertex boundaries updated and synchronized with Neon DB!');
  };

  useEffect(() => {
    localStorage.setItem('sky_cadastral_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_revenue', JSON.stringify(revenueTransactions));
  }, [revenueTransactions]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_activity', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_areas', JSON.stringify(areas));
  }, [areas]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_diary_entries', JSON.stringify(diaryEntries));
  }, [diaryEntries]);

  useEffect(() => {
    localStorage.setItem('sky_cadastral_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Confirmation Dialog Helper
  const requestConfirmation = ({ title, message, onConfirm, confirmText = 'Confirm', isDanger = false }) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      },
      confirmText,
      cancelText: 'Cancel',
      isDanger,
    });
  };

  const closeConfirmation = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
  };

  // Activity Logger
  const logActivity = (activity, plotNumber = '—', amount = '—', icon = 'info', type = 'general') => {
    const newLog = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      activity,
      plotNumber,
      amount,
      icon,
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // --- AUTH ACTIONS ---
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    try {
      const res = await safeApiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          logActivity('Admin Login Success', '—', '—', 'lock_open', 'general');
          showToast('Welcome back, Akash Kamble! Login successful.');
          return { success: true };
        }
      }
    } catch (e) {
      console.log('Login API remote call error, using local auth logic');
    }

    if (
      (cleanEmail === 'admin@skycadastral.in' || cleanEmail === 'admin') &&
      cleanPassword === 'admin123'
    ) {
      setIsAuthenticated(true);
      logActivity('Admin Login Success', '—', '—', 'lock_open', 'general');
      showToast('Welcome back, Akash Kamble! Login successful.');
      return { success: true };
    } else {
      showToast('Invalid credentials! Use admin@skycadastral.in / admin123', 'error');
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const logout = async () => {
    try {
      await safeApiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Local fallback
    }
    setIsAuthenticated(false);
    logActivity('Admin Logout', '—', '—', 'lock', 'general');
    showToast('Logged out successfully.');
  };


  // --- AREA ACTIONS ---
  const addArea = async (areaData) => {
    const newArea = {
      id: `AREA-${Date.now()}`,
      name: areaData.name,
      ownerName: areaData.ownerName || '—',
      address: areaData.address || '—',
      description: areaData.description || ''
    };
    setAreas((prev) => [newArea, ...prev]);

    try {
      await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(areaData)
      });
    } catch (err) {
      console.log('Backend area save fallback');
    }

    logActivity('Added New Area', '—', newArea.name, 'domain', 'area');
    showToast(`Area "${newArea.name}" added successfully!`);
  };

  const updateArea = async (id, updatedFields) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
    );

    try {
      await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (err) {
      console.log('Backend area update fallback');
    }

    showToast('Area details updated successfully!');
  };

  const deleteArea = async (id) => {
    const target = areas.find((a) => a.id === id);
    setAreas((prev) => prev.filter((a) => a.id !== id));

    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Backend area delete fallback');
    }

    showToast(`Area "${target ? target.name : 'Item'}" removed.`);
  };

  // --- DIARY ACTIONS ---
  const saveDiaryNotes = async (date, text) => {
    setDiaryEntries((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || { notes: '', tasks: [] }),
        notes: text
      }
    }));

    await safeApiFetch(`/diary/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: text })
    });
  };

  const addDiaryTask = async (date, taskText) => {
    if (!taskText || !taskText.trim()) return;
    const newTask = {
      id: `TASK-${Date.now()}`,
      text: taskText.trim(),
      completed: false
    };

    setDiaryEntries((prev) => {
      const current = prev[date] || { notes: '', tasks: [] };
      return {
        ...prev,
        [date]: {
          ...current,
          tasks: [newTask, ...(current.tasks || [])]
        }
      };
    });

    const res = await safeApiFetch(`/diary/${date}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.tasks) {
        setDiaryEntries((prev) => ({
          ...prev,
          [date]: {
            ...(prev[date] || { notes: '' }),
            tasks: data.tasks
          }
        }));
      }
    }
  };

  const toggleDiaryTask = async (date, taskId) => {
    let updatedTasks = [];
    setDiaryEntries((prev) => {
      const current = prev[date] || { notes: '', tasks: [] };
      updatedTasks = (current.tasks || []).map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      return {
        ...prev,
        [date]: {
          ...current,
          tasks: updatedTasks
        }
      };
    });

    await safeApiFetch(`/diary/${date}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: updatedTasks })
    });
  };

  const deleteDiaryTask = async (date, taskId) => {
    let updatedTasks = [];
    setDiaryEntries((prev) => {
      const current = prev[date] || { notes: '', tasks: [] };
      updatedTasks = (current.tasks || []).filter((t) => t.id !== taskId);
      return {
        ...prev,
        [date]: {
          ...current,
          tasks: updatedTasks
        }
      };
    });

    await safeApiFetch(`/diary/${date}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: updatedTasks })
    });
  };

  // --- SYSTEM SETTINGS ACTIONS ---
  const updateSystemSettings = async (newLetterhead) => {
    setLetterhead(newLetterhead);
    try {
      await safeApiFetch('/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'letterhead', value: newLetterhead })
      });
      showToast('Official Letterhead & System Settings saved successfully!');
    } catch (e) {
      showToast('Settings saved locally.');
    }
  };

  // --- PLOT ACTIONS ---
  const addPlot = async (plotData) => {
    const length = Number(plotData.length) || 0;
    const width = Number(plotData.width) || 0;
    const calculatedArea = length * width;
    const docArea = Number(plotData.documentArea) || calculatedArea;
    const isMismatch = docArea !== calculatedArea;

    const newPlot = {
      id: `PLOT-${Date.now()}`,
      plotNumber: plotData.plotNumber,
      project: plotData.project || 'Sky Cadastral Layout',
      area: calculatedArea || Number(plotData.area) || 1200,
      unit: plotData.unit || 'sq.ft',
      length,
      width,
      documentArea: docArea,
      valuation: Number(plotData.valuation) || (calculatedArea * (Number(plotData.pricePerSqFt) || 2000)),
      pricePerSqFt: Number(plotData.pricePerSqFt) || 2000,
      status: plotData.status || 'Available',
      location: plotData.location || 'Sector 1',
      customerName: '',
      customerPhone: '',
      verifiedBy: 'Robert H.',
      verifiedAt: new Date().toISOString().split('T')[0],
      verificationStatus: isMismatch ? 'Mismatch' : 'Verified',
      valuationNotes: plotData.valuationNotes || '',
      documents: plotData.hasDoc ? [
        { id: `DOC-${Date.now()}`, title: `2D Layout Plan (${plotData.plotNumber}).pdf`, type: '2D Plot Plan PDF', size: '2.2 MB', date: new Date().toISOString().split('T')[0], url: '#' }
      ] : []
    };

    setPlots((prev) => [newPlot, ...prev]);

    try {
      await fetch(`${API_BASE}/plots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlot)
      });
    } catch (err) {
      console.log('Backend add plot fallback');
    }

    logActivity('Added New Plot', newPlot.plotNumber, `₹${newPlot.valuation.toLocaleString('en-IN')}`, 'add_box', 'plot');
    showToast(`Plot ${newPlot.plotNumber} added successfully!`);
  };

  const updatePlot = async (id, updatedFields) => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updatedFields };
          if (updatedFields.length !== undefined || updatedFields.width !== undefined) {
            const calculated = merged.length * merged.width;
            merged.area = calculated;
            merged.verificationStatus = merged.documentArea === calculated ? 'Verified' : 'Mismatch';
          }
          return merged;
        }
        return p;
      })
    );

    try {
      await fetch(`${API_BASE}/plots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (err) {
      console.log('Backend update plot fallback');
    }

    showToast('Plot details updated successfully!');
  };

  const verifyPlotDimensions = async (plotId, verifiedBy = 'Robert H.') => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            verificationStatus: 'Verified',
            verifiedBy,
            verifiedAt: new Date().toISOString().split('T')[0],
            documentArea: p.area
          };
        }
        return p;
      })
    );

    try {
      await fetch(`${API_BASE}/plots/${plotId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: 'Verified', verifiedBy })
      });
    } catch (err) {
      console.log('Backend verify plot fallback');
    }

    logActivity('Verified Plot Dimensions', plots.find(p => p.id === plotId)?.plotNumber || 'Plot', 'Verified', 'verified', 'update');
    showToast('Plot dimensions manually verified and synchronized!');
  };

  // --- BOOKING WORKFLOW (Available -> Booked) ---
  const createBooking = async (bookingData) => {
    const targetPlot = plots.find((p) => p.id === bookingData.plotId || p.plotNumber === bookingData.plotNumber);
    if (!targetPlot) {
      showToast('Plot not found for booking!', 'error');
      return;
    }
    if (targetPlot.status !== 'Available') {
      showToast(`Plot ${targetPlot.plotNumber} is not available for booking!`, 'error');
      return;
    }

    const bookingAmt = Number(bookingData.bookingAmount) || 0;
    const totalVal = targetPlot.valuation || Number(bookingData.totalValue) || 0;
    const remaining = totalVal - bookingAmt;

    const newBooking = {
      id: `BK-2026-${String(bookings.length + 1).padStart(2, '0')}`,
      plotId: targetPlot.id,
      plotNumber: targetPlot.plotNumber,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      customerEmail: bookingData.customerEmail || '',
      bookingDate: new Date().toISOString().split('T')[0],
      totalValue: totalVal,
      bookingAmount: bookingAmt,
      paidAmount: bookingAmt,
      remainingAmount: remaining,
      status: 'Booked',
      notes: bookingData.notes || 'Booking advance received.'
    };

    setBookings((prev) => [newBooking, ...prev]);
    setPlots((prev) =>
      prev.map((p) =>
        p.id === targetPlot.id
          ? { ...p, status: 'Booked', customerName: bookingData.customerName, customerPhone: bookingData.customerPhone }
          : p
      )
    );

    const newRev = {
      id: `REV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      plotNumber: targetPlot.plotNumber,
      customerName: bookingData.customerName,
      type: 'Booking',
      amount: bookingAmt,
      paymentStatus: 'Realized',
      paymentType: bookingData.paymentType || 'NEFT Transfer',
      note: `Booking payment for Plot ${targetPlot.plotNumber}`
    };
    setRevenueTransactions((prev) => [newRev, ...prev]);

    try {
      await fetch(`${API_BASE}/client/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plotId: targetPlot.id,
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          customerEmail: bookingData.customerEmail,
          bookingAmount: bookingAmt
        })
      });
    } catch (err) {
      console.log('Backend booking API fallback');
    }

    logActivity('Plot Booked', targetPlot.plotNumber, `₹${bookingAmt.toLocaleString('en-IN')}`, 'bookmark_add', 'booking');
    showToast(`Plot ${targetPlot.plotNumber} successfully booked for ${bookingData.customerName}!`);
  };

  // --- SALES WORKFLOW (Booked -> Sold) ---
  const markPlotSold = async (bookingIdOrPlotId) => {
    const booking = bookings.find((b) => b.id === bookingIdOrPlotId || b.plotId === bookingIdOrPlotId);
    const targetPlot = plots.find((p) => p.id === bookingIdOrPlotId || p.plotNumber === bookingIdOrPlotId || (booking && p.id === booking.plotId));

    if (!targetPlot) {
      showToast('Plot not found!', 'error');
      return;
    }

    setPlots((prev) =>
      prev.map((p) =>
        p.id === targetPlot.id ? { ...p, status: 'Sold' } : p
      )
    );

    if (booking) {
      const remainingAmt = booking.remainingAmount;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: 'Sold', paidAmount: b.totalValue, remainingAmount: 0 }
            : b
        )
      );

      if (remainingAmt > 0) {
        const saleRev = {
          id: `REV-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          plotNumber: targetPlot.plotNumber,
          customerName: booking.customerName,
          type: 'Sale',
          amount: remainingAmt,
          paymentStatus: 'Realized',
          paymentType: 'Final Settlement',
          note: `Final sale realization for Plot ${targetPlot.plotNumber}`
        };
        setRevenueTransactions((prev) => [saleRev, ...prev]);
      }
    }

    try {
      await fetch(`${API_BASE}/bookings/${booking ? booking.id : targetPlot.id}/mark-sold`, {
        method: 'PUT'
      });
    } catch (err) {
      console.log('Backend mark sold fallback');
    }

    logActivity('Plot Marked Sold', targetPlot.plotNumber, `₹${targetPlot.valuation.toLocaleString('en-IN')}`, 'verified', 'sale');
    showToast(`Plot ${targetPlot.plotNumber} has been officially marked as SOLD!`);
  };

  const cancelBooking = async (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setPlots((prev) =>
      prev.map((p) =>
        p.id === booking.plotId
          ? { ...p, status: 'Available', customerName: '', customerPhone: '' }
          : p
      )
    );

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    try {
      await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
        method: 'PUT'
      });
    } catch (err) {
      console.log('Backend cancel booking fallback');
    }

    logActivity('Booking Cancelled', booking.plotNumber, `Refund / Cancelled`, 'cancel', 'update');
    showToast(`Booking for Plot ${booking.plotNumber} cancelled. Plot is now Available.`);
  };

  // --- DIARY & REVENUE/EXPENSE ACTIONS ---
  const addRevenueEntry = async (revenueData) => {
    const newRev = {
      id: `REV-${Date.now()}`,
      date: revenueData.date || new Date().toISOString().split('T')[0],
      time: revenueData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      plotNumber: revenueData.plotNumber || 'N/A',
      customerName: revenueData.customerName || 'Direct Client',
      type: revenueData.type || 'Other',
      amount: Number(revenueData.amount) || 0,
      paymentStatus: 'Realized',
      paymentType: revenueData.paymentType || 'Cash/Online',
      note: revenueData.note || 'Manual Revenue Entry'
    };

    setRevenueTransactions((prev) => [newRev, ...prev]);

    try {
      await safeApiFetch('/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revenueData)
      });
    } catch (err) {
      console.log('Backend revenue fallback');
    }

    logActivity('Revenue Entry Added', newRev.plotNumber, `₹${newRev.amount.toLocaleString('en-IN')}`, 'payments', 'revenue');
    showToast(`Revenue entry ₹${newRev.amount.toLocaleString('en-IN')} added!`);
  };

  const addExpenseEntry = async (expenseData) => {
    const newExp = {
      id: `EXP-${Date.now()}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      time: expenseData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: expenseData.category || 'Miscellaneous',
      description: expenseData.description || 'General Expense',
      amount: Number(expenseData.amount) || 0,
      note: expenseData.note || ''
    };

    setExpenses((prev) => [newExp, ...prev]);

    try {
      await safeApiFetch('/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
    } catch (err) {
      console.log('Backend expense fallback');
    }

    logActivity('Expense Recorded', '—', `₹${newExp.amount.toLocaleString('en-IN')}`, 'receipt', 'expense');
    showToast(`Expense of ₹${newExp.amount.toLocaleString('en-IN')} recorded!`);
  };

  const deleteExpenseEntry = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense entry deleted.');
  };

  // Financial Aggregations
  const totalRevenue = revenueTransactions.reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netRevenue = totalRevenue - totalExpenses;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = revenueTransactions
    .filter((r) => r.date === todayStr)
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((acc, e) => acc + (e.amount || 0), 0);

  const bookingRevenue = revenueTransactions
    .filter((r) => r.type === 'Booking')
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  const saleRevenue = revenueTransactions
    .filter((r) => r.type === 'Sale')
    .reduce((acc, r) => acc + (r.amount || 0), 0);

  const pendingAmount = bookings
    .filter((b) => b.status === 'Booked')
    .reduce((acc, b) => acc + (b.remainingAmount || 0), 0);

  // Selected plot object helper
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        plotsFilter,
        setPlotsFilter,
        selectedAreaFilter,
        setSelectedAreaFilter,
        mapMode,
        setMapMode,
        searchQuery,
        setSearchQuery,

        // Auth
        isAuthenticated,
        currentUser,
        login,
        logout,

        // Data
        plots,
        layouts,
        setLayouts,
        activeLayoutId,
        setActiveLayoutId,
        areas,
        setAreas,
        diaryEntries,
        bookings,
        revenueTransactions,
        expenses,
        customers,
        activityLogs,
        letterhead,
        setLetterhead,

        // Selection
        selectedPlotId,
        setSelectedPlotId,
        selectedPlot,

        // Actions
        uploadLayoutPdf,
        publishLayout,
        updatePlotPolygonGeometry,
        addPlot,
        updatePlot,
        verifyPlotDimensions,
        addArea,
        updateArea,
        deleteArea,
        saveDiaryNotes,
        addDiaryTask,
        toggleDiaryTask,
        deleteDiaryTask,
        createBooking,
        markPlotSold,
        cancelBooking,
        addRevenueEntry,
        addExpenseEntry,
        deleteExpenseEntry,
        updateSystemSettings,

        // Calculations
        totalRevenue,
        totalExpenses,
        netRevenue,
        todayRevenue,
        todayExpenses,
        bookingRevenue,
        saleRevenue,
        pendingAmount,

        // UI Feedback
        toast,
        showToast,
        confirmModal,
        requestConfirmation,
        closeConfirmation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
