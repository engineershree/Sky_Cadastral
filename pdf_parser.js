import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dedicated isolated temp directory in OS temp
const SECURE_TEMP_DIR = path.join(os.tmpdir(), 'sky_cadastral_secure_tmp');

// Ensure secure temp directory exists with restricted permissions
try {
  if (!fs.existsSync(SECURE_TEMP_DIR)) {
    fs.mkdirSync(SECURE_TEMP_DIR, { recursive: true, mode: 0o700 });
  }
} catch (_) {}

/**
 * Validates that a buffer has a valid PDF magic header (%PDF-)
 * Standard PDF signature %PDF- must appear at offset 0 (or offset 3 after UTF-8 BOM)
 */
function isValidPdfMagicHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 50) return false;
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return true;
  if (buffer.length >= 8 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    if (buffer.subarray(3, 8).toString('latin1') === '%PDF-') return true;
  }
  return false;
}

/**
 * Periodic reaper to clean up any temporary PDF files older than 10 minutes
 */
function reapStaleTempFiles() {
  try {
    if (!fs.existsSync(SECURE_TEMP_DIR)) return;
    const now = Date.now();
    const files = fs.readdirSync(SECURE_TEMP_DIR);
    for (const f of files) {
      if (f.startsWith('cadastral_') && f.endsWith('.pdf')) {
        const fullPath = path.join(SECURE_TEMP_DIR, f);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > 10 * 60 * 1000) {
            fs.unlinkSync(fullPath);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}

// Run reaper on load
reapStaleTempFiles();

/**
 * Executes the Python Cadastral Extraction Engine on a PDF file
 * Returns forensic extraction report, matched plot geometries, official table map, and unmatched polygons.
 */
export async function parseCadastralPdf(pdfBufferOrPath) {
  let tempFilePath = null;
  let targetPdfPath = '';

  // 1. Input Validation & Security Sanitization
  if (typeof pdfBufferOrPath === 'string') {
    // Security Guard: Reject null bytes, newlines, or command flags
    if (/[\0\r\n]/.test(pdfBufferOrPath) || pdfBufferOrPath.trim().startsWith('-')) {
      throw new Error('Security Error: Illegal characters or command flags detected in PDF file path');
    }

    const trimmedPath = pdfBufferOrPath.trim();
    if (!trimmedPath.toLowerCase().endsWith('.pdf')) {
      throw new Error(`Security Error: Invalid file type "${path.extname(trimmedPath)}". Expected a .pdf file.`);
    }

    const resolvedPath = path.resolve(trimmedPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Security Error: Target PDF file does not exist at path: ${trimmedPath}`);
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isFile()) {
      throw new Error('Security Error: Target path is not a regular file');
    }

    if (stat.size < 50) {
      throw new Error('Security Error: Target PDF file is empty or corrupted (size < 50 bytes)');
    }

    // Verify magic bytes of the target file
    const fd = fs.openSync(resolvedPath, 'r');
    const headerBuf = Buffer.alloc(64);
    fs.readSync(fd, headerBuf, 0, 64, 0);
    fs.closeSync(fd);

    if (!isValidPdfMagicHeader(headerBuf)) {
      throw new Error('Security Error: Target file does not have a valid %PDF- header signature');
    }

    targetPdfPath = resolvedPath;
  } else if (Buffer.isBuffer(pdfBufferOrPath)) {
    if (pdfBufferOrPath.length < 50) {
      throw new Error('Security Error: PDF buffer is empty or corrupted (size < 50 bytes)');
    }

    if (!isValidPdfMagicHeader(pdfBufferOrPath)) {
      throw new Error('Security Error: Uploaded buffer does not contain a valid %PDF- magic header signature');
    }

    if (pdfBufferOrPath.length > 50 * 1024 * 1024) {
      throw new Error('Security Error: PDF buffer exceeds maximum allowed limit of 50 MB');
    }

    // Write to dedicated isolated OS temp directory with random 128-bit hex token
    if (!fs.existsSync(SECURE_TEMP_DIR)) {
      fs.mkdirSync(SECURE_TEMP_DIR, { recursive: true, mode: 0o700 });
    }
    const randomSuffix = crypto.randomBytes(16).toString('hex');
    tempFilePath = path.join(SECURE_TEMP_DIR, `cadastral_${Date.now()}_${randomSuffix}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBufferOrPath, { mode: 0o600 });
    targetPdfPath = tempFilePath;
  } else {
    throw new Error('Security Error: Invalid PDF input: expected a valid file path string or Buffer');
  }

  const scriptPath = path.join(__dirname, 'cadastral_extractor.py');
  const pythonCandidates = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];

  const cleanup = () => {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  };

  return new Promise((resolve, reject) => {
    const runExtractor = (candidateIndex) => {
      const pythonCmd = pythonCandidates[candidateIndex];
      execFile(pythonCmd, [scriptPath, targetPdfPath], { maxBuffer: 50 * 1024 * 1024, timeout: 75000 }, (error, stdout, stderr) => {
        if (error && candidateIndex + 1 < pythonCandidates.length && !error.killed) {
          return runExtractor(candidateIndex + 1);
        }

        cleanup();

        if (error) {
          console.error('❌ Python Cadastral Extractor Error:', stderr || error.message);
          return reject(new Error(`Cadastral Extraction Failed: ${stderr || error.message}`));
        }

        try {
          const jsonStart = stdout.indexOf('{');
          const jsonEnd = stdout.lastIndexOf('}');
          const cleanStdout = (jsonStart !== -1 && jsonEnd > jsonStart) ? stdout.substring(jsonStart, jsonEnd + 1) : stdout;
          const jsonResult = JSON.parse(cleanStdout);

          if (jsonResult.error) {
            return reject(new Error(`Cadastral Extractor Error: ${jsonResult.error}`));
          }
        
          // Map Python result to backend schema plots format
          const plots = (jsonResult.matchedPlots || []).map((p, idx) => ({
            plotId: p.plotId,
            plotNumber: p.plotNumber,
            entityType: p.entityType || (p.plotNumber?.startsWith('OPEN SPACE') ? 'OPEN_SPACE' : (p.plotNumber === 'SITE_BOUNDARY' ? 'SITE_BOUNDARY' : 'PLOT')),
            area: p.officialAreaSqft || p.calculatedAreaSqft,
            documentArea: p.officialAreaSqft,
            calculatedAreaSqft: p.calculatedAreaSqft,
            officialAreaSqft: p.officialAreaSqft,
            calculatedAreaSqm: p.calculatedAreaSqm,
            officialAreaSqm: p.officialAreaSqm,
            areaDifferenceSqm: p.areaDifferenceSqm,
            unit: 'sq.ft',
            length: p.length || 50,
            width: p.width || 30,
            edgeDimensions: p.edgeDimensions || [],
            facing: p.facing || 'East',
            facingRoadWidth: p.facingRoadWidth || 30,
            polygonGeometry: p.polygonGeometry,
            canonicalGeometry: p.canonicalGeometry,
            pricePerSqFt: 2200 + (idx % 5) * 100,
            valuation: Math.round((p.officialAreaSqft || p.calculatedAreaSqft) * (2200 + (idx % 5) * 100)),
            status: p.entityType === 'PLOT' ? 'Available' : 'Reserved',
            verificationStatus: p.verificationStatus,
            valuationNotes: p.verificationStatus === 'VERIFIED'
              ? 'Verified cadastral vector geometry matched against official table area.'
              : `Geometry area mismatch: calculated ${p.calculatedAreaSqm} sqm vs official table ${p.officialAreaSqm} sqm.`
          }));

          // Compute layout bounds from extracted plot geometries
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          plots.forEach((p) => {
            if (p.polygonGeometry && Array.isArray(p.polygonGeometry)) {
              p.polygonGeometry.forEach(([x, y]) => {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              });
            }
          });

          const bounds = (isFinite(minX) && isFinite(maxX))
            ? { minX: Math.floor(minX), maxX: Math.ceil(maxX), minY: Math.floor(minY), maxY: Math.ceil(maxY), width: Math.ceil(maxX - minX), height: Math.ceil(maxY - minY) }
            : { minX: 0, maxX: jsonResult.forensicReport?.pageDimensionsPt?.width || 1200, minY: 0, maxY: jsonResult.forensicReport?.pageDimensionsPt?.height || 800, width: 1200, height: 800 };

          resolve({
            pageCount: jsonResult.forensicReport?.pageCount || 1,
            textLength: jsonResult.forensicReport?.tableRecordsExtracted || 0,
            forensicReport: jsonResult.forensicReport,
            officialTableMap: jsonResult.officialTableMap,
            geoJsonFeatureCollection: jsonResult.geoJsonFeatureCollection,
            plots: plots,
            extractedPlotsCount: plots.length,
            infrastructureGeometry: jsonResult.infrastructureGeometry || { roads: [], openSpaces: [] },
            bounds: bounds,
            viewCenter: [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2],
            unmatchedPolygons: jsonResult.unmatchedPolygons || [],
            diagnostics: {
              pagesProcessed: jsonResult.forensicReport?.pageCount || 1,
              textLength: jsonResult.forensicReport?.tableRecordsExtracted || 0,
              plotCandidatesFound: jsonResult.forensicReport?.validPolygonsReconstructed || 0,
              labeledPlots: jsonResult.forensicReport?.matchedPlotCount || 0,
              unlabeledPlots: jsonResult.forensicReport?.unmatchedPolygonsCount || 0,
              validatedPlots: jsonResult.forensicReport?.verifiedPlotsCount || 0,
              rejectedPlots: jsonResult.forensicReport?.geometryMismatchCount || 0,
              duplicatesRemoved: (jsonResult.forensicReport?.duplicateIdsFound || []).length
            }
          });
        } catch (parseErr) {
          reject(new Error(`Failed to parse Cadastral Extractor stdout JSON: ${parseErr.message}`));
        }
      });
    };

    runExtractor(0);
  });
}
