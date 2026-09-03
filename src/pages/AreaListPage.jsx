import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { plotService } from '../services/plotService';
import { 
  MapPin, 
  Layers, 
  ChevronRight, 
  Map as MapIcon, 
  FileText, 
  Search, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function AreaListPage() {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAreas() {
      setLoading(true);
      setError('');

      try {
        const data = await plotService.getPublishedAreas();
        setLayouts(data);
      } catch (err) {
        console.error('Error loading areas:', err);
        setError(err.message || 'Unable to load published areas. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadAreas();
  }, []);

  // Group layouts into Project Areas cleanly
  const areas = useMemo(() => {
    const grouped = new Map();

    for (const layout of layouts) {
      const areaId = layout.projectId || layout.id;
      const areaName = layout.name || layout.projectName || 'Sky Cadastral Layout';

      if (!grouped.has(areaId)) {
        grouped.set(areaId, {
          id: areaId,
          name: areaName,
          location: layout.location || layout.address || 'Prime IT Corridor, Pune',
          status: layout.status || 'Published',
          layouts: [],
        });
      }

      grouped.get(areaId).layouts.push(layout);
    }

    return Array.from(grouped.values());
  }, [layouts]);

  // Filter areas based on user search query
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const q = searchQuery.trim().toLowerCase();
    return areas.filter((a) => 
      a.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.layouts.some((l) => (l.layoutName || l.name).toLowerCase().includes(q))
    );
  }, [areas, searchQuery]);

  // Compute aggregate portal stats
  const totalPlotsCount = useMemo(() => {
    return layouts.reduce((sum, l) => sum + (l.plotCount || l.extracted_plots_count || 0), 0);
  }, [layouts]);

  return (
    <div className="area-list-page">
      <Navbar />

      <main className="area-list-main">
        <div className="area-list-container">
          
          {/* Header Banner */}
          <header className="area-list-header">
            <div className="area-list-eyebrow-wrapper">
              <span className="area-list-eyebrow">
                <Sparkles size={13} style={{ display: 'inline', marginRight: '6px' }} />
                CADASTRAL MASTER PORTAL
              </span>
              <span className="area-live-badge">
                <span className="area-live-dot" /> LIVE NEON DATABASE SYNC
              </span>
            </div>

            <h1>Select a Cadastral Project Area</h1>
            <p>
              Choose a verified demarcation layout plan below to inspect interactive 2D vector polygons & 3D real-time land plot availability.
            </p>

            {/* Portal Stats Bar */}
            <div className="area-stats-bar">
              <div className="area-stat-item">
                <Building2 size={20} className="area-stat-icon" />
                <div>
                  <strong>{areas.length}</strong>
                  <span>Sanctioned Projects</span>
                </div>
              </div>
              <div className="area-stat-divider" />
              <div className="area-stat-item">
                <Layers size={20} className="area-stat-icon" />
                <div>
                  <strong>{totalPlotsCount > 0 ? totalPlotsCount : '60+'}</strong>
                  <span>Demarcated Plots</span>
                </div>
              </div>
              <div className="area-stat-divider" />
              <div className="area-stat-item">
                <ShieldCheck size={20} className="area-stat-icon" />
                <div>
                  <strong>100%</strong>
                  <span>RERA & Title Clear</span>
                </div>
              </div>
            </div>

            {/* Search Filter Input */}
            <div className="area-search-wrapper">
              <Search size={18} className="area-search-icon" />
              <input
                type="text"
                placeholder="Search area by project name, layout plan, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="area-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="area-search-clear"
                >
                  Clear
                </button>
              )}
            </div>
          </header>

          {/* Main Area Cards Grid */}
          {loading ? (
            <div className="area-list-state">
              <div className="area-loading-spinner" />
              <span>Loading published cadastral areas from database...</span>
            </div>
          ) : error ? (
            <div className="area-list-state error">
              <span>{error}</span>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="area-list-state">
              <span>No project areas match your search query "{searchQuery}".</span>
            </div>
          ) : (
            <div className="area-grid">
              {filteredAreas.map((area) => (
                <section key={area.id} className="area-card">
                  <div className="area-card-header">
                    <div className="area-card-icon">
                      <MapIcon size={22} />
                    </div>
                    <div className="area-card-title-group">
                      <div className="area-card-top-row">
                        <h2>{area.name}</h2>
                        <span className="area-status-pill">
                          <CheckCircle2 size={12} /> RERA Verified
                        </span>
                      </div>
                      {area.location && (
                        <p className="area-location">
                          <MapPin size={14} />
                          <span>{area.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Layout Plans List */}
                  <div className="area-layout-list">
                    {area.layouts.map((layout) => {
                      const count = layout.plotCount ?? layout.extracted_plots_count ?? 0;
                      const status = layout.approvalStatus || layout.status || 'Verified';
                      return (
                        <div key={layout.id} className="area-layout-item-wrapper">
                          <Link
                            to={`/plots/${layout.id}`}
                            className="area-layout-link"
                          >
                            <div className="area-layout-info">
                              <div className="area-layout-badge">
                                <Layers size={18} />
                              </div>
                              <div>
                                <strong>{layout.layoutName || layout.name}</strong>
                                <div className="area-layout-meta-row">
                                  <span className="area-meta-tag">
                                    {count > 0 ? `${count} Verified Plots` : 'Vector Master Plan'}
                                  </span>
                                  <span className="area-meta-dot">•</span>
                                  <span className="area-meta-status">{status}</span>
                                </div>
                              </div>
                            </div>

                            <div className="area-layout-action">
                              <span>Explore 2D / 3D</span>
                              <ChevronRight size={18} />
                            </div>
                          </Link>

                          {/* Official PDF Document Reference Badge */}
                          {layout.pdfUrl && (
                            <div className="area-pdf-container">
                              <a
                                href={layout.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="area-pdf-link"
                                title="Download Official Cadastral Layout PDF"
                              >
                                <FileText size={14} />
                                <span>Official Layout PDF ({layout.pdfName || 'Download'})</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
