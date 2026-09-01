import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  console.log('Connecting to Neon PostgreSQL Database...');
  
  try {
    // 1. Run Schema Creation
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Creating database tables...');
    await pool.query(schemaSql);
    console.log('Database tables verified successfully.');

    // 2. Seed Projects
    console.log('Seeding initial project areas...');
    const projects = [
      { id: 'AREA-001', name: 'Sky Cadastral Phase 1', owner_name: 'Akash Kamble', address: 'Sector 1, Hinjewadi Phase 1, Pune, Maharashtra - 411057', description: 'Prime residential layout featuring 40ft wide main approach road, streetlights, and drainage line.' },
      { id: 'AREA-002', name: 'Sky Cadastral Phase 2', owner_name: 'Apex Developments Ltd.', address: 'Commercial Hub, Sector 2, Baner-Pashan Link Road, Pune - 411045', description: 'Commercial & mixed-use zoning with high-density IT corridor proximity.' },
      { id: 'AREA-003', name: 'Sky Cadastral Phase 3', owner_name: 'Rajesh & Sunita Sharma', address: 'Lakeview Sector 3, Gangapur Road, Nashik - 422001', description: 'Scenic waterfront luxury villa plots with clear title verification.' }
    ];

    for (const p of projects) {
      await pool.query(
        `INSERT INTO projects (id, name, owner_name, address, description)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, owner_name = EXCLUDED.owner_name, address = EXCLUDED.address, description = EXCLUDED.description`,
        [p.id, p.name, p.owner_name, p.address, p.description]
      );
    }

    // 3. Seed Layouts
    console.log('Seeding initial cadastral layouts...');
    const layouts = [
      {
        id: 'LAYOUT-001',
        project_id: 'AREA-001',
        project_name: 'Sky Cadastral Phase 1',
        name: 'Master Demarcation Plan 2026',
        status: 'Verified',
        original_pdf_url: '/docs/Sky_Cadastral_Master_Layout_Phase1.pdf',
        original_pdf_name: 'Sky_Cadastral_Master_Layout_Phase1.pdf',
        file_size: '4.8 MB',
        uploaded_at: '2026-08-01',
        extracted_plots_count: 16
      },
      {
        id: 'LAYOUT-002',
        project_id: 'AREA-002',
        project_name: 'Sky Cadastral Phase 2',
        name: 'Commercial Hub Layout',
        status: 'Published',
        original_pdf_url: '/docs/Sky_Cadastral_Phase2_Commercial.pdf',
        original_pdf_name: 'Sky_Cadastral_Phase2_Commercial.pdf',
        file_size: '6.2 MB',
        uploaded_at: '2026-08-05',
        extracted_plots_count: 8
      }
    ];

    for (const l of layouts) {
      await pool.query(
        `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, uploaded_at, extracted_plots_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status, extracted_plots_count = EXCLUDED.extracted_plots_count`,
        [l.id, l.project_id, l.project_name, l.name, l.status, l.original_pdf_url, l.original_pdf_name, l.file_size, l.uploaded_at, l.extracted_plots_count]
      );
    }

    // 4. Seed Plots with Vector Geometries
    console.log('Seeding initial plots with vector polygon geometries...');
    const plots = [
      {
        id: 'PLOT-A01',
        plot_number: 'A-01',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 1',
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        document_area: 1200,
        facing: 'North-East',
        facing_road_width: 40,
        polygon_geometry: JSON.stringify([[50, 50], [210, 50], [210, 150], [50, 150]]),
        valuation: 2400000,
        price_per_sqft: 2000,
        status: 'Available',
        location: 'North-East Corner, Sector 1',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-15',
        verification_status: 'Verified',
        valuation_notes: 'Corner prime location with 40ft road frontage.'
      },
      {
        id: 'PLOT-A02',
        plot_number: 'A-02',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 1',
        area: 1500,
        unit: 'sq.ft',
        length: 50,
        width: 30,
        document_area: 1500,
        facing: 'East',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[225, 50], [425, 50], [425, 150], [225, 150]]),
        valuation: 3000000,
        price_per_sqft: 2000,
        status: 'Booked',
        location: 'Sector 1, Plot 2',
        customer_name: 'Apex Developments Ltd.',
        customer_phone: '+91 98220 12345',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-14',
        verification_status: 'Verified',
        valuation_notes: 'Standard residential plot. Booking confirmed with 20% advance.'
      },
      {
        id: 'PLOT-A03',
        plot_number: 'A-03',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 1',
        area: 1800,
        unit: 'sq.ft',
        length: 60,
        width: 30,
        document_area: 1800,
        facing: 'East',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[440, 50], [680, 50], [680, 150], [440, 150]]),
        valuation: 3600000,
        price_per_sqft: 2000,
        status: 'Sold',
        location: 'Sector 1, Plot 3',
        customer_name: 'Meridian Civic Authority',
        customer_phone: '+91 98221 23456',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-10',
        verification_status: 'Verified',
        valuation_notes: 'Fully paid and registered plot. Registry completed.'
      },
      {
        id: 'PLOT-B07',
        plot_number: 'B-07',
        layout_id: 'LAYOUT-002',
        project: 'Sky Cadastral Phase 2',
        area: 1440,
        unit: 'sq.ft',
        length: 48,
        width: 30,
        document_area: 1500,
        facing: 'North-West',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[520, 175], [710, 175], [740, 250], [680, 305], [520, 295]]),
        valuation: 3168000,
        price_per_sqft: 2200,
        status: 'Available',
        location: 'Sector 2, Plot 7',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Pending Audit',
        verified_at: '',
        verification_status: 'Mismatch',
        valuation_notes: 'Requires surveyor boundary re-check. Irregular polygon boundary.'
      }
    ];

    for (const p of plots) {
      await pool.query(
        `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, customer_name, customer_phone, verified_by, verified_at, verification_status, valuation_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
         polygon_geometry = EXCLUDED.polygon_geometry, area = EXCLUDED.area, status = EXCLUDED.status, verification_status = EXCLUDED.verification_status`,
        [
          p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width, p.document_area,
          p.facing, p.facing_road_width, p.polygon_geometry, p.valuation, p.price_per_sqft, p.status,
          p.location, p.customer_name, p.customer_phone, p.verified_by, p.verified_at, p.verification_status, p.valuation_notes
        ]
      );
    }

    console.log('✅ Seed completed successfully! All tables, layouts, and plots populated in Neon DB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Neon Database:', err);
    process.exit(1);
  }
}

runSeed();
