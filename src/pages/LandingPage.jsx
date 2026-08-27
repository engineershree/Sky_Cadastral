import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  Compass,
  Map,
  ShieldCheck,
  Phone,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Award,
  Layers,
  FileCheck,
  Sparkles
} from 'lucide-react';

import landingImg from '../assets/landing.png';
import landing2Img from '../assets/landing2.png';

export default function LandingPage() {
  return (
    <div className="landing-page-wrapper">
      <Navbar />

      {/* Hero Section with Official Survey Imagery Backdrop */}
      <header className="hero-stitch">
        <div className="hero-bg-image-layer">
          <img src={landingImg} alt="Land Surveying & Mapping Field Imagery" className="hero-bg-img" />
          <div className="hero-bg-gradient-overlay"></div>
        </div>
        <div className="hero-overlay-grid"></div>
        <div className="container relative-z">
          <div className="hero-content-max">
            <div className="system-status-tag">
              <span className="dot-pulse"></span>
              <span>SYSTEM STATUS: VERIFIED • CAD ENGINE 3.0</span>
            </div>
            <h1 className="hero-title-stitch">
              Sky Cadastral: Professional Land Survey &amp; Mapping Services
            </h1>
            <p className="hero-subtitle-stitch">
              Expert solutions for land surveying, plotting, counter mapping, layouts, N.A plotting, and building permissions.
            </p>
            <div className="hero-cta-group">
              <Link to="/plots" className="cta-gold-primary">
                <Map size={20} />
                <span>Explore 3D Master Plan</span>
                <ChevronRight size={18} />
              </Link>
              <a href="#contact" className="cta-outline-white">
                <Phone size={18} />
                <span>Contact Akash Kamble</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Core Geomatics Services Section */}
      <section className="services-section" id="services">
        <div className="container">
          <div className="section-header-stitch text-center">
            <span className="technical-kicker">SPATIAL ENGINEERING &amp; SURVEYING</span>
            <h2 className="section-title-stitch">Core Geomatics Services</h2>
            <p className="section-desc-stitch">
              Precision engineering and spatial data collection across multiple cadastral disciplines.
            </p>
          </div>

          <div className="services-grid-stitch">
            {/* Service 1 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">📐</div>
                <h3 className="card-title">Land Survey</h3>
                <p className="card-desc">
                  Comprehensive services with precise measurements using GPS and total station technology.
                </p>
                <div className="card-tech-tag">PRECISION: ±0.5MM</div>
              </div>
            </div>

            {/* Service 2 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">🗺️</div>
                <h3 className="card-title">Land Plotting</h3>
                <p className="card-desc">
                  Accurate mapping for property documentation with detailed cadastral maps and legal boundaries.
                </p>
                <div className="card-tech-tag">GIS CAD INTEGRATED</div>
              </div>
            </div>

            {/* Service 3 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">📊</div>
                <h3 className="card-title">Counter Mapping</h3>
                <p className="card-desc">
                  Detailed land analysis and topographical surveys for residential and commercial development.
                </p>
                <div className="card-tech-tag">CONTOUR TOPOGRAPHY</div>
              </div>
            </div>

            {/* Service 4 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">🏗️</div>
                <h3 className="card-title">Lay-out Planning</h3>
                <p className="card-desc">
                  Expert planning for optimal land utilization, road networks, and master community design.
                </p>
                <div className="card-tech-tag">2D/3D LAYOUT SYNCRONIZED</div>
              </div>
            </div>

            {/* Service 5 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">🌾</div>
                <h3 className="card-title">N.A Plotting</h3>
                <p className="card-desc">
                  Specialized services for agricultural land conversion and non-agricultural permissions.
                </p>
                <div className="card-tech-tag">GOVT COMPLIANT</div>
              </div>
            </div>

            {/* Service 6 */}
            <div className="stitch-card group">
              <div className="grid-bg"></div>
              <div className="card-inner">
                <div className="service-icon-box">📋</div>
                <h3 className="card-title">Building Permission</h3>
                <p className="card-desc">
                  Complete assistance ensuring full compliance with local municipal regulations and zoning laws.
                </p>
                <div className="card-tech-tag">LEGAL SANCTION</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us & Leadership Section */}
      <section className="about-section" id="about">
        <div className="container">
          <div className="about-grid-stitch">
            <div className="about-left">
              <div className="system-status-tag-amber">
                <span>QUALIFIED LEADERSHIP &amp; CERTIFICATION</span>
              </div>
              <h2 className="section-title-stitch">Expertise &amp; Precision in Every Measurement</h2>
              <p className="about-lead-text">
                Sky Cadastral leverages the latest technology to deliver exact, reliable spatial data for all surveying and mapping needs. Our commitment to accuracy ensures your projects start on solid ground.
              </p>

              <div className="checklist-stitch">
                <div className="check-row">
                  <CheckCircle2 className="check-gold" size={20} />
                  <span>Licensed &amp; Certified Surveyors</span>
                </div>
                <div className="check-row">
                  <CheckCircle2 className="check-gold" size={20} />
                  <span>Advanced DGPS &amp; Total Station Technology</span>
                </div>
                <div className="check-row">
                  <CheckCircle2 className="check-gold" size={20} />
                  <span>Timely Project Delivery &amp; Zero Errors</span>
                </div>
                <div className="check-row">
                  <CheckCircle2 className="check-gold" size={20} />
                  <span>Transparent &amp; Competitive Pricing</span>
                </div>
              </div>

              {/* Leadership Box */}
              <div className="leadership-box-stitch">
                <div className="leadership-kicker">LEADERSHIP</div>
                <div className="leadership-name">Founder &amp; Owner: Akash Kamble</div>
                <div className="leadership-tags">
                  <span className="tech-badge">EXP: 10+ YRS</span>
                  <span className="tech-badge">ID: 8600104192</span>
                  <span className="tech-badge">MAHARASHTRA REGION</span>
                </div>
              </div>
            </div>

            <div className="about-right">
              <div className="visual-cad-preview-box">
                <img src={landing2Img} alt="Sky Cadastral Digital Twin Visual" className="cad-preview-img" />
                <div className="grid-bg"></div>
                <div className="cad-preview-content">
                  <div className="preview-top-badge">CADASTRAL 3D VECTOR PREVIEW</div>
                  <div className="visual-graphic-wireframe">
                    <Map size={48} className="wireframe-icon" />
                    <p className="wireframe-text">Interactive 2D + 3D Master Plan Viewports</p>
                  </div>
                  <Link to="/plots" className="view-plots-button-stitch">
                    Launch Interactive Master Plan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="contact-card-stitch">
            <h2 className="contact-title-stitch">Ready to start your project?</h2>
            <p className="contact-subtitle-stitch">Contact Akash Kamble for consultations, site visits, and instant quotes.</p>

            <div className="trust-badges-row">
              <span className="trust-badge"><ShieldCheck size={16} /> Licensed</span>
              <span className="trust-badge"><Award size={16} /> Insured</span>
              <span className="trust-badge"><Sparkles size={16} /> Experienced</span>
            </div>

            <div className="contact-info-grid-stitch">
              <div className="contact-col">
                <h3 className="col-heading">Contact Details</h3>
                <div className="contact-item">
                  <Phone className="item-icn" size={20} />
                  <div>
                    <div className="item-lbl">PHONE</div>
                    <div className="item-val">8600104192</div>
                  </div>
                </div>
                <div className="contact-item">
                  <User className="item-icn" size={20} />
                  <div>
                    <div className="item-lbl">OWNER</div>
                    <div className="item-val">Akash Kamble</div>
                  </div>
                </div>
              </div>

              <div className="contact-col">
                <h3 className="col-heading">Operations</h3>
                <div className="contact-item">
                  <Clock className="item-icn" size={20} />
                  <div>
                    <div className="item-lbl">HOURS</div>
                    <div className="item-val">Mon-Sat: 9AM-7PM</div>
                  </div>
                </div>
                <div className="contact-item">
                  <MapPin className="item-icn" size={20} />
                  <div>
                    <div className="item-lbl">AREA</div>
                    <div className="item-val">Maharashtra &amp; Surrounding Regions</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-bottom-cta">
              <a href="tel:8600104192" className="call-now-gold-btn">
                <Phone size={20} /> Call Now: 8600104192
              </a>
              <div className="guarantee-pills">
                <span>Available for consultations</span> • <span>Quick Response</span> • <span>Free Quotes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-stitch">
        <div className="container footer-inner">
          <div className="footer-brand-title">Sky Cadastral</div>
          <div className="footer-copy">
            © 2024 Sky Cadastral. Founded by Akash Kamble. All rights reserved. Precision in every point.
          </div>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <Link to="/plots">Plots</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
