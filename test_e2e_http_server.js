import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function runHttpE2ETests() {
  console.log('========================================================================');
  console.log('🌐 SKY CADASTRAL — COMPLETE HTTP API END-TO-END VERIFICATION');
  console.log('========================================================================');

  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  const testLayoutId = `E2E-LAYOUT-${Date.now()}`;
  const testProjectId = `E2E-PROJ-${Date.now()}`;
  const testProjectName = 'Prestige Horizon Cadastral Enclave';

  function assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
    console.log(`  ✅ PASS: ${message}`);
  }

  let serverProcess = null;

  try {
    // Check if server is running, or spawn it
    let serverRunning = false;
    try {
      const res = await fetch(`${BASE_URL}/health`).catch(() => null);
      if (res && res.ok) serverRunning = true;
    } catch (_) {}

    if (!serverRunning) {
      console.log(`Launching server on port ${PORT}...`);
      serverProcess = spawn('node', ['index.js'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      // Poll until server is ready
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const res = await fetch(`${BASE_URL}/health`);
          if (res.ok) {
            ready = true;
            console.log('Server is ready and accepting requests.');
            break;
          }
        } catch (_) {}
      }

      if (!ready) {
        throw new Error('Server failed to start within timeout.');
      }
    } else {
      console.log('Server is already running.');
    }

    // Pre-insert project for foreign key
    await query(
      `INSERT INTO projects (id, name, owner_name, address, description)
       VALUES ($1, $2, 'Prestige Surveyor', 'Horizon Road, Pune', 'E2E Cadastral Layout Area')
       ON CONFLICT (id) DO NOTHING`,
      [testProjectId, testProjectName]
    );

    // -----------------------------------------------------------------------
    // 1. TEST POST /api/cadastral/save-verified-layout (Partially Verified)
    // -----------------------------------------------------------------------
    console.log('\n[1. TESTING POST /api/cadastral/save-verified-layout (Partial)]');
    const partialPlots = [
      {
        plotNumber: 'P-1',
        officialAreaSqft: 1200,
        length: 40,
        width: 30,
        facing: 'North',
        facingRoadWidth: 40,
        polygonGeometry: [[0, 0], [40, 0], [40, 30], [0, 30]], // non-closed ring
        edgeDimensions: [{ edgeIndex: 0, calculatedLengthFt: 40 }],
        verificationStatus: 'Verified',
        valuation: 2400000,
        pricePerSqFt: 2000,
        status: 'Available'
      },
      {
        plotNumber: 'P-2',
        officialAreaSqft: 1500,
        length: 50,
        width: 30,
        facing: 'South',
        facingRoadWidth: 30,
        polygonGeometry: [[50, 0], [100, 0], [100, 30], [50, 30]],
        edgeDimensions: [{ edgeIndex: 0, calculatedLengthFt: 50 }],
        verificationStatus: 'Needs Verification',
        valuation: 3000000,
        pricePerSqFt: 2000,
        status: 'Available'
      }
    ];

    const postPartialRes = await fetch(`${BASE_URL}/cadastral/save-verified-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: testLayoutId,
        projectId: testProjectId,
        projectName: testProjectName,
        name: 'Prestige Horizon Phase 1 Plan',
        plots: partialPlots,
        infrastructureGeometry: { roads: [], openSpaces: [] }
      })
    });

    const postPartialData = await postPartialRes.json();
    assert(postPartialRes.status === 200, 'HTTP 200 OK received for save-verified-layout');
    assert(postPartialData.success === true, 'Response indicates success: true');
    assert(postPartialData.layout.status === 'Needs Verification', 'Layout status in DB is "Needs Verification"');
    assert(postPartialData.verification.isVerified === false, 'verification.isVerified is false');
    assert(postPartialData.verification.verificationOngoing === true, 'verification.verificationOngoing is true');
    assert(postPartialData.notice.show === true, 'notice.show is true');
    assert(postPartialData.notice.type === 'warning', 'notice.type is warning');
    assert(postPartialData.notice.message.includes('Cadastral verification is currently in progress'), 'Notice banner message contains professional ongoing verification wording');

    // -----------------------------------------------------------------------
    // 2. TEST GET /api/client/areas/:areaId (Ongoing)
    // -----------------------------------------------------------------------
    console.log('\n[2. TESTING GET /api/client/areas/:areaId (Ongoing)]');
    const getAreaRes1 = await fetch(`${BASE_URL}/client/areas/${testLayoutId}`);
    const getAreaData1 = await getAreaRes1.json();
    console.log('DEBUG getAreaData1.area:', getAreaData1.area);
    console.log('DEBUG testLayoutId:', testLayoutId);

    assert(getAreaRes1.status === 200, 'HTTP 200 OK received for GET /api/client/areas/:areaId');
    assert(getAreaData1.success === true, 'Response indicates success: true');
    assert(getAreaData1.area.id === testLayoutId, 'Area record matches layout ID');
    assert(getAreaData1.plots.length === 2, 'Returns complete vector structure with 2 plots');
    
    // Check closed polygon ring
    getAreaData1.plots.forEach(plot => {
      const geom = plot.polygonGeometry;
      assert(Array.isArray(geom) && geom.length >= 4, `Plot ${plot.plotNumber} has vector polygon`);
      const first = geom[0];
      const last = geom[geom.length - 1];
      assert(first[0] === last[0] && first[1] === last[1], `Plot ${plot.plotNumber} geometry is a closed polygon ring`);
    });

    assert(getAreaData1.isVerified === false, 'isVerified is false on client area');
    assert(getAreaData1.isOngoing === true, 'isOngoing is true on client area');
    assert(getAreaData1.verificationNotice === 'Cadastral verification is currently in progress for this area. Official demarcation, boundary survey, and land registry validation are underway. Final layout will be published once fully approved.', 'Ongoing verification notice banner exactly matches requirement');

    // -----------------------------------------------------------------------
    // 3. TEST POST /api/cadastral/save-verified-layout (100% Verified)
    // -----------------------------------------------------------------------
    console.log('\n[3. TESTING POST /api/cadastral/save-verified-layout (100% Verified)]');
    const fullyVerifiedPlots = partialPlots.map(p => ({
      ...p,
      verificationStatus: 'Verified'
    }));

    const postVerifiedRes = await fetch(`${BASE_URL}/cadastral/save-verified-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: testLayoutId,
        projectId: testProjectId,
        projectName: testProjectName,
        name: 'Prestige Horizon Phase 1 Plan',
        plots: fullyVerifiedPlots,
        infrastructureGeometry: { roads: [], openSpaces: [] }
      })
    });

    const postVerifiedData = await postVerifiedRes.json();
    assert(postVerifiedRes.status === 200, 'HTTP 200 OK received for fully verified layout');
    assert(postVerifiedData.layout.status === 'Verified', 'Layout status in DB updated to "Verified"');
    assert(postVerifiedData.verification.isVerified === true, 'verification.isVerified is true');
    assert(postVerifiedData.verification.verificationOngoing === false, 'verification.verificationOngoing is false');
    assert(postVerifiedData.notice.show === false, 'notice.show is false');
    assert(postVerifiedData.notice.type === 'success', 'notice.type is success');
    assert(postVerifiedData.notice.message === 'All plot boundary demarcations and legal cadastral records have been officially verified and published.', 'Verified notice message matches requirement');

    // -----------------------------------------------------------------------
    // 4. TEST GET /api/client/areas/:areaId (Verified)
    // -----------------------------------------------------------------------
    console.log('\n[4. TESTING GET /api/client/areas/:areaId (Verified)]');
    const getAreaRes2 = await fetch(`${BASE_URL}/client/areas/${testLayoutId}`);
    const getAreaData2 = await getAreaRes2.json();

    assert(getAreaData2.isVerified === true, 'isVerified is true');
    assert(getAreaData2.isOngoing === false, 'isOngoing is false');
    assert(getAreaData2.verificationNotice === 'All plot boundary demarcations and legal cadastral records have been officially verified and published.', 'Notice banner confirms official verification and publication');

    // -----------------------------------------------------------------------
    // 5. TEST Area Retrieval by project_id and project name
    // -----------------------------------------------------------------------
    console.log('\n[5. TESTING Matching by project_id and project name]');
    const getByProjIdRes = await fetch(`${BASE_URL}/client/areas/${testProjectId}`);
    const getByProjIdData = await getByProjIdRes.json();
    assert(getByProjIdRes.status === 200, 'Matched area by project_id');
    assert(getByProjIdData.area.id === testLayoutId, 'Returned correct layout for project_id');

    const getByProjNameRes = await fetch(`${BASE_URL}/client/areas/${encodeURIComponent(testProjectName)}`);
    const getByProjNameData = await getByProjNameRes.json();
    assert(getByProjNameRes.status === 200, 'Matched area by project name');
    assert(getByProjNameData.area.id === testLayoutId, 'Returned correct layout for project name');

    // -----------------------------------------------------------------------
    // 6. TEST Fallback for unuploaded project (Never 404)
    // -----------------------------------------------------------------------
    console.log('\n[6. TESTING Fallback for project without uploaded PDF (Never returns unhandled 404)]');
    const unuploadedAreaId = `UNUPLOADED-AREA-${Date.now()}`;
    const fallbackRes = await fetch(`${BASE_URL}/client/areas/${unuploadedAreaId}`);
    const fallbackData = await fallbackRes.json();

    assert(fallbackRes.status === 200, 'HTTP 200 OK instead of unhandled 404 for unuploaded area');
    assert(fallbackData.success === true, 'success: true on fallback');
    assert(fallbackData.area.status === 'Needs Verification', 'Fallback area status is Needs Verification');
    assert(fallbackData.isOngoing === true, 'Fallback area has isOngoing: true');
    assert(fallbackData.notice.message.includes('Cadastral verification is currently in progress'), 'Fallback area includes ongoing verification banner');

    // -----------------------------------------------------------------------
    // 7. TEST GET /api/client/areas/:areaId/plots
    // -----------------------------------------------------------------------
    console.log('\n[7. TESTING GET /api/client/areas/:areaId/plots]');
    const getPlotsRes = await fetch(`${BASE_URL}/client/areas/${testLayoutId}/plots`);
    const getPlotsData = await getPlotsRes.json();

    assert(getPlotsRes.status === 200, 'HTTP 200 OK for /api/client/areas/:areaId/plots');
    assert(getPlotsData.totalPlots === 2, 'Returned 2 plots');
    assert(getPlotsData.verification.isVerified === true, 'Plots endpoint returned isVerified: true');
    assert(getPlotsData.verificationNotice === 'All plot boundary demarcations and legal cadastral records have been officially verified and published.', 'Plots endpoint contains verified notice banner');
    
    // Check closed polygon
    getPlotsData.plots.forEach(plot => {
      const geom = plot.polygonGeometry;
      const first = geom[0];
      const last = geom[geom.length - 1];
      assert(first[0] === last[0] && first[1] === last[1], `Plot ${plot.plotNumber} has closed polygon geometry`);
    });

    // -----------------------------------------------------------------------
    // 8. TEST GET /api/client/layouts/:layoutId/plots
    // -----------------------------------------------------------------------
    console.log('\n[8. TESTING GET /api/client/layouts/:layoutId/plots]');
    const getLayoutPlotsRes = await fetch(`${BASE_URL}/client/layouts/${testLayoutId}/plots`);
    const getLayoutPlotsData = await getLayoutPlotsRes.json();

    assert(getLayoutPlotsRes.status === 200, 'HTTP 200 OK for /api/client/layouts/:layoutId/plots');
    assert(getLayoutPlotsData.totalPlots === 2, 'Returned 2 plots');
    assert(getLayoutPlotsData.verification.isVerified === true, 'Layout plots endpoint returned isVerified: true');

    // -----------------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------------
    await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);
    await query('DELETE FROM layouts WHERE id = $1', [testLayoutId]);
    await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    console.log('\n  🧹 Cleaned up temporary test project, layout, and plots.');

    console.log('\n========================================================================');
    console.log('🎉 ALL HTTP API END-TO-END TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================================');
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E HTTP Test Suite Error:', err);
    try {
      await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);
      await query('DELETE FROM layouts WHERE id = $1', [testLayoutId]);
      await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    } catch (_) {}
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
    process.exit(1);
  }
}

runHttpE2ETests();
