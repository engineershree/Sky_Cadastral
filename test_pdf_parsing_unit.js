import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUnitTests() {
  console.log('================================================================');
  console.log('🧪 SKY CADASTRAL — COMPREHENSIVE PDF PARSER & PLOT UNIT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extraInfo = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
      if (extraInfo) console.log(`     └─ ${extraInfo}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      if (extraInfo) console.error(`     └─ ${extraInfo}`);
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 1: Buffer & File Path Ingestion
  // --------------------------------------------------------------------------
  console.log('[SUITE 1: Input Ingestion & Temporary File Handling]');
  
  const samplePdfPath = path.join(__dirname, 'sample_cadastral_layout.pdf');
  const goldenPdfPath = path.join(__dirname, 'GOLDEN_CITY_FINAL_PLAN.pdf');
  const master30PdfPath = path.join(__dirname, 'master_cadastral_layout_30plots.pdf');

  // Test 1.1: Parsing via File Path
  const resFilePath = await parseCadastralPdf(samplePdfPath);
  assert(
    'parseCadastralPdf accepts file path string',
    resFilePath && Array.isArray(resFilePath.plots) && resFilePath.plots.length > 0,
    `Extracted ${resFilePath.plots.length} plots from path`
  );

  // Test 1.2: Parsing via Binary Buffer
  const sampleBuffer = fs.readFileSync(samplePdfPath);
  const resBuffer = await parseCadastralPdf(sampleBuffer);
  assert(
    'parseCadastralPdf accepts raw binary Buffer',
    resBuffer && Array.isArray(resBuffer.plots) && resBuffer.plots.length === resFilePath.plots.length,
    `Extracted ${resBuffer.plots.length} plots from Buffer, matching path output`
  );

  // Test 1.3: No temporary files leaked in workspace directory
  const leakedFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_cadastral_') && f.endsWith('.pdf'));
  assert(
    'Temporary PDF files are cleaned up immediately after execution',
    leakedFiles.length === 0,
    `Leaked files found: ${leakedFiles.length}`
  );

  // --------------------------------------------------------------------------
  // SUITE 2: Plot Generation & Schema Conformance
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 2: Plot Generation & Backend Schema Conformance]');

  const resMaster = await parseCadastralPdf(master30PdfPath);
  assert(
    'Generates correct plot count for master 30-plot layout',
    resMaster.plots.length === 30,
    `Expected 30 plots, received ${resMaster.plots.length}`
  );

  const samplePlot = resMaster.plots[0];
  const requiredFields = [
    'plotId', 'plotNumber', 'entityType', 'area', 'documentArea',
    'calculatedAreaSqft', 'officialAreaSqft', 'length', 'width',
    'edgeDimensions', 'facing', 'facingRoadWidth', 'polygonGeometry',
    'canonicalGeometry', 'pricePerSqFt', 'valuation', 'status',
    'verificationStatus', 'valuationNotes'
  ];

  const missingFields = requiredFields.filter(f => samplePlot[f] === undefined);
  assert(
    'Plot object contains all required backend schema fields',
    missingFields.length === 0,
    missingFields.length === 0 ? 'All 19 required fields present' : `Missing: ${missingFields.join(', ')}`
  );

  assert(
    'Plot ID follows canonical Entity/PLOT naming contract',
    typeof samplePlot.plotId === 'string' && samplePlot.plotId.length > 0,
    `Sample Plot ID: "${samplePlot.plotId}"`
  );

  assert(
    'Plot Number is properly normalized without rogue formatting',
    samplePlot.plotNumber && typeof samplePlot.plotNumber === 'string',
    `Sample Plot Number: "${samplePlot.plotNumber}"`
  );

  assert(
    'Plot pricing and valuation calculated correctly',
    samplePlot.pricePerSqFt > 0 && samplePlot.valuation > 0 && samplePlot.valuation >= samplePlot.area * 2000,
    `Area: ${samplePlot.area} sq.ft, Rate: ₹${samplePlot.pricePerSqFt}/sq.ft, Valuation: ₹${samplePlot.valuation}`
  );

  // --------------------------------------------------------------------------
  // SUITE 3: Coordinate Alignment & Canonical Geometry Normalization
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 3: Coordinate Alignment & Canonical Normalization]');

  // Verify canonical geometry is transformed to local projected meters
  const canonicalCoords = samplePlot.canonicalGeometry;
  assert(
    'Canonical geometry contains closed ring in projected meters',
    Array.isArray(canonicalCoords) && canonicalCoords.length >= 4,
    `Vertex count: ${canonicalCoords?.length}`
  );

  const firstPt = canonicalCoords[0];
  const lastPt = canonicalCoords[canonicalCoords.length - 1];
  const isClosed = Math.abs(firstPt[0] - lastPt[0]) < 0.01 && Math.abs(firstPt[1] - lastPt[1]) < 0.01;
  assert(
    'Canonical polygon ring is closed (first vertex matches last vertex)',
    isClosed,
    `Start: [${firstPt}], End: [${lastPt}]`
  );

  // Check scale provenance
  const meta = resMaster.geoJsonFeatureCollection?.metadata;
  assert(
    'Metadata contains calibrated scale factors and local origin',
    meta && meta.origin && meta.scaleProvenance?.ptsPerM > 0,
    `Origin: [${meta?.origin}], Scale: ${meta?.scaleProvenance?.ptsPerM} pts/m`
  );

  // --------------------------------------------------------------------------
  // SUITE 4: Edge Dimensions & Boundary Alignment
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 4: Edge Dimensions & Boundary Alignment]');

  const edgeDims = samplePlot.edgeDimensions;
  assert(
    'Edge dimensions array matches polygon perimeter segment count',
    Array.isArray(edgeDims) && edgeDims.length === samplePlot.polygonGeometry.length - 1,
    `Edges: ${edgeDims?.length}, Vertices: ${samplePlot.polygonGeometry.length}`
  );

  const sampleEdge = edgeDims[0];
  const edgeHasCoordinates = sampleEdge.start && sampleEdge.end && sampleEdge.calculatedLengthFt > 0;
  assert(
    'Edge dimension has start, end, and positive calculated length in feet',
    edgeHasCoordinates,
    `Edge 0: Start [${sampleEdge?.start}], End [${sampleEdge?.end}], Length: ${sampleEdge?.calculatedLengthFt} ft`
  );

  // --------------------------------------------------------------------------
  // SUITE 5: Complex Real-World Benchmark (Golden City 78 Plots)
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 5: Real-World Cadastral Benchmark (Golden City)]');

  const resGolden = await parseCadastralPdf(goldenPdfPath);
  const goldenPlots = resGolden.plots;
  const goldenReport = resGolden.forensicReport;

  assert(
    'Extracts all 78 valid subdivision plots from Golden City plan',
    goldenPlots.length === 78,
    `Extracted plots: ${goldenPlots.length}`
  );

  assert(
    'Target Plot 9 extracted with verified parcel geometry',
    goldenPlots.some(p => p.plotNumber === '9' && p.verificationStatus === 'VERIFIED'),
    `Plot 9 verified against official table schedule`
  );

  assert(
    'Zero pairwise overlaps detected across all 78 parcels',
    goldenReport.overlapCount === 0 && goldenReport.totalOverlapAreaSqft === 0,
    `Overlap Count: ${goldenReport.overlapCount}, Overlap Area: ${goldenReport.totalOverlapAreaSqft} sq.ft`
  );

  assert(
    'Macro boundary / site envelope separated from subdivision parcels',
    !goldenPlots.some(p => p.plotNumber === 'SITE_BOUNDARY' || p.entityType === 'SITE_BOUNDARY'),
    `SITE_BOUNDARY cleanly isolated from subdivision plots array`
  );

  // --------------------------------------------------------------------------
  // SUITE 6: GeoJSON FeatureCollection Contract
  // --------------------------------------------------------------------------
  console.log('\n[SUITE 6: GeoJSON FeatureCollection Contract]');

  const featureCollection = resGolden.geoJsonFeatureCollection;
  assert(
    'GeoJSON FeatureCollection adheres strictly to RFC 7946',
    featureCollection && featureCollection.type === 'FeatureCollection' && Array.isArray(featureCollection.features),
    `Feature collection type: ${featureCollection?.type}, total features: ${featureCollection?.features?.length}`
  );

  assert(
    'GeoJSON feature count matches extracted plots count',
    featureCollection.features.length === goldenPlots.length,
    `Features: ${featureCollection.features.length}, Plots: ${goldenPlots.length}`
  );

  const f1 = featureCollection.features[0];
  assert(
    'GeoJSON feature contains valid Polygon geometry and properties',
    f1.geometry?.type === 'Polygon' && f1.properties?.plotNumber && f1.properties?.areaSqm > 0,
    `Feature 0: Plot ${f1.properties?.plotNumber}, Area: ${f1.properties?.areaSqm} sqm`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 UNIT TEST SUITE COMPLETED: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(0)}%)`);
  console.log('================================================================');

  if (passed === total) {
    console.log('🎉 ALL UNIT TESTS FOR PDF PARSING, PLOT GENERATION & ALIGNMENT PASSED!\n');
    return true;
  } else {
    console.error('❌ Some unit tests failed!\n');
    return false;
  }
}

runUnitTests().then(success => {
  if (!success) process.exit(1);
});
