import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Map } from 'lucide-react';
import logoImg from '../../assets/logo.jpeg';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isPlotsSection = location.pathname.startsWith('/plots');

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo & Title */}
        <Link to="/" className="nav-brand">
          <img src={logoImg} alt="Sky Cadastral Logo" className="brand-logo-img" />
          <div className="brand-text">
            <span className="brand-title">SKY CADASTRAL</span>
            <span className="brand-tagline">Land Survey & Mapping Services</span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/plots"
            className={`nav-link ${isPlotsSection ? 'active' : ''}`}
          >
            Plots Explorer
          </Link>
          <a href="/#services" className="nav-link">
            Services
          </a>
          <a href="/#about" className="nav-link">
            About Us
          </a>
          <a href="/#contact" className="nav-link">
            Contact
          </a>
        </div>

        {/* Right Phone & CTA Button */}
        <div className="nav-actions">
          <a href="tel:8600104192" className="nav-phone">
            <Phone className="phone-icon" size={16} />
            <span>8600104192</span>
          </a>

          <Link to="/plots" className="nav-cta-btn">
            <Map size={16} />
            <span>Explore 3D Plots</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
