import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Executes the Python Cadastral Extraction Engine on a PDF file
 * Returns forensic extraction report, matched plot geometries, official table map, and unmatched polygons.
 */
export async function parseCadastralPdf(pdfBufferOrPath) {
  let tempFilePath = null;
  let targetPdfPath = '';

  if (typeof pdfBufferOrPath === 'string') {
    targetPdfPath = pdfBufferOrPath;
  } else if (Buffer.isBuffer(pdfBufferOrPath)) {
    tempFilePath = path.join(__dirname, `temp_cadastral_${Date.now()}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBufferOrPath);
    targetPdfPath = tempFilePath;
  } else {
    throw new Error('Invalid PDF input: expected file path string or Buffer');
  }

  const scriptPath = path.join(__dirname, 'cadastral_extractor.py');

  return new Promise((resolve, reject) => {
    execFile('python', [scriptPath, targetPdfPath], { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Clean up temp file if created
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
      }

      if (error) {
        console.error('❌ Python Cadastral Extractor Error:', stderr || error.message);
        return reject(new Error(`Cadastral Extraction Failed: ${stderr || error.message}`));
      }

      try {
        const jsonResult = JSON.parse(stdout);
        
        // Map Python result to backend schema plots format
        const plots = (jsonResult.matchedPlots || []).map((p, idx) => ({
          plotId: p.plotId,
          plotNumber: p.plotNumber,
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
          pricePerSqFt: 2200 + (idx % 5) * 100,
          valuation: Math.round((p.officialAreaSqft || p.calculatedAreaSqft) * (2200 + (idx % 5) * 100)),
          status: 'Available',
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
          forensicReport: jsonResult.forensicReport,
          officialTableMap: jsonResult.officialTableMap,
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
  });
}

