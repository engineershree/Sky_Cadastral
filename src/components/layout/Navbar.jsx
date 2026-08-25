import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Map, ShieldCheck, Phone, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <Compass className="brand-icon" />
          <div className="brand-text">
            <span className="brand-title">Sky Cadastral</span>
            <span className="brand-tagline">3D Land Plotting & Mapping</span>
          </div>
        </Link>

        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/plots"
            className={`nav-link ${isActive('/plots') ? 'active' : ''}`}
          >
            <Map className="link-icon" />
            Explore 3D Plots
          </Link>
          <Link
            to="/admin"
            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
          >
            <LayoutDashboard className="link-icon" />
            Demo Admin
          </Link>
        </div>

        <div className="nav-actions">
          <a href="tel:8600104192" className="nav-call-btn">
            <Phone className="call-icon" />
            <span>8600104192</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
