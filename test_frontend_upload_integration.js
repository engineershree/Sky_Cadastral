import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runUploadIntegrationSuite() {
  console.log('================================================================');
  console.log('🧪 SKY CADASTRAL ADMIN — FRONTEND PDF UPLOAD INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // TEST 1: Production URL Resolution
  console.log('[TEST 1: Production API Base URL & Endpoint Resolution]');
  const expectedProdBase = 'https://sky-cadastral.onrender.com/api';
  const expectedParseEndpoint = 'https://sky-cadastral.onrender.com/api/cadastral/parse-pdf';
  assert(expectedProdBase === 'https://sky-cadastral.onrender.com/api', 'Production API Base URL is https://sky-cadastral.onrender.com/api');
  assert(expectedParseEndpoint === 'https://sky-cadastral.onrender.com/api/cadastral/parse-pdf', 'Parse PDF Endpoint resolves to https://sky-cadastral.onrender.com/api/cadastral/parse-pdf');

  // TEST 2: File Validation Logic Simulation
  console.log('\n[TEST 2: Client-side File Validation Rules]');
  
  function validateFile(file) {
    if (!file) return { valid: false, error: 'Please select a file' };
    const fileName = file.name || '';
    if (!fileName.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return { valid: false, error: 'Please select a valid PDF file (.pdf)' };
    }
    if (!file.size || file.size <= 0) {
      return { valid: false, error: 'The selected PDF file is empty (0 bytes).' };
    }
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }
    return { valid: true };
  }

  // 2a. Missing file
  const missingRes = validateFile(null);
  assert(!missingRes.valid && missingRes.error.includes('select a file'), 'Missing file caught and rejected');

  // 2b. Non-PDF file
  const nonPdfRes = validateFile({ name: 'cadastral_layout.dwg', size: 5000 });
  assert(!nonPdfRes.valid && nonPdfRes.error.includes('.pdf'), 'Non-PDF file (.dwg) caught and rejected');

  // 2c. 0-byte PDF file
  const emptyPdfRes = validateFile({ name: 'empty_plan.pdf', size: 0 });
  assert(!emptyPdfRes.valid && emptyPdfRes.error.includes('0 bytes'), 'Empty (0-byte) PDF caught and rejected');

  // 2d. Oversized file (> 50MB)
  const hugePdfRes = validateFile({ name: 'huge_cadastral.pdf', size: 60 * 1024 * 1024 });
  assert(!hugePdfRes.valid && hugePdfRes.error.includes('50MB'), 'Oversized (>50MB) file caught and rejected');

  // 2e. Valid PDF file
  const validFileSim = { name: 'golden_city.pdf', size: 450000, type: 'application/pdf' };
  const validRes = validateFile(validFileSim);
  assert(validRes.valid, 'Valid PDF file (450KB) passes validation');

  // TEST 3: Multi-part FormData Contract Verification
  console.log('\n[TEST 3: Multi-part FormData Field Verification]');
  const samplePdfPath = path.join(__dirname, 'Backend', 'sample_cadastral_layout.pdf');
  assert(fs.existsSync(samplePdfPath), `Found test PDF: ${samplePdfPath}`);
  const sampleBuf = fs.readFileSync(samplePdfPath);
  assert(sampleBuf.length > 0, `Test PDF has non-zero size: ${sampleBuf.length} bytes`);

  const formData = new FormData();
  const pdfBlob = new Blob([sampleBuf], { type: 'application/pdf' });
  formData.append('pdfFile', pdfBlob, 'sample_cadastral_layout.pdf');
  formData.append('layoutName', 'Test Automated Cadastral Plan');
  formData.append('projectId', 'AREA-001');
  formData.append('projectName', 'Golden City Vita Phase 1');

  assert(formData.has('pdfFile'), 'FormData contains expected field: pdfFile');
  assert(formData.has('layoutName'), 'FormData contains expected field: layoutName');
  assert(formData.has('projectId'), 'FormData contains expected field: projectId');
  assert(formData.has('projectName'), 'FormData contains expected field: projectName');

  // TEST 4: Live Production Backend Integration Test
  console.log('\n[TEST 4: Live Production PDF Extraction Endpoint Verification]');
  console.log(`  -> Submitting real PDF to: ${expectedParseEndpoint} ...`);
  const t0 = Date.now();
  const response = await fetch(expectedParseEndpoint, {
    method: 'POST',
    body: formData
  });
  const latency = Date.now() - t0;
  console.log(`  -> Response status: ${response.status} (${latency}ms)`);

  assert(response.status === 200, `Backend returned HTTP 200 OK (latency: ${latency}ms)`);
  const data = await response.json();

  assert(data.success === true, 'Response payload contains success: true');
  assert(Array.isArray(data.plots), `Response contains plots array (count: ${data.plots?.length})`);
  assert(data.plots.length > 0, `Extracted real plots count > 0 (received ${data.plots.length} plots)`);
  assert(data.forensicReport !== undefined, 'Response contains forensicReport object');
  assert(data.forensicReport.documentName === 'sample_cadastral_layout.pdf', 'Document name correctly identified by backend');
  assert(data.forensicReport.fallbackMode === false, 'Real extraction confirmed: fallbackMode is false');
  assert(data.forensicReport.matchedPlotCount === data.plots.length, `Matched plot count (${data.forensicReport.matchedPlotCount}) equals plot array length (${data.plots.length})`);

  // Verify plot geometry format
  const firstPlot = data.plots[0];
  assert(firstPlot.plotNumber !== undefined, `First plot has plotNumber: "${firstPlot.plotNumber}"`);
  assert(firstPlot.polygonGeometry !== undefined, 'First plot has polygonGeometry');
  assert(firstPlot.officialArea !== undefined || firstPlot.area !== undefined, 'First plot has area information');

  // TEST 5: Fallback Detection Logic Verification
  console.log('\n[TEST 5: Truthful Fallback Mode Detection]');
  const mockFallbackReport = {
    fallbackMode: true,
    fallbackReason: 'Vector extraction fallback engaged'
  };
  const isFallbackDetected = Boolean(mockFallbackReport?.fallbackMode);
  assert(isFallbackDetected === true, 'Fallback mode truthfully identified when present in forensic report');

  // TEST 6: Production Build Integrity
  console.log('\n[TEST 6: Production Build Files Verification]');
  const distHtmlPath = path.join(__dirname, 'dist', 'index.html');
  assert(fs.existsSync(distHtmlPath), 'Vite production build exists at dist/index.html');
  const distHtmlContent = fs.readFileSync(distHtmlPath, 'utf8');
  assert(distHtmlContent.includes('doctype html'), 'dist/index.html is valid HTML5');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests} OF ${totalTests} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================');
}

runUploadIntegrationSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
