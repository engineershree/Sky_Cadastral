import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_PLOTS,
  INITIAL_BOOKINGS,
  INITIAL_REVENUE_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_CUSTOMERS,
  INITIAL_ACTIVITY_LOGS,
  OFFICIAL_LETTERHEAD_CONFIG,
  INITIAL_AREAS
} from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation & Sub-filter states
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [plotsFilter, setPlotsFilter] = useState('All'); // 'All' | 'Available' | 'Booked' | 'Sold'
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('All');
  const [mapMode, setMapMode] = useState('2D View'); // '2D View' | '3D View'
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sync to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem('sky_cadastral_plots', JSON.stringify(plots));
  }, [plots]);

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
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

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

  const logout = () => {
    setIsAuthenticated(false);
    logActivity('Admin Logout', '—', '—', 'lock', 'general');
    showToast('Logged out successfully.');
  };

  // --- AREA ACTIONS ---
  const addArea = (areaData) => {
    const newArea = {
      id: `AREA-${Date.now()}`,
      name: areaData.name,
      ownerName: areaData.ownerName || '—',
      address: areaData.address || '—',
      description: areaData.description || ''
    };
    setAreas((prev) => [newArea, ...prev]);
    logActivity('Added New Area', '—', newArea.name, 'domain', 'area');
    showToast(`Area "${newArea.name}" added successfully!`);
  };

  const updateArea = (id, updatedFields) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a))
    );
    showToast('Area details updated successfully!');
  };

  const deleteArea = (id) => {
    const target = areas.find((a) => a.id === id);
    setAreas((prev) => prev.filter((a) => a.id !== id));
    showToast(`Area "${target ? target.name : 'Item'}" removed.`);
  };

  // --- DIARY ACTIONS ---
  const saveDiaryNotes = (date, text) => {
    setDiaryEntries((prev) => ({
      ...prev,
      [date]: {
        ...(prev[date] || { notes: '', tasks: [] }),
        notes: text
      }
    }));
  };

  const addDiaryTask = (date, taskText) => {
    if (!taskText.trim()) return;
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
  };

  const toggleDiaryTask = (date, taskId) => {
    setDiaryEntries((prev) => {
      const current = prev[date] || { notes: '', tasks: [] };
      return {
        ...prev,
        [date]: {
          ...current,
          tasks: (current.tasks || []).map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
        }
      };
    });
  };

  const deleteDiaryTask = (date, taskId) => {
    setDiaryEntries((prev) => {
      const current = prev[date] || { notes: '', tasks: [] };
      return {
        ...prev,
        [date]: {
          ...current,
          tasks: (current.tasks || []).filter((t) => t.id !== taskId)
        }
      };
    });
  };

  // --- PLOT ACTIONS ---
  const addPlot = (plotData) => {
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
    logActivity('Added New Plot', newPlot.plotNumber, `₹${newPlot.valuation.toLocaleString('en-IN')}`, 'add_box', 'plot');
    showToast(`Plot ${newPlot.plotNumber} added successfully!`);
  };

  const updatePlot = (id, updatedFields) => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updatedFields };
          // Auto recalculate area if length/width change
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
    showToast('Plot details updated successfully!');
  };

  const verifyPlotDimensions = (plotId, verifiedBy = 'Robert H.') => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === plotId) {
          return {
            ...p,
            verificationStatus: 'Verified',
            verifiedBy,
            verifiedAt: new Date().toISOString().split('T')[0],
            documentArea: p.area // Synchronize document area with verified calculated area
          };
        }
        return p;
      })
    );
    logActivity('Verified Plot Dimensions', plots.find(p => p.id === plotId)?.plotNumber || 'Plot', 'Verified', 'verified', 'update');
    showToast('Plot dimensions manually verified and synchronized!');
  };

  // --- BOOKING WORKFLOW (Available -> Booked) ---
  const createBooking = (bookingData) => {
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

    // 1. Add to Bookings
    setBookings((prev) => [newBooking, ...prev]);

    // 2. Update Plot Status (Available -> Booked)
    setPlots((prev) =>
      prev.map((p) =>
        p.id === targetPlot.id
          ? { ...p, status: 'Booked', customerName: bookingData.customerName, customerPhone: bookingData.customerPhone }
          : p
      )
    );

    // 3. Add to Revenue Realized Transactions
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

    // 4. Log Activity
    logActivity('Plot Booked', targetPlot.plotNumber, `₹${bookingAmt.toLocaleString('en-IN')}`, 'bookmark_add', 'booking');
    showToast(`Plot ${targetPlot.plotNumber} successfully booked for ${bookingData.customerName}!`);
  };

  // --- SALES WORKFLOW (Booked -> Sold) ---
  const markPlotSold = (bookingIdOrPlotId) => {
    const booking = bookings.find((b) => b.id === bookingIdOrPlotId || b.plotId === bookingIdOrPlotId);
    const targetPlot = plots.find((p) => p.id === bookingIdOrPlotId || p.plotNumber === bookingIdOrPlotId || (booking && p.id === booking.plotId));

    if (!targetPlot) {
      showToast('Plot not found!', 'error');
      return;
    }

    // 1. Update Plot Status (Booked -> Sold)
    setPlots((prev) =>
      prev.map((p) =>
        p.id === targetPlot.id ? { ...p, status: 'Sold' } : p
      )
    );

    // 2. Update Booking Status if present
    if (booking) {
      const remainingAmt = booking.remainingAmount;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: 'Sold', paidAmount: b.totalValue, remainingAmount: 0 }
            : b
        )
      );

      // Record final settlement payment if there was remaining amount
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

    logActivity('Plot Marked Sold', targetPlot.plotNumber, `₹${targetPlot.valuation.toLocaleString('en-IN')}`, 'verified', 'sale');
    showToast(`Plot ${targetPlot.plotNumber} has been officially marked as SOLD!`);
  };

  const cancelBooking = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // 1. Revert Plot Status (Booked -> Available)
    setPlots((prev) =>
      prev.map((p) =>
        p.id === booking.plotId
          ? { ...p, status: 'Available', customerName: '', customerPhone: '' }
          : p
      )
    );

    // 2. Remove / Update Booking Status
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));

    logActivity('Booking Cancelled', booking.plotNumber, `Refund / Cancelled`, 'cancel', 'update');
    showToast(`Booking for Plot ${booking.plotNumber} cancelled. Plot is now Available.`);
  };

  // --- DIARY & REVENUE/EXPENSE ACTIONS ---
  const addRevenueEntry = (revenueData) => {
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
    logActivity('Revenue Entry Added', newRev.plotNumber, `₹${newRev.amount.toLocaleString('en-IN')}`, 'payments', 'revenue');
    showToast(`Revenue entry ₹${newRev.amount.toLocaleString('en-IN')} added!`);
  };

  const addExpenseEntry = (expenseData) => {
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
