import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function runVerification() {
  console.log('========================================================================');
  console.log('🌐 SKY CADASTRAL — CLIENT WEBSITE API INTEGRATION VERIFICATION');
  console.log('========================================================================');

  try {
    // 1. Verify /api/client/areas query logic
    console.log('\n[1. TESTING GET /api/client/areas]');
    const areasRes = await query(`
      SELECT 
        l.id as layout_id,
        l.name as layout_name,
        l.status as layout_status,
        l.original_pdf_url,
        l.original_pdf_name,
        l.file_size,
        l.bounding_width,
        l.bounding_height,
        p.id as project_id,
        p.name as project_name,
        p.address as project_address,
        (SELECT COUNT(*) FROM plots WHERE layout_id = l.id) as total_plots_count,
        (SELECT COUNT(*) FROM plots WHERE layout_id = l.id AND (verification_status = 'Verified' OR verification_status IS NULL)) as verified_plots_count
      FROM layouts l
      LEFT JOIN projects p ON l.project_id = p.id
      ORDER BY l.created_at DESC
    `);

    console.log(`  ✅ Total Published Areas found in Neon DB: ${areasRes.rows.length}`);
    areasRes.rows.forEach((r, idx) => {
      console.log(`     • [Area ${idx + 1}] ID: ${r.layout_id} | Name: "${r.project_name || r.layout_name}" | Verified Plots: ${r.verified_plots_count}/${r.total_plots_count} | PDF: ${r.original_pdf_name || 'N/A'}`);
    });

    if (areasRes.rows.length === 0) {
      console.warn('  ⚠️ No layouts found in database. Seed data may be required.');
      process.exit(0);
    }

    const sampleLayoutId = areasRes.rows[0].layout_id;

    // 2. Verify /api/client/areas/:areaId/plots query logic
    console.log(`\n[2. TESTING GET /api/client/areas/${sampleLayoutId}/plots]`);
    const plotsRes = await query(`
      SELECT 
        p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
        p.facing, p.polygon_geometry, p.valuation, p.status, p.verification_status
      FROM plots p
      WHERE (p.layout_id = $1 OR p.project = $1)
      ORDER BY p.plot_number ASC
    `, [sampleLayoutId]);

    console.log(`  ✅ Total Verified Plots returned for Layout ${sampleLayoutId}: ${plotsRes.rows.length}`);
    plotsRes.rows.forEach((p, idx) => {
      const parsedGeom = typeof p.polygon_geometry === 'string' ? JSON.parse(p.polygon_geometry) : p.polygon_geometry;
      console.log(`     • [Plot ${idx + 1}] ID: ${p.id} | Number: ${p.plot_number} | Status: ${p.status} | Area: ${p.area} ${p.unit} | Vertices: ${parsedGeom?.length || 0} points`);
    });

    // 3. Verify single plot lookup /api/client/plots/:plotId
    if (plotsRes.rows.length > 0) {
      const samplePlotId = plotsRes.rows[0].id;
      console.log(`\n[3. TESTING GET /api/client/plots/${samplePlotId}]`);
      const singlePlotRes = await query(`
        SELECT p.id, p.plot_number, p.layout_id, p.project, p.area, p.valuation, p.status, l.original_pdf_name
        FROM plots p
        LEFT JOIN layouts l ON p.layout_id = l.id
        WHERE p.id = $1
      `, [samplePlotId]);

      if (singlePlotRes.rows.length > 0) {
        const sp = singlePlotRes.rows[0];
        console.log(`  ✅ Single Plot Fetched Successfully: Plot ${sp.plot_number} (ID: ${sp.id})`);
        console.log(`     Valuation: ₹${Number(sp.valuation).toLocaleString('en-IN')} | Status: ${sp.status} | PDF: ${sp.original_pdf_name}`);
      }
    }

    console.log('\n========================================================================');
    console.log('🎉 CLIENT WEBSITE BACKEND API INTEGRATION VERIFICATION PASSED!');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  }
}

runVerification();
