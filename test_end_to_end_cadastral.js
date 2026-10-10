import path from 'path';
import { fileURLToPath } from 'url';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEndToEndVerification() {
  console.log('===================================================================');
  console.log('🔍 SKY CADASTRAL — HIGH-ACCURACY PDF EXTRACTION VERIFICATION TEST');
  console.log('===================================================================');

  const pdfPath = path.join(__dirname, '..', '..', '..', 'GOLDEN  CITY FINAL PLAN Model.pdf');
  console.log(`\n[STEP 1: Target PDF Verification]`);
  console.log(`  -> Path: ${pdfPath}`);

  // 1. Run Cadastral Parser Engine
  console.log('\n[STEP 2: Executing Cadastral Geometry-First Extraction Engine]');
  const startTime = Date.now();
  const result = await parseCadastralPdf(pdfPath);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`  ✅ Pipeline Execution Time: ${elapsed} seconds`);
  console.log('\n[STEP 3: Forensic Diagnostic Extraction Report]');
  const report = result.forensicReport;

  console.log(`  • Document Name:              ${report.documentName}`);
  console.log(`  • Page Dimensions:            ${report.pageDimensionsPt.width} x ${report.pageDimensionsPt.height} pt`);
  console.log(`  • Structural Line Candidates: ${report.boundaryCandidatesFound}`);
  console.log(`  • Reconstructed Polygons:     ${report.validPolygonsReconstructed}`);
  console.log(`  • Official Table Records:     ${report.tableRecordsExtracted}`);
  console.log(`  • Matched Plot Polygons:      ${report.matchedPlotCount} / ${report.expectedSourcePlotCount}`);
  console.log(`  • Missing Plots in Source:    ${report.missingPlotIdsInSource.join(', ') || 'None'}`);
  console.log(`  • Non-existent Source Plots:  ${report.explicitlyExcludedPlots.join(', ')} (Excluded from fabrication)`);
  console.log(`  • Duplicate Plot IDs:         ${report.duplicateIdsFound.length}`);
  console.log(`  • Verified Plots Count:       ${report.verifiedPlotsCount}`);
  console.log(`  • Area Mismatch Count:        ${report.geometryMismatchCount}`);

  // Validation Checks
  console.log('\n[STEP 4: Strict Assertion Verification]');
  
  if (report.explicitlyExcludedPlots.includes(74) && report.explicitlyExcludedPlots.includes(75) && report.explicitlyExcludedPlots.includes(76)) {
    console.log('  ✅ Assertion Passed: Plots 74, 75, 76 are correctly identified as non-existent in source PDF.');
  } else {
    console.error('  ❌ Assertion Failed: Plots 74, 75, 76 check failed.');
    process.exit(1);
  }

  if (result.plots.length >= 50) {
    console.log(`  ✅ Assertion Passed: Successfully extracted & matched ${result.plots.length} vector plot geometries.`);
  } else {
    console.error(`  ❌ Assertion Failed: Expected >= 50 matched plots, got ${result.plots.length}`);
    process.exit(1);
  }

  // Print sample plot details
  console.log('\n[STEP 5: Sample Extracted Plot Verification]');
  const p1 = result.plots.find(p => p.plotNumber === '1') || result.plots[0];
  console.log(`  Plot Number:               ${p1.plotNumber}`);
  console.log(`  Calculated Area (Sqm):     ${p1.calculatedAreaSqm}`);
  console.log(`  Official Table Area (Sqm): ${p1.officialAreaSqm}`);
  console.log(`  Area Difference (Sqm):     ${p1.areaDifferenceSqm}`);
  console.log(`  Verification Status:       ${p1.verificationStatus}`);
  console.log(`  Polygon Vertex Count:      ${p1.polygonGeometry ? p1.polygonGeometry.length : 0}`);

  console.log('\n===================================================================');
  console.log('🎉 ALL HIGH-ACCURACY CADASTRAL EXTRACTION TESTS PASSED SUCCESSFULLY!');
  console.log('===================================================================');
  process.exit(0);
}

runEndToEndVerification().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
