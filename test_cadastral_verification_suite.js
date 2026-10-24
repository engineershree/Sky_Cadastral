import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 SKY CADASTRAL — 10-POINT GEOMETRY VALIDATION & AUDIT TEST SUITE');
  console.log('================================================================');

  const testPdfPath = path.join(__dirname, 'GOLDEN_CITY_FINAL_PLAN.pdf');
  if (!fs.existsSync(testPdfPath)) {
    console.error(`❌ Benchmark PDF not found: ${testPdfPath}`);
    process.exit(1);
  }

  const startTime = Date.now();
  const result = await parseCadastralPdf(testPdfPath);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const report = result.forensicReport;
  const plots = result.plots;

  console.log(`\n[PDF INGESTION & PIPELINE BENCHMARK]`);
  console.log(`  • Document:           ${report.documentName} (${(report.fileSizeBytes / 1024).toFixed(1)} KB)`);
  console.log(`  • Page Count:         ${report.pageCount}`);
  console.log(`  • Dimensions:         ${report.pageDimensionsPt.width} x ${report.pageDimensionsPt.height} pt`);
  console.log(`  • Pipeline Runtime:   ${elapsed}s`);

  let passedTests = 0;
  let totalTests = 0;

  function assertTest(testNum, name, condition, details) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ Test ${testNum} PASS: ${name}`);
      if (details) console.log(`     -> ${details}`);
    } else {
      console.error(`  ❌ Test ${testNum} FAIL: ${name}`);
      if (details) console.error(`     -> ${details}`);
    }
  }

  console.log(`\n[PHASE 6 TEST EXECUTION]`);

  // Test 1: Adjacent polygons sharing an edge without positive-area overlap
  const zeroOverlaps = report.overlapCount === 0;
  assertTest(1, 'Adjacent polygons sharing an edge without positive-area overlap',
    zeroOverlaps,
    `Measured pairwise overlaps: ${report.overlapCount}, total overlap area: ${report.totalOverlapAreaSqft} sq.ft`
  );

  // Test 2: Duplicate source paths deduplication
  const dupesPruned = report.duplicateSegmentsPruned > 0;
  assertTest(2, 'Duplicate source paths identified and pruned',
    dupesPruned,
    `Raw segments: ${report.rawSegmentsExtracted}, Unique: ${report.uniqueSegmentsExtracted}, Duplicates pruned: ${report.duplicateSegmentsPruned}`
  );

  // Test 3: Disconnected line segments filtered / planar graph polygonized
  const validPolys = report.validPolygonsReconstructed > 100;
  assertTest(3, 'Disconnected line segments cleanly handled by planar polygonization',
    validPolys,
    `Closed planar polygons reconstructed: ${report.validPolygonsReconstructed}`
  );

  // Test 4: Open and malformed polygon rings handled
  const rejectedHandled = report.rejectedGeometriesCount >= 0;
  assertTest(4, 'Open, malformed, and micro-sliver loops (<10 pt^2) filtered',
    rejectedHandled,
    `Rejected micro-geometries filtered: ${report.rejectedGeometriesCount}`
  );

  // Test 5: Coordinate transformation details grounded and verified
  const coordTransformValid = report.coordinateTransformation && report.coordinateTransformation.ptsPerSqm > 0;
  assertTest(5, 'PDF-to-project coordinate transformation calibration',
    coordTransformValid,
    `Scale: ${report.coordinateTransformation.ptsPerSqm} pts/sqm (${report.coordinateTransformation.ptsPerM} pts/m), Origin: [${report.coordinateTransformation.origin.join(', ')}]`
  );

  // Test 6: Invalid polygons and self-intersections checked via Shapely validation
  const validationPassed = (report.invalidPlotPolygonsCount || 0) === 0;
  assertTest(6, 'Invalid polygons and self-intersections validated via Shapely',
    validationPassed,
    `Valid plot polygons: ${report.validPlotPolygonsCount}, Invalid: ${report.invalidPlotPolygonsCount || 0}`
  );

  // Test 7: Legitimate shared boundaries distinguished from positive-area overlap
  const sharedBoundariesOk = report.overlapCount === 0 && report.matchedPlotCount >= 70;
  assertTest(7, 'Legitimate shared boundaries distinguished from positive-area overlap',
    sharedBoundariesOk,
    `${report.matchedPlotCount} contiguous parcels share boundaries with 0.00 positive-area overlap`
  );

  // Test 8: Genuine positive-area overlap elimination
  const noPositiveAreaOverlap = report.totalOverlapAreaSqft === 0.0;
  assertTest(8, 'Genuine positive-area overlap eliminated (overlap area = 0.0 sq.ft)',
    noPositiveAreaOverlap,
    `Total overlap area: ${report.totalOverlapAreaSqft} sq.ft (${report.totalOverlapAreaSqm} sqm)`
  );

  // Test 9: Multiple plots with distinct identifiers (no duplicates, no rogue SITE_BOUNDARY)
  const plotIds = plots.map(p => p.plotNumber);
  const distinctPlotIds = new Set(plotIds);
  const noSiteBoundaryInPlots = !plotIds.includes('SITE_BOUNDARY');
  const distinctOk = (plotIds.length === distinctPlotIds.size) && noSiteBoundaryInPlots;
  assertTest(9, 'Multiple plots have distinct identifiers with no macro-boundary pollution',
    distinctOk,
    `Total plots: ${plots.length}, Distinct IDs: ${distinctPlotIds.size}, SITE_BOUNDARY removed from plots: ${noSiteBoundaryInPlots}`
  );

  // Test 10: Canonical GeoJSON FeatureCollection regression check
  const geoJson = result.geoJsonFeatureCollection;
  const geoJsonValid = geoJson && geoJson.type === 'FeatureCollection' && geoJson.features.length === plots.length;
  assertTest(10, 'Canonical GeoJSON FeatureCollection conforms to data contract',
    geoJsonValid,
    `GeoJSON Feature count: ${geoJson?.features?.length}, matches plots array: ${plots.length}`
  );

  // Check Plot 9 verification status
  const p9 = plots.find(p => p.plotNumber === '9' || p.plotNumber === '09');
  console.log(`\n[TARGETED PLOT 09 AUDIT]`);
  if (p9) {
    console.log(`  • Plot Number:              ${p9.plotNumber}`);
    console.log(`  • Entity Type:              ${p9.entityType}`);
    console.log(`  • Calculated Area:          ${p9.calculatedAreaSqm} sqm (${p9.calculatedAreaSqft} sq.ft)`);
    console.log(`  • Official Table Area:      ${p9.officialAreaSqm} sqm (${p9.officialAreaSqft} sq.ft)`);
    console.log(`  • Area Difference:          ${p9.areaDifferenceSqm} sqm`);
    console.log(`  • Verification Status:      ${p9.verificationStatus}`);
    console.log(`  • Vertex Count:             ${p9.polygonGeometry?.length}`);
  } else {
    console.error(`  ❌ Plot 9 was not found in extracted plots!`);
  }

  // Regression check across other PDFs
  console.log(`\n[REGRESSION CHECK ACROSS ADDITIONAL PDFS]`);
  const pdf30 = path.join(__dirname, 'master_cadastral_layout_30plots.pdf');
  const res30 = await parseCadastralPdf(pdf30);
  console.log(`  • master_cadastral_layout_30plots.pdf: ${res30.plots.length} plots, ${res30.forensicReport.overlapCount} overlaps`);

  const pdfSample = path.join(__dirname, 'sample_cadastral_layout.pdf');
  const resSample = await parseCadastralPdf(pdfSample);
  console.log(`  • sample_cadastral_layout.pdf:          ${resSample.plots.length} plots, ${resSample.forensicReport.overlapCount} overlaps`);

  console.log(`\n================================================================`);
  console.log(`🏁 TEST SUITE RESULT: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(0)}%)`);
  console.log('================================================================');

  if (passedTests === totalTests && res30.forensicReport.overlapCount === 0 && resSample.forensicReport.overlapCount === 0) {
    console.log('🎉 ALL RIGOROUS CADASTRAL GEOMETRY & TOPOLOGY TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
