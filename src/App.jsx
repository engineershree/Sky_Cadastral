import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Modules
import Dashboard from './components/dashboard/Dashboard';
import PlotsList from './components/plots/PlotsList';
import PlotDetails from './components/plots/PlotDetails';
import AreasList from './components/areas/AreasList';
import BookingsList from './components/bookings/BookingsList';
import DailyDiary from './components/diary/DailyDiary';
import RevenueDashboard from './components/revenue/RevenueDashboard';
import ReportsView from './components/reports/ReportsView';
import SettingsView from './components/settings/SettingsView';

// Modals & UI
import AddPlotModal from './components/plots/AddPlotModal';
import AddAreaModal from './components/areas/AddAreaModal';
import BookPlotModal from './components/bookings/BookPlotModal';
import MarkSoldModal from './components/bookings/MarkSoldModal';
import AddRevenueModal from './components/diary/AddRevenueModal';
import AddExpenseModal from './components/diary/AddExpenseModal';
import ConfirmationModal from './components/ui/ConfirmationModal';
import Toast from './components/ui/Toast';

// Auth
import LoginPage from './components/auth/LoginPage';

function MainAppContent() {
  const { activeModule } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals visibility state
  const [addPlotModalOpen, setAddPlotModalOpen] = useState(false);
  const [plotToEdit, setPlotToEdit] = useState(null);

  const [addAreaModalOpen, setAddAreaModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState(null);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetPlotForBooking, setTargetPlotForBooking] = useState(null);

  const [markSoldModalOpen, setMarkSoldModalOpen] = useState(false);
  const [targetBookingForSold, setTargetBookingForSold] = useState(null);

  const [addRevenueModalOpen, setAddRevenueModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);

  const handleOpenAddPlot = () => {
    setPlotToEdit(null);
    setAddPlotModalOpen(true);
  };

  const handleOpenEditPlot = (plot) => {
    setPlotToEdit(plot);
    setAddPlotModalOpen(true);
  };

  const handleOpenAddArea = () => {
    setAreaToEdit(null);
    setAddAreaModalOpen(true);
  };

  const handleOpenEditArea = (area) => {
    setAreaToEdit(area);
    setAddAreaModalOpen(true);
  };

  const handleOpenBookingModal = (plot = null) => {
    setTargetPlotForBooking(plot);
    setBookingModalOpen(true);
  };

  const handleOpenMarkSoldModal = (booking) => {
    setTargetBookingForSold(booking);
    setMarkSoldModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#faf9fc] text-[#1b1b1e]">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div id="main-content" className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <Header
          setMobileOpen={setMobileMenuOpen}
          onOpenAddPlot={handleOpenAddPlot}
          onOpenAddBooking={() => handleOpenBookingModal()}
          onOpenAddRevenue={() => setAddRevenueModalOpen(true)}
          onOpenAddExpense={() => setAddExpenseModalOpen(true)}
        />

        {/* Dynamic Module Router */}
        <main className="flex-1">
          {activeModule === 'Dashboard' && (
            <Dashboard
              onOpenAddPlot={handleOpenAddPlot}
              onOpenAddBooking={() => handleOpenBookingModal()}
              onOpenAddRevenue={() => setAddRevenueModalOpen(true)}
              onOpenAddExpense={() => setAddExpenseModalOpen(true)}
            />
          )}

          {activeModule === 'Plots' && (
            <PlotsList
              onOpenAddPlot={handleOpenAddPlot}
              onOpenBookingModal={handleOpenBookingModal}
              onOpenEditPlot={handleOpenEditPlot}
            />
          )}

          {activeModule === 'Areas' && (
            <AreasList
              onOpenAddArea={handleOpenAddArea}
              onOpenEditArea={handleOpenEditArea}
            />
          )}

          {activeModule === 'Plot Details' && (
            <PlotDetails
              onOpenBookingModal={handleOpenBookingModal}
              onOpenEditPlot={handleOpenEditPlot}
            />
          )}

          {activeModule === 'Bookings' && (
            <BookingsList
              onOpenBookingModal={handleOpenBookingModal}
              onOpenMarkSold={handleOpenMarkSoldModal}
            />
          )}

          {activeModule === 'Daily Diary' && (
            <DailyDiary
              onOpenAddRevenue={() => setAddRevenueModalOpen(true)}
              onOpenAddExpense={() => setAddExpenseModalOpen(true)}
            />
          )}

          {activeModule === 'Revenue' && (
            <RevenueDashboard onOpenAddRevenue={() => setAddRevenueModalOpen(true)} />
          )}

          {activeModule === 'Reports' && <ReportsView />}

          {activeModule === 'Settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals & Overlay Drawers */}
      <AddPlotModal
        isOpen={addPlotModalOpen}
        onClose={() => setAddPlotModalOpen(false)}
        initialData={plotToEdit}
      />

      <AddAreaModal
        isOpen={addAreaModalOpen}
        onClose={() => setAddAreaModalOpen(false)}
        initialData={areaToEdit}
      />

      <BookPlotModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        targetPlot={targetPlotForBooking}
      />

      <MarkSoldModal
        isOpen={markSoldModalOpen}
        onClose={() => setMarkSoldModalOpen(false)}
        booking={targetBookingForSold}
      />

      <AddRevenueModal
        isOpen={addRevenueModalOpen}
        onClose={() => setAddRevenueModalOpen(false)}
      />

      <AddExpenseModal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
      />

      <ConfirmationModal />
      <Toast />
    </div>
  );
}

function AppContentWrapper() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainAppContent />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContentWrapper />
    </AppProvider>
  );
}
