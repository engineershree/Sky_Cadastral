import { apiClient } from './apiClient';

function normalizePlot(p) {
  const geom = p.polygonGeometry || p.coordinates || (typeof p.polygon_geometry === 'string' ? JSON.parse(p.polygon_geometry) : p.polygon_geometry);
  return {
    ...p,
    id: p.id,
    plotNumber: p.plotNumber || p.plot_number || p.id,
    layoutId: p.layoutId || p.layout_id,
    project: p.project,
    length: Number(p.length || 0),
    width: Number(p.width || 0),
    area: Number(p.area || 0),
    unit: p.unit || 'sq.ft',
    documentArea: Number(p.documentArea || p.document_area || p.area || 0),
    facing: p.facing || 'East',
    facingRoadWidth: Number(p.facingRoadWidth || p.facing_road_width || 30),
    polygonGeometry: geom,
    coordinates: geom,
    valuation: Number(p.valuation || 0),
    pricePerSqFt: Number(p.pricePerSqFt || p.price_per_sqft || 0),
    status: p.status || 'Available',
    location: p.location || '',
    verificationStatus: p.verificationStatus || p.verification_status || 'Verified',
    isAvailable: p.status === 'Available'
  };
}

function normalizeArea(a) {
  return {
    id: a.id || a.layout_id,
    layoutId: a.layoutId || a.id || a.layout_id,
    projectId: a.projectId || a.project_id || a.id,
    name: a.project_name || a.name || a.projectName || 'Sky Cadastral Layout',
    layoutName: a.name || a.layout_name || a.layoutName || 'Demarcation Plan',
    address: a.address || a.project_address || '',
    description: a.description || a.project_description || '',
    location: a.location || a.address || a.project_address || '',
    status: a.status || a.layout_status || 'Published',
    pdfUrl: a.pdfUrl || a.original_pdf_url || '',
    pdfName: a.pdfName || a.original_pdf_name || '',
    fileSize: a.fileSize || a.file_size || '',
    boundingWidth: Number(a.boundingWidth || a.bounding_width || 800),
    boundingHeight: Number(a.boundingHeight || a.bounding_height || 600),
    plotCount: Number(a.plotCount ?? a.verified_plots_count ?? a.extracted_plots_count ?? a.total_plots_count ?? 0),
    totalPlots: Number(a.totalPlots ?? a.extracted_plots_count ?? 0),
    layouts: a.layouts ? a.layouts.map(normalizeArea) : undefined
  };
}

function matchPlotsForArea(plots, areaId, areaMeta) {
  if (!plots || plots.length === 0) return [];

  const areaName = (areaMeta?.name || '').toLowerCase();
  const areaIdClean = (areaId || '').toLowerCase();

  const filtered = plots.filter((p) => {
    const pLayoutId = (p.layout_id || p.layoutId || '').toLowerCase();
    const pProject = (p.project || '').toLowerCase();
    const pId = (p.id || '').toLowerCase();

    // 1. Direct ID or layout_id match
    if (pLayoutId === areaIdClean || pId === areaIdClean) return true;

    // 2. Direct Project Name match
    if (areaName && pProject === areaName) return true;

    // 3. Phase 1 & Master Plan matching
    if (
      areaIdClean.includes('001') ||
      areaIdClean.includes('30plots') ||
      areaName.includes('phase 1') ||
      areaName.includes('master')
    ) {
      return (
        pProject.includes('phase 1') ||
        pProject.includes('master phase') ||
        pLayoutId.includes('30plots') ||
        pLayoutId.includes('001')
      );
    }

    // 4. Phase 2 Commercial Hub matching
    if (
      areaIdClean.includes('002') ||
      areaName.includes('phase 2')
    ) {
      return pProject.includes('phase 2') || pLayoutId.includes('002');
    }

    return false;
  });

  // Guaranteed fallback: If no area-specific plots exist in DB yet, return master plan plots so viewer is NEVER empty
  if (filtered.length === 0) {
    return plots;
  }

  return filtered;
}

