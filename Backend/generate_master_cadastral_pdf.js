import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate30PlotMasterCadastralPdf() {
  console.log('📄 Generating Real 30-Plot Master Cadastral Layout PDF Document...');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // --- PAGE 1: SECTOR A (15 Plots) ---
  const page1 = pdfDoc.addPage([1000, 750]);

  // Header & Title
  page1.drawText('SKY CADASTRAL - MASTER DEMARCATION PLAN 2026 (SECTOR A)', {
    x: 50, y: 700, size: 18, font, color: rgb(0, 0.1, 0.23),
  });
  page1.drawText('Scale 1:500 • EPSG:3857 • Site Area: Sector A Hinjewadi Phase 1', {
    x: 50, y: 680, size: 11, font: regularFont, color: rgb(0.4, 0.4, 0.4),
  });

  // Main Access Road Vector
  page1.drawRectangle({
    x: 40, y: 620, width: 920, height: 35,
    color: rgb(0.9, 0.9, 0.95), borderColor: rgb(0.7, 0.7, 0.8), borderWidth: 1.5,
  });
  page1.drawText('MAIN 50FT SECTOR A ACCESS HIGHWAY', {
    x: 350, y: 632, size: 12, font, color: rgb(0.2, 0.2, 0.3),
  });

  // Sector A Plots (15 Plots in 3 rows x 5 cols)
  let plotIndex = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 50 + col * 180;
      const y = 450 - row * 130;
      const width = 160;
      const height = 100;

      page1.drawRectangle({
        x, y, width, height,
        color: rgb(0.92, 0.98, 0.95), borderColor: rgb(0.06, 0.65, 0.45), borderWidth: 1.5,
      });

      const plotNumStr = plotIndex <= 10 ? `Plot P-1${plotIndex < 10 ? '0' + plotIndex : plotIndex}` : `Plot ${100 + plotIndex}`;
      const length = 50 + (plotIndex % 3) * 5;
      const plotWidth = 30 + (plotIndex % 2) * 5;
      const area = length * plotWidth;

      page1.drawText(plotNumStr, { x: x + 40, y: y + 65, size: 11, font });
      page1.drawText(`Dimensions: ${length}x${plotWidth} ft`, { x: x + 25, y: y + 45, size: 9, font: regularFont });
      page1.drawText(`Area: ${area} sq.ft`, { x: x + 35, y: y + 28, size: 9, font: regularFont });

      plotIndex++;
    }
  }

  // --- PAGE 2: SECTOR B (15 Plots - Mixed Formats & Irregular Geometries) ---
  const page2 = pdfDoc.addPage([1000, 750]);

  page2.drawText('SKY CADASTRAL - MASTER DEMARCATION PLAN 2026 (SECTOR B)', {
    x: 50, y: 700, size: 18, font, color: rgb(0.0, 0.15, 0.35),
  });
  page2.drawText('Scale 1:500 • EPSG:3857 • Site Area: Sector B Commercial & Premium Residential', {
    x: 50, y: 680, size: 11, font: regularFont, color: rgb(0.4, 0.4, 0.4),
  });

  // Sector B Plots (15 Plots)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 50 + col * 180;
      const y = 450 - row * 130;
      const width = 160;
      const height = 100;

      page2.drawRectangle({
        x, y, width, height,
        color: rgb(0.98, 0.95, 0.9), borderColor: rgb(0.85, 0.55, 0.1), borderWidth: 1.5,
      });

      let plotNumStr = '';
      if (plotIndex <= 20) plotNumStr = `Site ${200 + plotIndex}`;
      else if (plotIndex <= 25) plotNumStr = `No. ${plotIndex}`;
      else plotNumStr = `PLOT NO. ${plotIndex}`;

      const length = 60 + (plotIndex % 4) * 5;
      const plotWidth = 40 + (plotIndex % 3) * 5;
      const area = length * plotWidth;

      page2.drawText(plotNumStr, { x: x + 35, y: y + 65, size: 11, font });
      page2.drawText(`Dimensions: ${length}x${plotWidth} ft`, { x: x + 25, y: y + 45, size: 9, font: regularFont });
      page2.drawText(`Area: ${area} sq.ft`, { x: x + 35, y: y + 28, size: 9, font: regularFont });

      plotIndex++;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, 'master_cadastral_layout_30plots.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`✅ 30-Plot Master Cadastral Layout PDF generated successfully at:\n   -> ${outputPath}`);
}

generate30PlotMasterCadastralPdf().catch(err => {
  console.error('❌ Failed to generate master PDF:', err);
  process.exit(1);
});
