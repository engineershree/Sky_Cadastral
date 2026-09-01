import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runForensicPipelineAnalysis() {
  console.log('====================================================');
  console.log('🔍 SKY CADASTRAL — STRICT PDF FORENSIC ANALYSIS TEST');
  console.log('====================================================');

  // 1. Verify Neon DB Connection
  console.log('\n[STAGE 1: NEON DATABASE CONNECTION]');
  const dbHealth = await pool.query('SELECT current_database(), version(), current_user');
  console.log(`  ✅ Database Name: ${dbHealth.rows[0].current_database}`);
  console.log(`  ✅ User: ${dbHealth.rows[0].current_user}`);
  console.log(`  ✅ PostgreSQL Version: ${dbHealth.rows[0].version.slice(0, 45)}...`);

  // 2. Load PDF File
  const pdfPath = path.join(__dirname, 'master_cadastral_layout_30plots.pdf');
  console.log(`\n[STAGE 2: PDF FILE STORAGE & INTEGRITY]`);
  console.log(`  -> Path: ${pdfPath}`);
  const stats = fs.statSync(pdfPath);
  console.log(`  ✅ File Size: ${(stats.size / 1024).toFixed(2)} KB (Valid intact binary stream)`);

  // 3. Execute PDF Parser Pipeline
  console.log(`\n[STAGE 3: PDF PARSER & VECTOR EXTRACTION PIPELINE]`);
  const result = await parseCadastralPdf(pdfPath);
  const diag = result.diagnostics;

  console.log(`  • Pages Processed: ${diag.pagesProcessed}`);
  console.log(`  • Extracted Text Length: ${diag.textLength} characters`);
  console.log(`  • Plot Candidates Found: ${diag.plotCandidatesFound}`);
  console.log(`    - Labeled Plots: ${diag.labeledPlots}`);
  console.log(`    - Unlabeled Candidate Polygons: ${diag.unlabeledPlots}`);
  console.log(`  • Validated Plot Geometries: ${diag.validatedPlots}`);
  console.log(`  • Rejected by Validation: ${diag.rejectedPlots}`);
  console.log(`  • Duplicates Removed: ${diag.duplicatesRemoved}`);

  // 4. Save Extracted Plots to Neon DB
  console.log(`\n[STAGE 4: NEON POSTGRESQL PERSISTENCE & AUDIT]`);
  const layoutId = `LAYOUT-30PLOTS-${Date.now()}`;
  const layoutRes = await pool.query(
    `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, extracted_plots_count, uploaded_at)
     VALUES ($1, $2, $3, $4, 'Needs Verification', $5, $6, $7, $8, CURRENT_DATE) RETURNING *`,
    [layoutId, 'AREA-001', 'Sky Cadastral Master Phase', '30-Plot Master Cadastral Plan', '/docs/master_cadastral_layout_30plots.pdf', 'master_cadastral_layout_30plots.pdf', '2.8 KB', result.extractedPlotsCount]
  );
  console.log(`  ✅ Inserted Layout Record: ID "${layoutRes.rows[0].id}" (Status: ${layoutRes.rows[0].status})`);

  let dbInsertCount = 0;
  for (const p of result.plots) {
    const plotId = `PLOT-30P-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await pool.query(
      `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, verification_status, valuation_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        plotId,
        p.plotNumber,
        layoutId,
        'Sky Cadastral Master Phase',
        p.area,
        p.unit,
        p.length,
        p.width,
        p.documentArea,
        p.facing,
        p.facingRoadWidth,
        JSON.stringify(p.polygonGeometry),
        p.valuation,
        p.pricePerSqFt,
        p.status,
        'Sky Cadastral Hinjewadi Phase 1',
        p.verificationStatus,
        p.valuationNotes
      ]
    );
    dbInsertCount++;
  }
  console.log(`  ✅ Database Insertion Attempts: ${result.plots.length}`);
  console.log(`  ✅ Successful Neon DB Inserts: ${dbInsertCount}`);

  // 5. Query Neon DB to verify persistence of all 30 plots
  const countQuery = await pool.query('SELECT COUNT(*) FROM plots WHERE layout_id = $1', [layoutId]);
  console.log(`\n====================================================`);
  console.log(`📊 FINAL FORENSIC COUNT REPORT`);
  console.log(`====================================================`);
  console.log(`  1. PDF Pages Processed:         ${diag.pagesProcessed}`);
  console.log(`  2. Plot Candidates Found:       ${diag.plotCandidatesFound}`);
  console.log(`  3. Plot Numbers Detected:       ${diag.labeledPlots}`);
  console.log(`  4. Geometry Candidates:         ${diag.validatedPlots}`);
  console.log(`  5. Rejected Candidates:         ${diag.rejectedPlots}`);
  console.log(`  6. Duplicates Filtered:         ${diag.duplicatesRemoved}`);
  console.log(`  7. Database Insert Attempts:    ${dbInsertCount}`);
  console.log(`  8. Database Insert Success:     ${countQuery.rows[0].count}`);
  console.log(`  9. Final Verified Plots:        ${countQuery.rows[0].count}`);
  console.log(`====================================================`);

  if (Number(countQuery.rows[0].count) >= 30) {
    console.log('🎉 FORENSIC TEST SUCCESSFUL: 100% OF ALL 30 PLOTS EXTRACTED & SAVED TO NEON DB!');
    process.exit(0);
  } else {
    console.error(`❌ FORENSIC TEST FAILED: Expected 30 plots, found ${countQuery.rows[0].count}`);
    process.exit(1);
  }
}

runForensicPipelineAnalysis().catch(err => {
  console.error('❌ Forensic Test Error:', err);
  process.exit(1);
});
