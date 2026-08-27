import { LAYOUT_METADATA, INITIAL_PLOTS_DATA, ROADS, GREEN_AREAS, ENTRANCE_GATE } from '../data/plots';
import { apiClient } from './apiClient';

// In-memory data store for the demo service phase
let canonicalPlots = [...INITIAL_PLOTS_DATA];

export const plotService = {
  /**
   * Fetch complete layout metadata and geometry
   */
  async getLayout(layoutId = LAYOUT_METADATA.id) {
    await apiClient.get(`/api/layouts/${layoutId}`);
    return {
      metadata: LAYOUT_METADATA,
      roads: ROADS,
      greenAreas: GREEN_AREAS,
      entranceGate: ENTRANCE_GATE,
      plots: canonicalPlots
    };
  },

  /**
   * Fetch all canonical land plots
   */
  async getPlots(layoutId = LAYOUT_METADATA.id) {
    await apiClient.get(`/api/layouts/${layoutId}/plots`);
    return [...canonicalPlots];
  },

  /**
   * Fetch single plot by plot ID
   */
  async getPlot(plotId) {
    await apiClient.get(`/api/plots/${plotId}`);
    const plot = canonicalPlots.find((p) => p.id === plotId);
    if (!plot) {
      throw new Error(`Plot with ID ${plotId} not found.`);
    }
    return { ...plot };
  },

  /**
   * Search plots by plot number or sector
   */
  async searchPlots(query) {
    await apiClient.get('/api/plots/search', { query });
    if (!query || !query.trim()) return [...canonicalPlots];

    const cleanQuery = query.trim().toUpperCase();
    return canonicalPlots.filter(
      (p) =>
        p.plotNumber.toUpperCase().includes(cleanQuery) ||
        p.id.toUpperCase().includes(cleanQuery) ||
        p.facing.toUpperCase().includes(cleanQuery) ||
        p.status.toUpperCase().includes(cleanQuery)
    );
  },

  /**
   * Filter plots by status and facing
   */
  async filterPlots({ status = 'ALL', facing = 'ALL' }) {
    await apiClient.get('/api/plots/filter', { status, facing });
    return canonicalPlots.filter((p) => {
      const matchStatus =
        status === 'ALL' || p.status.toUpperCase() === status.toUpperCase();
      const matchFacing =
        facing === 'ALL' || p.facing.toLowerCase().includes(facing.toLowerCase());
      return matchStatus && matchFacing;
    });
  },

  /**
   * Update plot status (e.g. available -> booked)
   */
  async updatePlotStatus(plotId, newStatus) {
    await apiClient.patch(`/api/plots/${plotId}/status`, { status: newStatus });
    canonicalPlots = canonicalPlots.map((p) =>
      p.id === plotId ? { ...p, status: newStatus } : p
    );
    const updatedPlot = canonicalPlots.find((p) => p.id === plotId);
    return { ...updatedPlot };
  },

  /**
   * Reset demo data back to initial canonical state
   */
  resetData() {
    canonicalPlots = [...INITIAL_PLOTS_DATA];
    return [...canonicalPlots];
  }
};
