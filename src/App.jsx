import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AreaListPage from './pages/AreaListPage';
import './App.css';

const PlotExplorer = lazy(() => import('./pages/PlotExplorer'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: '#0f172a',
      color: '#38bdf8',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #334155',
        borderTopColor: '#38bdf8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ marginTop: '16px', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
        Loading Sky Cadastral 3D Engine...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/plots" element={<AreaListPage />} />
            <Route path="/plots/:layoutId" element={<PlotExplorer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
