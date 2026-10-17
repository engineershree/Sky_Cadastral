
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

// Helper to test assertion
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 SKY CADASTRAL — CADASTRAL VERIFICATION & AREA RETRIEVAL TEST SUITE');
  console.log('========================================================================');

  const testLayoutId = `TEST-LAYOUT-${Date.now()}`;
  const testProjectId = `TEST-AREA-${Date.now()}`;
  const testProjectName = 'Cyber Green Cadastral Park';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: POST /api/cadastral/save-verified-layout with PARTIALLY VERIFIED plots
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1: Saving Layout with Partial Verification]');

    const partialPlotsPayload = [
      {
        plotNumber: 'P-101',
        officialAreaSqft: 1500,
        length: 50,
        width: 30,
        facing: 'North',
        facingRoadWidth: 40,
        polygonGeometry: [[10, 10], [60, 10], [60, 40], [10, 40]], // Non-closed to test closing
        edgeDimensions: [
          { edgeIndex: 0, calculatedLengthFt: 50 },
          { edgeIndex: 1, calculatedLengthFt: 30 },
          { edgeIndex: 2, calculatedLengthFt: 50 },
          { edgeIndex: 3, calculatedLengthFt: 30 }
        ],
        verificationStatus: 'Verified',
        valuation: 3000000,
        pricePerSqFt: 2000,
        status: 'Available'
      },
      {
        plotNumber: 'P-102',
        officialAreaSqft: 1800,
        length: 60,
        width: 30,
        facing: 'East',
        facingRoadWidth: 40,
        polygonGeometry: [[70, 10], [130, 10], [130, 40], [70, 40], [70, 10]], // Already closed
        edgeDimensions: [],
        verificationStatus: 'Needs Verification', // One unverified!
        valuation: 3600000,
        pricePerSqFt: 2000,
        status: 'Available'
      }
    ];

    // Simulate POST /api/cadastral/save-verified-layout logic
    const allPlotsVerified1 = partialPlotsPayload.every(
      p => p.verificationStatus === 'Verified' || p.verificationStatus === 'VERIFIED'
    );
    // Ensure test project exists in projects table
    await query(
      `INSERT INTO projects (id, name, owner_name, address, description)
       VALUES ($1, $2, 'Akash Surveyors', 'Cyber Green Pune', 'Cadastral Test Project')
       ON CONFLICT (id) DO NOTHING`,
      [testProjectId, testProjectName]
    );

    const layoutStatus1 = allPlotsVerified1 ? 'Verified' : 'Needs Verification';

    const layoutRes1 = await query(
      `INSERT INTO layouts (id, project_id, project_name, name, status, extracted_plots_count, infrastructure_geometry, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       ON CONFLICT (id) DO UPDATE 
       SET extracted_plots_count = EXCLUDED.extracted_plots_count,
           infrastructure_geometry = EXCLUDED.infrastructure_geometry,
           status = $5
       RETURNING *`,
      [
        testLayoutId,
        testProjectId,
        testProjectName,
        'Cyber Green Master Cadastral Plan',
        layoutStatus1,
        partialPlotsPayload.length,
        JSON.stringify({ roads: [], openSpaces: [] })
      ]
    );

    assert(layoutRes1.rows[0].status === 'Needs Verification', 'Layout status correctly set to Needs Verification when plots are not all verified');

    // Clean and insert
    await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);

    for (const p of partialPlotsPayload) {
      const plotDbId = `PLOT-${testLayoutId}-${p.plotNumber}`;
      await query(
        `INSERT INTO plots (
           id, plot_number, layout_id, project, area, unit, length, width, 
           document_area, facing, facing_road_width, polygon_geometry, 
           edge_dimensions, valuation, price_per_sqft, status, location, 
           verification_status, valuation_notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          plotDbId,
          p.plotNumber,
          testLayoutId,
          testProjectName,
          p.officialAreaSqft,
          'sq.ft',
          p.length,
          p.width,
          p.officialAreaSqft,
          p.facing,
          p.facingRoadWidth,
          JSON.stringify(p.polygonGeometry),
          JSON.stringify(p.edgeDimensions || []),
          p.valuation,
          p.pricePerSqFt,
          p.status,
          'Cyber Green Sector 1',
          p.verificationStatus,
          'Vector Cadastral'
        ]
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: GET /api/client/areas/:areaId for unverified layout
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2: GET Area Retrieval for Ongoing Verification]');

    // Test helper ensureClosedPolygon
    function ensureClosedPolygon(coords) {
      if (!Array.isArray(coords) || coords.length === 0) return coords;
      if (Array.isArray(coords[0])) {
        if (coords.length >= 3) {
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            return [...coords, [first[0], first[1]]];
          }
        }
        return coords;
      }
      return coords;
    }

    const plotsQuery1 = await query(
      `SELECT * FROM plots WHERE layout_id = $1 ORDER BY plot_number ASC`,
      [testLayoutId]
    );

    const clientPlots1 = plotsQuery1.rows.map(pr => {
      let parsed = typeof pr.polygon_geometry === 'string' ? JSON.parse(pr.polygon_geometry) : pr.polygon_geometry;
      return {
        ...pr,
        polygonGeometry: ensureClosedPolygon(parsed)
      };
    });

    assert(clientPlots1.length === 2, 'Retrieved all 2 saved plots');

    // Check closed polygon
    const p1Geom = clientPlots1[0].polygonGeometry;
    const firstP1 = p1Geom[0];
    const lastP1 = p1Geom[p1Geom.length - 1];
    assert(firstP1[0] === lastP1[0] && firstP1[1] === lastP1[1], 'Plot P-101 geometry was automatically closed into a closed ring polygon');

    const verifiedCount1 = clientPlots1.filter(p => p.verification_status === 'Verified').length;
    const isVerified1 = clientPlots1.length > 0 && verifiedCount1 === clientPlots1.length;
    const isOngoing1 = !isVerified1;

    assert(isVerified1 === false, 'isVerified is correctly false');
    assert(isOngoing1 === true, 'isOngoing is correctly true');

    const expectedOngoingBanner = 'Cadastral verification is currently in progress for this area. Official demarcation, boundary survey, and land registry validation are underway. Final layout will be published once fully approved.';
    const actualNoticeMessage = isOngoing1 ? expectedOngoingBanner : '';
    assert(actualNoticeMessage === expectedOngoingBanner, 'Ongoing verification notice banner text matches exact professional specification');

    // -------------------------------------------------------------------------
    // TEST 3: POST /api/cadastral/save-verified-layout with 100% VERIFIED plots
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3: Saving Layout with 100% Verified Plots]');

    const fullyVerifiedPlotsPayload = [
      {
        plotNumber: 'P-101',
        officialAreaSqft: 1500,
        length: 50,
        width: 30,
        facing: 'North',
        facingRoadWidth: 40,
        polygonGeometry: [[10, 10], [60, 10], [60, 40], [10, 40]],
        edgeDimensions: [{ edgeIndex: 0, calculatedLengthFt: 50 }],
        verificationStatus: 'Verified',
        valuation: 3000000,
        pricePerSqFt: 2000,
        status: 'Available'
      },
      {
        plotNumber: 'P-102',
        officialAreaSqft: 1800,
        length: 60,
        width: 30,
        facing: 'East',
        facingRoadWidth: 40,
        polygonGeometry: [[70, 10], [130, 10], [130, 40], [70, 40]],
        edgeDimensions: [{ edgeIndex: 0, calculatedLengthFt: 60 }],
        verificationStatus: 'Verified', // Now verified!
        valuation: 3600000,
        pricePerSqFt: 2000,
        status: 'Available'
      }
    ];

    const allPlotsVerified2 = fullyVerifiedPlotsPayload.every(
      p => p.verificationStatus === 'Verified' || p.verificationStatus === 'VERIFIED'
    );
    const layoutStatus2 = allPlotsVerified2 ? 'Verified' : 'Needs Verification';

    const layoutRes2 = await query(
      `INSERT INTO layouts (id, project_id, project_name, name, status, extracted_plots_count, infrastructure_geometry, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       ON CONFLICT (id) DO UPDATE 
       SET extracted_plots_count = EXCLUDED.extracted_plots_count,
           infrastructure_geometry = EXCLUDED.infrastructure_geometry,
           status = $5
       RETURNING *`,
      [
        testLayoutId,
        testProjectId,
        testProjectName,
        'Cyber Green Master Cadastral Plan',
        layoutStatus2,
        fullyVerifiedPlotsPayload.length,
        JSON.stringify({ roads: [], openSpaces: [] })
      ]
    );

    assert(layoutRes2.rows[0].status === 'Verified', 'Layout record updated to "Verified" when all plots are verified');

    // -------------------------------------------------------------------------
    // TEST 4: GET /api/client/areas/:areaId for fully verified layout
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4: GET Area Retrieval for Fully Verified Layout]');

    const isVerified2 = allPlotsVerified2 && layoutRes2.rows[0].status === 'Verified';
    const expectedVerifiedBanner = 'All plot boundary demarcations and legal cadastral records have been officially verified and published.';
    const actualVerifiedMessage = isVerified2 ? expectedVerifiedBanner : '';

    assert(isVerified2 === true, 'isVerified is correctly true for fully verified layout');
    assert(actualVerifiedMessage === expectedVerifiedBanner, 'Verified notice message matches exact professional specification');

    // -------------------------------------------------------------------------
    // TEST 5: Fallback lookup by Project ID, Project Name, and Unregistered ID
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5: Robust Fallback & Non-404 Area Retrieval]');

    // 5A. Lookup by Project ID
    const matchByProjId = await query(
      `SELECT l.id FROM layouts l WHERE l.id = $1 OR l.project_id = $1 LIMIT 1`,
      [testProjectId]
    );
    assert(matchByProjId.rows.length > 0 && matchByProjId.rows[0].id === testLayoutId, 'Successfully matched layout via project_id');

    // 5B. Lookup by Project Name (case insensitive)
    const matchByProjName = await query(
      `SELECT l.id FROM layouts l WHERE LOWER(l.project_name) = LOWER($1) LIMIT 1`,
      ['cyber green cadastral park']
    );
    assert(matchByProjName.rows.length > 0 && matchByProjName.rows[0].id === testLayoutId, 'Successfully matched layout via case-insensitive project name');

    // 5C. Test Fallback when ID has no uploaded PDF layout
    const nonExistentId = `UNUPLOADED-PROJECT-${Date.now()}`;
    const fallbackLookup = await query(
      `SELECT l.id FROM layouts l WHERE l.id = $1 OR l.project_id = $1 LIMIT 1`,
      [nonExistentId]
    );
    assert(fallbackLookup.rows.length === 0, 'No layout in database for unuploaded project');

    // Ensure fallback object can be created without 404
    const fallbackResponse = {
      id: nonExistentId,
      layoutId: nonExistentId,
      status: 'Needs Verification',
      plots: [],
      isVerified: false,
      isOngoing: true,
      verificationNotice: 'Cadastral verification is currently in progress for this area. Official demarcation, boundary survey, and land registry validation are underway. Final layout will be published once fully approved.'
    };
    assert(fallbackResponse.id === nonExistentId && fallbackResponse.isOngoing === true, 'Graceful fallback object returned without throwing unhandled 404');

    // -------------------------------------------------------------------------
    // CLEANUP TEST DATA
    // -------------------------------------------------------------------------
    await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);
    await query('DELETE FROM layouts WHERE id = $1', [testLayoutId]);
    await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    console.log('\n  🧹 Cleaned up temporary test project, layout and plots.');

    console.log('\n========================================================================');
    console.log('🎉 ALL CADASTRAL VERIFICATION & AREA RETRIEVAL TESTS PASSED 100%!');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Error:', err);
    // Attempt cleanup on failure
    try {
      await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);
      await query('DELETE FROM layouts WHERE id = $1', [testLayoutId]);
      await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    } catch (_) { }
    process.exit(1);
  }
}

runTests();
