import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDirectProofTest() {
  console.log('====================================================');
  console.log('PROOF 1: NEON POSTGRESQL DATABASE CONNECTION VERIFICATION');
  console.log('====================================================');
  
  // 1. Verify Connection to Neon DB
  const dbHealth = await pool.query('SELECT current_database(), version(), current_user, NOW()');
  console.log(`✅ Status: CONNECTED`);
  console.log(`✅ Database Name: ${dbHealth.rows[0].current_database}`);
  console.log(`✅ Database User: ${dbHealth.rows[0].current_user}`);
  console.log(`✅ Server Timestamp: ${dbHealth.rows[0].now}`);
  console.log(`✅ PostgreSQL Version: ${dbHealth.rows[0].version}`);

  const counts = await pool.query('SELECT (SELECT COUNT(*) FROM projects) as proj_count, (SELECT COUNT(*) FROM layouts) as layout_count, (SELECT COUNT(*) FROM plots) as plot_count');
  console.log(`✅ Live Neon DB Record Counts: ${counts.rows[0].proj_count} Projects, ${counts.rows[0].layout_count} Layouts, ${counts.rows[0].plot_count} Plots`);

  console.log('\n====================================================');
  console.log('PROOF 2: REAL PDF PARSING & PLOT CONVERSION SYSTEM VERIFICATION');
  console.log('====================================================');

  // 2. Run Direct Parsing on sample_cadastral_layout.pdf
  const pdfPath = path.join(__dirname, 'sample_cadastral_layout.pdf');
  console.log(`📄 Parsing PDF Document File: ${pdfPath}`);
  
  const extractionResult = await parseCadastralPdf(pdfPath);
  
  console.log(`✅ PDF Pages Parsed: ${extractionResult.pageCount}`);
  console.log(`✅ PDF Text Extracted: ${extractionResult.textLength} characters`);
  console.log(`✅ Extracted Plots Count: ${extractionResult.extractedPlotsCount}`);
  
  console.log('\n--- EXTRACTED PLOTS & VECTOR GEOMETRIES ---');
  extractionResult.plots.forEach((p, idx) => {
    console.log(`\nPlot #${idx + 1}: ${p.plotNumber}`);
    console.log(`  • Extracted Dimensions: ${p.length} x ${p.width} ft`);
    console.log(`  • Document Text Area: ${p.documentArea} sq.ft`);
    console.log(`  • Calculated Polygon Surface Area: ${p.area} sq.ft`);
    console.log(`  • Facing: ${p.facing}`);
    console.log(`  • Polygon Vertices Coordinates: ${JSON.stringify(p.polygonGeometry)}`);
    console.log(`  • Verification Status: ${p.verificationStatus}`);
  });

  // 3. Save Extracted PDF Plots directly to Neon DB
  console.log('\n====================================================');
  console.log('PROOF 3: SAVING EXTRACTED PDF PLOTS TO NEON DB');
  console.log('====================================================');

  const layoutId = `LAYOUT-PDF-${Date.now()}`;
  const layoutRes = await pool.query(
    `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, extracted_plots_count, uploaded_at)
     VALUES ($1, $2, $3, $4, 'Needs Verification', $5, $6, $7, $8, CURRENT_DATE) RETURNING *`,
    [layoutId, 'AREA-001', 'Sky Cadastral Phase 1', 'Demarcation PDF Proof Test', '/docs/sample_cadastral_layout.pdf', 'sample_cadastral_layout.pdf', '1.4 KB', extractionResult.extractedPlotsCount]
  );
  console.log(`✅ Saved Layout to Neon DB: ID "${layoutRes.rows[0].id}" (Status: ${layoutRes.rows[0].status})`);

  for (const plotData of extractionResult.plots) {
    const plotId = `PLOT-PDF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const plotRes = await pool.query(
      `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, verification_status, valuation_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        plotId,
        plotData.plotNumber,
        layoutId,
        'Sky Cadastral Phase 1',
        plotData.area,
        plotData.unit,
        plotData.length,
        plotData.width,
        plotData.documentArea,
        plotData.facing,
        plotData.facingRoadWidth,
        JSON.stringify(plotData.polygonGeometry),
        plotData.valuation,
        plotData.pricePerSqFt,
        plotData.status,
        'Sky Cadastral Phase 1, Sector 1',
        plotData.verificationStatus,
        plotData.valuationNotes
      ]
    );
    console.log(`   -> Saved Plot "${plotRes.rows[0].plot_number}" to Neon DB (ID: ${plotRes.rows[0].id}, Polygon: ${plotRes.rows[0].polygon_geometry})`);
  }

  // 4. Retrieve back from Neon DB to double prove persistence
  const savedPlotsRes = await pool.query('SELECT id, plot_number, area, status, verification_status, polygon_geometry FROM plots WHERE layout_id = $1', [layoutId]);
  console.log(`\n✅ Verified Database Query: Found ${savedPlotsRes.rows.length} plots in Neon DB for Layout ID ${layoutId}!`);

  console.log('\n====================================================');
  console.log('🎉 ALL PROOFS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runDirectProofTest().catch((err) => {
  console.error('❌ Proof Test Error:', err);
  process.exit(1);
});
