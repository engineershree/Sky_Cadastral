import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUnitTests() {
  console.log('========================================================================');
  console.log('🧪 SKY CADASTRAL — LAYOUT & PLOT DETAILS FETCHING UNIT TEST SUITE');
  console.log('========================================================================\n');

  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ PASS (${passedTests}/${totalTests}): ${message}`);
  }

  // 1. Ensure server is running
  let serverProcess = null;
  try {
    const health = await fetch(`${BASE_URL}/health`).catch(() => null);
    if (!health || !health.ok) {
      console.log('  -> Launching local backend server for tests...');
      serverProcess = spawn('node', ['index.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'inherit'
      });
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const res = await fetch(`${BASE_URL}/health`);
          if (res.ok) {
            ready = true;
            console.log('  -> Backend server is live and accepting HTTP connections.\n');
            break;
          }
        } catch (_) {}
      }
      if (!ready) {
        throw new Error('Server failed to start within timeout.');
      }
    } else {
      console.log('  -> Backend server is already running.\n');
    }
  } catch (err) {
    console.error('Failed to start test server:', err);
    throw err;
  }

  try {
    // SUITE 1: Layouts Listing & Single Layout Fetching
    console.log('[SUITE 1: Layout Listing & Single Layout REST Endpoints]');
    const layoutsRes = await fetch(`${BASE_URL}/layouts`);
    assert(layoutsRes.status === 200, 'GET /api/layouts returns HTTP 200');
    const layoutsList = await layoutsRes.json();
    assert(Array.isArray(layoutsList) && layoutsList.length > 0, 'GET /api/layouts returns array of layout plans');
    
    // Pick Golden City layout or first layout
    const goldenCityLayout = layoutsList.find(l => l.name && l.name.includes('Golden City')) || layoutsList[0];
    const targetLayoutId = goldenCityLayout.id;
    console.log(`  ℹ️ Selected Target Layout: "${goldenCityLayout.name}" (ID: ${targetLayoutId})`);

    // Test GET /api/layouts/:id
    const singleLayoutRes = await fetch(`${BASE_URL}/layouts/${targetLayoutId}`);
    assert(singleLayoutRes.status === 200, `GET /api/layouts/${targetLayoutId} returns HTTP 200`);
    const singleLayoutData = await singleLayoutRes.json();
    assert(singleLayoutData.success === true, 'Single layout response has success: true');
    assert(singleLayoutData.layout.id === targetLayoutId, 'Single layout matches requested ID');
    assert(typeof singleLayoutData.layout.plot_count !== 'undefined', 'Single layout includes plot_count');

    // Test non-existent layout ID
    const notFoundLayoutRes = await fetch(`${BASE_URL}/layouts/LAYOUT-NONEXISTENT-9999`);
    assert(notFoundLayoutRes.status === 404, 'GET /api/layouts/:id returns 404 for non-existent ID');

    // SUITE 2: Strict Layout Plot Isolation in GET /api/plots
    console.log('\n[SUITE 2: Strict Layout Plot Isolation in GET /api/plots]');
    const plotsForLayoutRes = await fetch(`${BASE_URL}/plots?layoutId=${targetLayoutId}`);
    assert(plotsForLayoutRes.status === 200, 'GET /api/plots?layoutId= returns HTTP 200');
    const plotsForLayout = await plotsForLayoutRes.json();
    assert(Array.isArray(plotsForLayout) && plotsForLayout.length > 0, 'Returns non-empty array of plots for layout');
    
    // Ensure 100% of returned plots belong strictly to targetLayoutId
    const foreignPlotsInLayout = plotsForLayout.filter(p => p.layoutId !== targetLayoutId);
    assert(foreignPlotsInLayout.length === 0, `All ${plotsForLayout.length} plots strictly belong to ${targetLayoutId} (0 cross-layout plots)`);

    // SUITE 3: Area Fetching & Zero Cross-Layout Plot Overlap (GET /api/client/areas/:areaId)
    console.log('\n[SUITE 3: Area Fetching & Cross-Layout Overlap Prevention]');
    const areaId = goldenCityLayout.project_id || 'AREA-001';
    const areaRes = await fetch(`${BASE_URL}/client/areas/${areaId}`);
    assert(areaRes.status === 200, `GET /api/client/areas/${areaId} returns HTTP 200`);
    const areaData = await areaRes.json();
    assert(areaData.success === true, 'Area response has success: true');
    assert(Array.isArray(areaData.plots) && areaData.plots.length > 0, 'Area response contains plots array');
    assert(Array.isArray(areaData.availableLayouts), 'Area response contains availableLayouts list');

    // CRITICAL: Ensure plots returned for this area are isolated to a single active layout!
    const distinctLayoutIdsInArea = [...new Set(areaData.plots.map(p => p.layoutId))];
    assert(
      distinctLayoutIdsInArea.length === 1,
      `Plots returned for area "${areaId}" belong to exactly ONE active layout (${distinctLayoutIdsInArea[0]}), preventing polygon stacking!`
    );

    // Verify polygon closure on all plots
    const allPolygonsClosed = areaData.plots.every(p => {
      const geom = p.polygonGeometry || p.coordinates;
      if (!Array.isArray(geom) || geom.length < 3) return false;
      const first = geom[0];
      const last = geom[geom.length - 1];
      return Math.abs(first[0] - last[0]) < 1e-3 && Math.abs(first[1] - last[1]) < 1e-3;
    });
    assert(allPolygonsClosed, 'All plot polygons in area response are mathematically closed rings');

    // SUITE 4: Explicit Layout Query Parameter (GET /api/client/areas/:areaId?layoutId=XYZ)
    console.log('\n[SUITE 4: Explicit Layout Selection via Query Param]');
    const explicitLayoutRes = await fetch(`${BASE_URL}/client/areas/${areaId}?layoutId=${targetLayoutId}`);
    assert(explicitLayoutRes.status === 200, 'GET /api/client/areas/:areaId?layoutId= returns HTTP 200');
    const explicitLayoutData = await explicitLayoutRes.json();
    assert(explicitLayoutData.area.layoutId === targetLayoutId, `Explicit layoutId matched target ${targetLayoutId}`);
    const distinctInExplicit = [...new Set(explicitLayoutData.plots.map(p => p.layoutId))];
    assert(distinctInExplicit.length === 1 && distinctInExplicit[0] === targetLayoutId, `All plots match explicit layoutId ${targetLayoutId}`);

    // SUITE 5: Client Layout Plots Route (GET /api/client/layouts/:layoutId/plots)
    console.log('\n[SUITE 5: Client Layout Plots Route (GET /api/client/layouts/:layoutId/plots)]');
    const clientLayoutPlotsRes = await fetch(`${BASE_URL}/client/layouts/${targetLayoutId}/plots`);
    assert(clientLayoutPlotsRes.status === 200, 'GET /api/client/layouts/:layoutId/plots returns HTTP 200');
    const clientLayoutPlotsData = await clientLayoutPlotsRes.json();
    assert(clientLayoutPlotsData.success === true, 'Response success: true');
    assert(clientLayoutPlotsData.layoutId === targetLayoutId, 'layoutId matches target');
    assert(clientLayoutPlotsData.plots.length === plotsForLayout.length, `Plot count exactly matches (${plotsForLayout.length} plots)`);
    const foreignPlotsInClientRoute = clientLayoutPlotsData.plots.filter(p => p.layoutId !== targetLayoutId);
    assert(foreignPlotsInClientRoute.length === 0, 'Zero foreign plots returned');

    // SUITE 6: Single Plot Details with Disambiguation (GET /api/client/plots/:plotId)
    console.log('\n[SUITE 6: Single Plot Details & Disambiguation]');
    const testPlot = plotsForLayout[0];
    const singlePlotRes = await fetch(`${BASE_URL}/client/plots/${testPlot.id}`);
    assert(singlePlotRes.status === 200, `GET /api/client/plots/${testPlot.id} returns HTTP 200`);
    const singlePlotData = await singlePlotRes.json();
    assert(singlePlotData.success === true, 'Single plot response has success: true');
    assert(singlePlotData.plot.id === testPlot.id, 'Plot ID matches requested ID');
    assert(singlePlotData.plot.plotNumber === testPlot.plotNumber, 'Plot number matches');
    assert(Array.isArray(singlePlotData.plot.polygonGeometry), 'Plot geometry is returned as array');

    // Test disambiguation with plot number and layoutId
    const plotByNumberRes = await fetch(`${BASE_URL}/client/plots/${testPlot.plotNumber}?layoutId=${targetLayoutId}`);
    assert(plotByNumberRes.status === 200, `GET /api/client/plots/${testPlot.plotNumber}?layoutId= returns HTTP 200`);
    const plotByNumberData = await plotByNumberRes.json();
    assert(plotByNumberData.plot.layoutId === targetLayoutId, 'Disambiguated plot matches requested layoutId');

    console.log('\n========================================================================');
    console.log(`🎉 ALL UNIT TESTS PASSED: ${passedTests}/${totalTests} (100%)`);
    console.log('========================================================================');
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runUnitTests().catch(err => {
  console.error('Unit tests failed:', err);
  process.exit(1);
});
