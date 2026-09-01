import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSampleCadastralPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([800, 600]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Background Title & Header
  page.drawText('SKY CADASTRAL - MASTER DEMARCATION PLAN 2026', {
    x: 50,
    y: 560,
    size: 16,
    font,
    color: rgb(0, 0.1, 0.23),
  });

  page.drawText('Scale 1:500 • EPSG:3857 • Site Area: Sector 1 Hinjewadi', {
    x: 50,
    y: 540,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Draw 40FT Access Road Vector
  page.drawRectangle({
    x: 50,
    y: 490,
    width: 700,
    height: 30,
    color: rgb(0.9, 0.9, 0.95),
    borderColor: rgb(0.7, 0.7, 0.8),
    borderWidth: 1,
  });

  page.drawText('MAIN 40FT ACCESS ROAD', {
    x: 320,
    y: 500,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Plot 1: P-101 (Rectangular 50x30 = 1500 sq.ft)
  page.drawRectangle({
    x: 50,
    y: 360,
    width: 200,
    height: 110,
    color: rgb(0.9, 0.98, 0.94),
    borderColor: rgb(0.06, 0.72, 0.5),
    borderWidth: 2,
  });
  page.drawText('Plot P-101', { x: 120, y: 420, size: 12, font });
  page.drawText('Dimensions: 50x30 ft', { x: 100, y: 400, size: 9, font: regularFont });
  page.drawText('Area: 1500 sq.ft', { x: 110, y: 385, size: 9, font: regularFont });

  // Plot 2: P-102 (Rectangular 60x30 = 1800 sq.ft)
  page.drawRectangle({
    x: 270,
    y: 360,
    width: 240,
    height: 110,
    color: rgb(0.9, 0.98, 0.94),
    borderColor: rgb(0.06, 0.72, 0.5),
    borderWidth: 2,
  });
  page.drawText('Plot P-102', { x: 350, y: 420, size: 12, font });
  page.drawText('Dimensions: 60x30 ft', { x: 330, y: 400, size: 9, font: regularFont });
  page.drawText('Area: 1800 sq.ft', { x: 340, y: 385, size: 9, font: regularFont });

  // Plot 3: P-103 (Irregular Cadastral Polygon)
  // Bounding Text
  page.drawText('Plot P-103', { x: 580, y: 420, size: 12, font });
  page.drawText('Dimensions: 48x30 ft', { x: 560, y: 400, size: 9, font: regularFont });
  page.drawText('Area: 1450 sq.ft', { x: 570, y: 385, size: 9, font: regularFont });

  page.drawRectangle({
    x: 530,
    y: 360,
    width: 200,
    height: 110,
    color: rgb(1.0, 0.97, 0.88),
    borderColor: rgb(0.96, 0.62, 0.04),
    borderWidth: 2,
  });

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, 'sample_cadastral_layout.pdf');
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✅ Sample Cadastral Layout PDF generated successfully at: ${outputPath}`);
}

generateSampleCadastralPdf();
