import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { INITIAL_PLOTS_DATA, LAYOUT_METADATA } from '../data/plots';
import { formatPrice } from '../utils/geometryUtils';
import { LayoutDashboard, CheckCircle, AlertCircle, Lock, RefreshCw, Layers } from 'lucide-react';

export default function DemoAdmin() {
  const [plots, setPlots] = useState(INITIAL_PLOTS_DATA);

  const totalPlots = plots.length;
  const availableCount = plots.filter((p) => p.status.toLowerCase() === 'available').length;
  const bookedCount = plots.filter((p) => p.status.toLowerCase() === 'booked').length;
  const soldCount = plots.filter((p) => p.status.toLowerCase() === 'sold').length;

  const totalRevenue = plots.reduce((acc, p) => acc + p.price, 0);
  const bookedRevenue = plots.filter(p => p.status !== 'available').reduce((acc, p) => acc + p.price, 0);

  const handleStatusToggle = (plotId, newStatus) => {
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, status: newStatus } : p))
    );
  };

  return (
    <div className="admin-page-wrapper">
      <Navbar />

      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-title-group">
            <LayoutDashboard className="admin-icon" />
            <div>
              <h2>Demo Layout Management Dashboard</h2>
              <p>{LAYOUT_METADATA.name} • {LAYOUT_METADATA.surveyNumber}</p>
            </div>
          </div>
          <div className="admin-badge">
            <span>STATIC DEMO ADMIN MODE</span>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="stat-label">Total Inventory</span>
            <span className="stat-value">{totalPlots} Plots</span>
            <span className="stat-sub">35,200 sq.ft Total Layout</span>
          </div>

          <div className="admin-stat-card available">
            <span className="stat-label">Available Plots</span>
            <span className="stat-value">{availableCount}</span>
            <span className="stat-sub">Ready for Booking</span>
          </div>

          <div className="admin-stat-card booked">
            <span className="stat-label">Booked Plots</span>
            <span className="stat-value">{bookedCount}</span>
            <span className="stat-sub">Pending Confirmation</span>
          </div>

          <div className="admin-stat-card sold">
            <span className="stat-label">Sold Out</span>
            <span className="stat-value">{soldCount}</span>
            <span className="stat-sub">Registration Completed</span>
          </div>

          <div className="admin-stat-card revenue">
            <span className="stat-label">Inventory Valuation</span>
            <span className="stat-value">{formatPrice(totalRevenue)}</span>
            <span className="stat-sub">Booked Value: {formatPrice(bookedRevenue)}</span>
          </div>
        </div>

        {/* Master Plan Metadata Banner */}
        <div className="admin-meta-card">
          <h3><Layers size={18} /> Master Plan Specification</h3>
          <div className="meta-info-grid">
            <div>
              <span>Layout Title:</span>
              <strong>{LAYOUT_METADATA.name}</strong>
            </div>
            <div>
              <span>Location:</span>
              <strong>{LAYOUT_METADATA.location}</strong>
            </div>
            <div>
              <span>Approval Status:</span>
              <strong>{LAYOUT_METADATA.approvalStatus}</strong>
            </div>
            <div>
              <span>Survey Numbers:</span>
              <strong>{LAYOUT_METADATA.surveyNumber}</strong>
            </div>
          </div>
        </div>

        {/* Plot Inventory Table */}
        <div className="admin-table-card">
          <div className="table-header">
            <h3>Plot Inventory Control</h3>
            <p>Click status buttons below to test live status updates across the demo.</p>
          </div>

          <div className="table-responsive">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Plot No.</th>
                  <th>Sector</th>
                  <th>Area (sq.ft)</th>
                  <th>Price (₹)</th>
                  <th>Facing</th>
                  <th>Type</th>
                  <th>Current Status</th>
                  <th>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {plots.map((plot) => (
                  <tr key={plot.id}>
                    <td><strong>{plot.plotNumber}</strong></td>
                    <td>{plot.sector}</td>
                    <td>{plot.area}</td>
                    <td>{formatPrice(plot.price)}</td>
                    <td>{plot.facing}</td>
                    <td>{plot.type}</td>
                    <td>
                      <span className={`status-pill ${plot.status.toLowerCase()}`}>
                        {plot.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-group">
                        <button
                          className={`action-btn available ${plot.status === 'available' ? 'active' : ''}`}
                          onClick={() => handleStatusToggle(plot.id, 'available')}
                        >
                          Available
                        </button>
                        <button
                          className={`action-btn booked ${plot.status === 'booked' ? 'active' : ''}`}
                          onClick={() => handleStatusToggle(plot.id, 'booked')}
                        >
                          Booked
                        </button>
                        <button
                          className={`action-btn sold ${plot.status === 'sold' ? 'active' : ''}`}
                          onClick={() => handleStatusToggle(plot.id, 'sold')}
                        >
                          Sold
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
