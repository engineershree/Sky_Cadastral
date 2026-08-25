import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Compass, Map, Shield, Phone, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page-wrapper">
      <Navbar />

      <header className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Compass size={16} />
            <span>Next-Gen 3D Cadastral Mapping</span>
          </div>
          <h1 className="hero-title">Sky Cadastral</h1>
          <p className="hero-subtitle">Professional Land Survey & Mapping Services</p>
          <p className="hero-description">
            Expert solutions for land surveying, plotting, counter mapping, layouts, N.A plotting, and building permissions. Explore our interactive 3D land plot master plans today.
          </p>

          <div className="hero-cta-group">
            <Link to="/plots" className="cta-button primary-cta">
              <Map size={18} />
              <span>Explore 3D Plots</span>
              <ChevronRight size={18} />
            </Link>
            <a href="#contact" className="cta-button secondary-cta">
              Get Started
            </a>
          </div>
        </div>
      </header>

      <section className="services" id="services">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📐</div>
              <h3>Land Survey</h3>
              <p>Comprehensive land surveying services with precise measurements and boundary determination using advanced GPS and total station technology.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🗺️</div>
              <h3>Land Plotting</h3>
              <p>Accurate land plotting and mapping services for property documentation with detailed cadastral maps and legal boundary descriptions.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📊</div>
              <h3>Counter Mapping</h3>
              <p>Professional counter mapping services for detailed land analysis, topographical surveys, and contour mapping for development projects.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🏗️</div>
              <h3>Lay-out</h3>
              <p>Expert layout planning and design for optimal land utilization, residential layouts, and commercial development planning.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🌾</div>
              <h3>N.A Plotting</h3>
              <p>Specialized N.A plotting services for agricultural land conversion, non-agricultural land use permissions, and rural development planning.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📋</div>
              <h3>Building Permission</h3>
              <p>Complete building permission assistance and documentation services, ensuring compliance with local regulations and zoning laws.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container">
          <h2 className="section-title">About Sky Cadastral</h2>
          <div className="about-content">
            <div className="about-text">
              <p>Sky Cadastral is a premier land surveying and mapping service provider dedicated to delivering accurate, reliable, and professional cadastral services. With years of expertise in the field, we specialize in comprehensive land surveying, plotting, and building permission services.</p>
              <p>Our commitment to precision and customer satisfaction has made us a trusted name in the industry. We use the latest technology and follow industry best practices to ensure the highest quality of service for all our clients.</p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <span className="highlight-icon">✓</span>
                  <span>Licensed & Certified Surveyors</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">✓</span>
                  <span>Advanced Technology & Equipment</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">✓</span>
                  <span>Timely Project Delivery</span>
                </div>
                <div className="highlight-item">
                  <span className="highlight-icon">✓</span>
                  <span>Competitive Pricing</span>
                </div>
              </div>
            </div>
            <div className="founder-info">
              <div className="founder-avatar">👨‍💼</div>
              <h3>Founder & Owner</h3>
              <p className="founder-name">Akash Kamble</p>
              <p className="founder-contact">📱 8600104192</p>
              <p className="founder-experience">10+ Years Experience</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Ready to start your land surveying project? Contact us today for a consultation and experience our professional services.</p>
              <div className="contact-details">
                <p><strong>📞 Phone:</strong> <a href="tel:8600104192">8600104192</a></p>
                <p><strong>👤 Owner:</strong> Akash Kamble</p>
                <p><strong>🕐 Business Hours:</strong> Mon-Sat: 9AM-7PM</p>
                <p><strong>📍 Service Area:</strong> Maharashtra & Surrounding Regions</p>
              </div>
              <div className="contact-badges">
                <span className="badge">✅ Licensed</span>
                <span className="badge">✅ Insured</span>
                <span className="badge">✅ Experienced</span>
              </div>
            </div>
            <div className="contact-cta">
              <div className="cta-icon">📞</div>
              <a href="tel:8600104192" className="contact-button">Call Now</a>
              <p>Available for consultations and project discussions</p>
              <div className="contact-features">
                <p>🚀 Quick Response</p>
                <p>💰 Free Quotes</p>
                <p>🎯 Expert Guidance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Sky Cadastral. All rights reserved. | Founded by Akash Kamble | Professional Land Survey & Mapping Services</p>
        </div>
      </footer>
    </div>
  );
}