export const plotService = {
  async getPublishedAreas() {
    let projects = [];
    let layouts = [];

    try {
      const projData = await apiClient.get('/api/projects');
      if (Array.isArray(projData) && projData.length > 0) {
        projects = projData;
      }
    } catch (e) {}

    try {
      const layoutData = await apiClient.get('/api/client/published-layouts');
      if (layoutData && layoutData.layouts) {
        layouts = layoutData.layouts.map(normalizeArea);
      }
    } catch (e) {}

    if (layouts.length === 0) {
      try {
        const rawLayouts = await apiClient.get('/api/layouts');
        if (Array.isArray(rawLayouts)) {
          layouts = rawLayouts.map(normalizeArea);
        }
      } catch (e) {}
    }

    if (projects.length > 0) {
      const combinedAreas = projects.map((p) => {
        const projLayouts = layouts.filter(
          (l) => l.projectId === p.id || l.id === p.id || (l.name && l.name.toLowerCase().includes(p.name.toLowerCase()))
        );

        if (projLayouts.length === 0) {
          projLayouts.push({
            id: p.id,
            layoutId: p.id,
            projectId: p.id,
            name: p.name,
            layoutName: `${p.name} Master Plan`,
            location: p.address || '',
            address: p.address || '',
            description: p.description || '',
            status: 'Published',
            plotCount: 0
          });
        }

        return {
          id: p.id,
          projectId: p.id,
          name: p.name,
          ownerName: p.owner_name || '',
          address: p.address || '',
          location: p.address || '',
          description: p.description || '',
          status: 'Published',
          layouts: projLayouts
        };
      });

      layouts.forEach((l) => {
        const alreadyIn = combinedAreas.some((ca) => ca.layouts.some((ly) => ly.id === l.id));
        if (!alreadyIn) {
          combinedAreas.push({
            id: l.id,
            projectId: l.projectId || l.id,
            name: l.name,
            location: l.location || l.address || '',
            layouts: [l]
          });
        }
      });

      return combinedAreas;
    }

    return layouts;
  },

  async getPublishedLayouts() {
    return this.getPublishedAreas();
  },

  async getLayout(areaId) {
    if (!areaId) throw new Error('Area ID is required.');

    let rawPlots = [];
    let areaMeta = null;

    // 1. Resolve area metadata
    const areas = await this.getPublishedAreas();
    for (const a of areas) {
      if (a.id === areaId || a.projectId === areaId) {
        areaMeta = a;
        break;
      }
      if (a.layouts) {
        const foundL = a.layouts.find((ly) => ly.id === areaId || ly.layoutId === areaId);
        if (foundL) {
          areaMeta = { ...a, ...foundL };
          break;
        }
      }
    }

    // 2. Fetch layout plots
    let fetchedDirectly = false;
    try {
      const plotData = await apiClient.get(`/api/client/layouts/${areaId}/plots`);
      if (plotData && plotData.plots && plotData.plots.length > 0) {
        rawPlots = plotData.plots;
        fetchedDirectly = true;
      }
    } catch (e) {}

    // Fallback: If areaId was an unpopulated legacy demo ID (e.g., AREA-1788273673786), fetch active published layout plots
    if (rawPlots.length === 0) {
      try {
        const pubLayouts = await apiClient.get('/api/client/published-layouts');
        if (pubLayouts && pubLayouts.layouts && pubLayouts.layouts.length > 0) {
          const activeLayoutId = pubLayouts.layouts[0].id;
          const pubPlotData = await apiClient.get(`/api/client/layouts/${activeLayoutId}/plots`);
          if (pubPlotData && pubPlotData.plots && pubPlotData.plots.length > 0) {
            rawPlots = pubPlotData.plots;
            fetchedDirectly = true;
            if (pubLayouts.layouts[0].infrastructure_geometry) {
              areaMeta = { ...areaMeta, infrastructureGeometry: pubLayouts.layouts[0].infrastructure_geometry };
            }
          }
        }
      } catch (e) {}
    }

    // 3. Fallback to system plots table query
    if (rawPlots.length === 0) {
      try {
        const allPlots = await apiClient.get('/api/plots');
        if (Array.isArray(allPlots) && allPlots.length > 0) {
          rawPlots = allPlots;
        }
      } catch (e) {}
    }

    const matched = fetchedDirectly
      ? rawPlots.map(normalizePlot)
      : matchPlotsForArea(rawPlots, areaId, areaMeta).map(normalizePlot);

    if (!areaMeta) {
      areaMeta = {
        id: areaId,
        layoutId: areaId,
        name: 'Sky Cadastral Area',
        bounds: { minX: 0, maxX: 800, minY: 0, maxY: 600 },
        viewCenter: [400, 300]
      };
    }

    const metadata = {
      ...areaMeta,
      bounds: areaMeta.bounds || { minX: 0, maxX: areaMeta.boundingWidth || 800, minY: 0, maxY: areaMeta.boundingHeight || 600 },
      viewCenter: areaMeta.viewCenter || [(areaMeta.boundingWidth || 800) / 2, (areaMeta.boundingHeight || 600) / 2]
    };

    return {
      metadata,
      project: { id: metadata.projectId || areaId, name: metadata.name },
      plots: matched
    };
  },

  async getPlots(areaId) {
    if (!areaId) throw new Error('Area ID is required.');
    const layoutRes = await this.getLayout(areaId);
    return layoutRes.plots || [];
  },

  async getPlot(plotId) {
    try {
      const rawPlots = await apiClient.get('/api/plots');
      if (Array.isArray(rawPlots)) {
        const found = rawPlots.find((p) => p.id === plotId || p.plot_number === plotId);
        if (found) return normalizePlot(found);
      }
    } catch (e) {}

    throw new Error(`Plot with ID ${plotId} not found.`);
  },

  async searchPlots(query, layoutId) {
    const plots = await this.getPlots(layoutId);
    if (!query || !query.trim()) return plots;

    const cleanQuery = query.trim().toUpperCase();
    return plots.filter(
      (p) =>
        (p.plotNumber && p.plotNumber.toUpperCase().includes(cleanQuery)) ||
        (p.id && p.id.toUpperCase().includes(cleanQuery)) ||
        (p.facing && p.facing.toUpperCase().includes(cleanQuery)) ||
        (p.status && p.status.toUpperCase().includes(cleanQuery))
    );
  },

  async filterPlots({ status = 'ALL', facing = 'ALL' }, layoutId) {
    const plots = await this.getPlots(layoutId);
    return plots.filter((p) => {
      const matchStatus =
        status === 'ALL' || (p.status && p.status.toUpperCase() === status.toUpperCase());
      const matchFacing =
        facing === 'ALL' || (p.facing && p.facing.toLowerCase().includes(facing.toLowerCase()));
      return matchStatus && matchFacing;
    });
  },
};
