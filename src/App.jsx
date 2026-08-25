import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PlotExplorer from './pages/PlotExplorer';
import DemoAdmin from './pages/DemoAdmin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/plots" element={<PlotExplorer />} />
          <Route path="/admin" element={<DemoAdmin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
