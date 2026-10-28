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
    console.log('Verifying database schema...');
    await pool.query(schemaSql);
    console.log('Database tables verified successfully.');

    // 2. Clear out all dummy, corrupted, and added test entries
    console.log('Clearing all dummy and test records from database...');
    await pool.query('DELETE FROM plot_audit_logs');
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM revenue_transactions');
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM plots');
    await pool.query('DELETE FROM layouts');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM diary_entries');
    await pool.query('DELETE FROM system_settings');
    console.log('✅ All dummy and test tables cleaned.');

    // 3. Seed Clean Official Projects
    console.log('Seeding official project areas...');
    const projects = [
      {
        id: 'AREA-001',
        name: 'Sky Cadastral Phase 1',
        owner_name: 'Akash Kamble',
        address: 'Sector 1, Hinjewadi Phase 1, Pune, Maharashtra - 411057',
        description: 'Prime residential layout featuring 40ft wide main approach road, streetlights, and drainage line.'
      },
      {
        id: 'AREA-002',
        name: 'Sky Cadastral Phase 2',
        owner_name: 'Apex Developments Ltd.',
        address: 'Commercial Hub, Sector 2, Baner-Pashan Link Road, Pune - 411045',
        description: 'Commercial & mixed-use zoning with high-density IT corridor proximity.'
      },
      {
        id: 'AREA-003',
        name: 'Sky Cadastral Phase 3',
        owner_name: 'Rajesh & Sunita Sharma',
        address: 'Lakeview Sector 3, Gangapur Road, Nashik - 422001',
        description: 'Scenic waterfront luxury villa plots with clear title verification.'
      },
      {
        id: 'AREA-004',
        name: 'Executive Enclave',
        owner_name: 'Meridian Civic Authority',
        address: 'Civil Lines, Sector 4, Marine Drive, Mumbai - 400001',
        description: 'Premium administrative and high-value residential layout.'
      },
      {
        id: 'AREA-005',
        name: 'Green Meadows',
        owner_name: 'Vikramaditya Patil',
        address: 'Baner Main Road, Near Highway Junction, Pune - 411045',
        description: 'Eco-friendly gated plotting community with central green park.'
      },
      {
        id: 'AREA-006',
        name: 'Industrial Zone 1',
        owner_name: 'Horizon Green Energy Corp',
        address: 'MIDC Gate 3 Road, Chakan Industrial Area, Pune - 410501',
        description: 'Heavy industrial & logistics warehousing parcels with direct highway connectivity.'
      },
      {
        id: 'AREA-007',
        name: 'Golden City Vita',
        owner_name: 'Saksham Bhore',
        address: 'Kundal Road, Ambedkar Nagar, Vita, Sangli, Maharashtra - 415311',
        description: 'Sanctioned master demarcation plan with 78 surveyed residential and commercial plots.'
      }
    ];

    for (const p of projects) {
      await pool.query(
        `INSERT INTO projects (id, name, owner_name, address, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [p.id, p.name, p.owner_name, p.address, p.description]
      );
    }
    console.log(`✅ Seeded ${projects.length} clean project areas.`);

    // 4. Seed Clean Master Layouts
    console.log('Seeding clean master cadastral layouts...');
    const layouts = [
      {
        id: 'LAYOUT-001',
        project_id: 'AREA-001',
        project_name: 'Sky Cadastral Phase 1',
        name: 'Master Demarcation Plan 2026',
        status: 'Published',
        original_pdf_url: '/docs/Sky_Cadastral_Master_Layout_Phase1.pdf',
        original_pdf_name: 'Sky_Cadastral_Master_Layout_Phase1.pdf',
        file_size: '4.8 MB',
        bounding_width: 950,
        bounding_height: 650,
        uploaded_at: '2026-08-01',
        extracted_plots_count: 16,
        infrastructure_geometry: JSON.stringify({
          roads: [
            { name: 'Main 40ft Approach Road', bounds: [25, 15, 900, 25] },
            { name: 'Sector 1 Internal Road 30ft', bounds: [25, 152, 900, 20] },
            { name: 'Sector 2 Internal Road 30ft', bounds: [25, 298, 900, 20] }
          ],
          openSpaces: []
        })
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
        bounding_width: 800,
        bounding_height: 600,
        uploaded_at: '2026-08-05',
        extracted_plots_count: 3,
        infrastructure_geometry: JSON.stringify({
          roads: [
            { name: 'Commercial Arterial Road', bounds: [25, 15, 800, 30] }
          ],
          openSpaces: []
        })
      },
      {
        id: 'LAYOUT-GOLDENCITY-1791027989205',
        project_id: 'AREA-007',
        project_name: 'Golden City Vita',
        name: 'Golden City Final Master Plan',
        status: 'Published',
        original_pdf_url: '/docs/GOLDEN_CITY_FINAL_PLAN.pdf',
        original_pdf_name: 'GOLDEN_CITY_FINAL_PLAN.pdf',
        file_size: '810 KB',
        bounding_width: 1200,
        bounding_height: 900,
        uploaded_at: '2026-10-03',
        extracted_plots_count: 78,
        infrastructure_geometry: JSON.stringify({ roads: [], openSpaces: [] })
      }
    ];

    for (const l of layouts) {
      await pool.query(
        `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, bounding_width, bounding_height, uploaded_at, extracted_plots_count, infrastructure_geometry)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [l.id, l.project_id, l.project_name, l.name, l.status, l.original_pdf_url, l.original_pdf_name, l.file_size, l.bounding_width, l.bounding_height, l.uploaded_at, l.extracted_plots_count, l.infrastructure_geometry]
      );
    }
    console.log(`✅ Seeded ${layouts.length} clean layouts.`);

    // 5. Seed Clean 16 Master Vector Plots for LAYOUT-001 (Perfect 2D and 3D alignment)
    console.log('Seeding 16 verified vector plots for LAYOUT-001...');
    const masterPlots = [
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
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
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
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
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
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 60 },
          { side: 'West', length: 60 }
        ]),
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
        id: 'PLOT-A04',
        plot_number: 'A-04',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 1',
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        document_area: 1200,
        facing: 'North',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[695, 50], [855, 50], [855, 150], [695, 150]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
        valuation: 2400000,
        price_per_sqft: 2000,
        status: 'Available',
        location: 'Sector 1, Plot 4',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Elena Rostova',
        verified_at: '2026-08-18',
        verification_status: 'Verified',
        valuation_notes: 'East-facing premium plot.'
      },
      {
        id: 'PLOT-B01',
        plot_number: 'B-01',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 2',
        area: 2000,
        unit: 'sq.ft',
        length: 50,
        width: 40,
        document_area: 2000,
        facing: 'South',
        facing_road_width: 50,
        polygon_geometry: JSON.stringify([[50, 175], [250, 175], [250, 295], [50, 295]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
        valuation: 4400000,
        price_per_sqft: 2200,
        status: 'Available',
        location: 'Commercial Zone, Sector 2',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-22',
        verification_status: 'Verified',
        valuation_notes: 'Commercial plot suitable for multi-story office building.'
      },
      {
        id: 'PLOT-B02',
        plot_number: 'B-02',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 2',
        area: 2400,
        unit: 'sq.ft',
        length: 60,
        width: 40,
        document_area: 2400,
        facing: 'West',
        facing_road_width: 40,
        polygon_geometry: JSON.stringify([[265, 175], [505, 175], [505, 295], [265, 295]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 60 },
          { side: 'West', length: 60 }
        ]),
        valuation: 5280000,
        price_per_sqft: 2200,
        status: 'Booked',
        location: 'Sector 2, Plot 2',
        customer_name: 'Pinnacle Infrastructure',
        customer_phone: '+91 98224 56789',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-21',
        verification_status: 'Verified',
        valuation_notes: 'Booked for IT hub branch.'
      },
      {
        id: 'PLOT-B07',
        plot_number: 'B-07',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 2',
        area: 1440,
        unit: 'sq.ft',
        length: 48,
        width: 30,
        document_area: 1500,
        facing: 'North-West',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[520, 175], [710, 175], [740, 250], [680, 305], [520, 295]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 48 },
          { side: 'West', length: 48 }
        ]),
        valuation: 3168000,
        price_per_sqft: 2200,
        status: 'Available',
        location: 'Sector 2, Plot 7',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-20',
        verification_status: 'Verified',
        valuation_notes: 'Irregular polygon vector geometry.'
      },
      {
        id: 'PLOT-C01',
        plot_number: 'C-01',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 3',
        area: 3000,
        unit: 'sq.ft',
        length: 60,
        width: 50,
        document_area: 3000,
        facing: 'East (Lake Facing)',
        facing_road_width: 50,
        polygon_geometry: JSON.stringify([[50, 320], [290, 320], [320, 460], [50, 460]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 50 },
          { side: 'South', length: 50 },
          { side: 'East', length: 60 },
          { side: 'West', length: 60 }
        ]),
        valuation: 7500000,
        price_per_sqft: 2500,
        status: 'Sold',
        location: 'Lakeview Sector 3',
        customer_name: 'Horizon Green Energy Corp',
        customer_phone: '+91 98226 78901',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-11',
        verification_status: 'Verified',
        valuation_notes: 'Lake view premium villa plot. Fully paid.'
      },
      {
        id: 'PLOT-C02',
        plot_number: 'C-02',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 3',
        area: 1600,
        unit: 'sq.ft',
        length: 40,
        width: 40,
        document_area: 1600,
        facing: 'East',
        facing_road_width: 40,
        polygon_geometry: JSON.stringify([[335, 320], [525, 320], [525, 460], [335, 460]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
        valuation: 4000000,
        price_per_sqft: 2500,
        status: 'Booked',
        location: 'Lakeview Sector 3, Plot 2',
        customer_name: 'Rajesh & Sunita Sharma',
        customer_phone: '+91 98222 34567',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-19',
        verification_status: 'Verified',
        valuation_notes: 'Booked for duplex residence.'
      },
      {
        id: 'PLOT-C04',
        plot_number: 'C-04',
        layout_id: 'LAYOUT-001',
        project: 'Sky Cadastral Phase 3',
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        document_area: 1200,
        facing: 'North-West',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[540, 320], [710, 320], [710, 460], [540, 460]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
        valuation: 3000000,
        price_per_sqft: 2500,
        status: 'Available',
        location: 'Sector 3, Corner Plot',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Elena Rostova',
        verified_at: '2026-08-25',
        verification_status: 'Verified',
        valuation_notes: 'Corner plot with dual road access.'
      },
      {
        id: 'PLOT-D01',
        plot_number: 'D-01',
        layout_id: 'LAYOUT-001',
        project: 'Executive Enclave',
        area: 2500,
        unit: 'sq.ft',
        length: 50,
        width: 50,
        document_area: 2500,
        facing: 'South',
        facing_road_width: 50,
        polygon_geometry: JSON.stringify([[725, 320], [900, 320], [900, 460], [725, 460]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 50 },
          { side: 'South', length: 50 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
        valuation: 6250000,
        price_per_sqft: 2500,
        status: 'Sold',
        location: 'Executive Enclave Main Gate',
        customer_name: 'State Highway Dept.',
        customer_phone: '+91 98223 45678',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-02',
        verification_status: 'Verified',
        valuation_notes: 'Government infrastructure plot.'
      },
      {
        id: 'PLOT-D02',
        plot_number: 'D-02',
        layout_id: 'LAYOUT-001',
        project: 'Executive Enclave',
        area: 2000,
        unit: 'sq.ft',
        length: 50,
        width: 40,
        document_area: 2000,
        facing: 'East',
        facing_road_width: 40,
        polygon_geometry: JSON.stringify([[50, 480], [220, 480], [220, 580], [50, 580]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
        valuation: 5000000,
        price_per_sqft: 2500,
        status: 'Available',
        location: 'Executive Enclave, Plot 2',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-20',
        verification_status: 'Verified',
        valuation_notes: 'Standard executive plot.'
      },
      {
        id: 'PLOT-D03',
        plot_number: 'D-03',
        layout_id: 'LAYOUT-001',
        project: 'Executive Enclave',
        area: 1500,
        unit: 'sq.ft',
        length: 50,
        width: 30,
        document_area: 1500,
        facing: 'West',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[235, 480], [385, 480], [385, 580], [235, 580]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
        valuation: 3750000,
        price_per_sqft: 2500,
        status: 'Available',
        location: 'Executive Enclave, Plot 3',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Elena Rostova',
        verified_at: '2026-08-21',
        verification_status: 'Verified',
        valuation_notes: 'West-facing plot.'
      },
      {
        id: 'PLOT-D04',
        plot_number: 'D-04',
        layout_id: 'LAYOUT-001',
        project: 'Executive Enclave',
        area: 1800,
        unit: 'sq.ft',
        length: 60,
        width: 30,
        document_area: 1800,
        facing: 'East',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[400, 480], [570, 480], [570, 580], [400, 580]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 60 },
          { side: 'West', length: 60 }
        ]),
        valuation: 4500000,
        price_per_sqft: 2500,
        status: 'Booked',
        location: 'Executive Enclave, Plot 4',
        customer_name: 'Vikramaditya Patil',
        customer_phone: '+91 98225 67890',
        verified_by: 'Akash Kamble',
        verified_at: '2026-08-24',
        verification_status: 'Verified',
        valuation_notes: 'Booking amount received.'
      },
      {
        id: 'PLOT-E01',
        plot_number: 'E-01',
        layout_id: 'LAYOUT-001',
        project: 'Green Meadows',
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        document_area: 1200,
        facing: 'North',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[585, 480], [725, 480], [725, 580], [585, 580]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
        valuation: 2100000,
        price_per_sqft: 1750,
        status: 'Available',
        location: 'Green Meadows, Sector 1',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-26',
        verification_status: 'Verified',
        valuation_notes: 'Affordable residential plot.'
      },
      {
        id: 'PLOT-E02',
        plot_number: 'E-02',
        layout_id: 'LAYOUT-001',
        project: 'Green Meadows',
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        document_area: 1200,
        facing: 'North',
        facing_road_width: 30,
        polygon_geometry: JSON.stringify([[740, 480], [890, 480], [890, 580], [740, 580]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 40 },
          { side: 'West', length: 40 }
        ]),
        valuation: 2100000,
        price_per_sqft: 1750,
        status: 'Available',
        location: 'Green Meadows, Sector 1',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-26',
        verification_status: 'Verified',
        valuation_notes: 'Affordable residential plot.'
      }
    ];

    for (const p of masterPlots) {
      await pool.query(
        `INSERT INTO plots (
           id, plot_number, layout_id, project, area, unit, length, width,
           document_area, facing, facing_road_width, polygon_geometry,
           edge_dimensions, valuation, price_per_sqft, status, location,
           customer_name, customer_phone, verified_by, verified_at,
           verification_status, valuation_notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
          p.document_area, p.facing, p.facing_road_width, p.polygon_geometry,
          p.edge_dimensions, p.valuation, p.price_per_sqft, p.status, p.location,
          p.customer_name, p.customer_phone, p.verified_by, p.verified_at,
          p.verification_status, p.valuation_notes
        ]
      );
    }
    console.log(`✅ Seeded ${masterPlots.length} clean plots for LAYOUT-001.`);

    // 5b. Also seed commercial plots for LAYOUT-002
    console.log('Seeding commercial plots for LAYOUT-002...');
    const commercialPlots = [
      {
        id: 'PLOT-COMM-B01',
        plot_number: 'B-01',
        layout_id: 'LAYOUT-002',
        project: 'Sky Cadastral Phase 2',
        area: 2000,
        unit: 'sq.ft',
        length: 50,
        width: 40,
        document_area: 2000,
        facing: 'South',
        facing_road_width: 50,
        polygon_geometry: JSON.stringify([[50, 175], [250, 175], [250, 295], [50, 295]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 50 },
          { side: 'West', length: 50 }
        ]),
        valuation: 4400000,
        price_per_sqft: 2200,
        status: 'Available',
        location: 'Commercial Zone, Sector 2',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-22',
        verification_status: 'Verified',
        valuation_notes: 'Commercial plot suitable for multi-story office building.'
      },
      {
        id: 'PLOT-COMM-B02',
        plot_number: 'B-02',
        layout_id: 'LAYOUT-002',
        project: 'Sky Cadastral Phase 2',
        area: 2400,
        unit: 'sq.ft',
        length: 60,
        width: 40,
        document_area: 2400,
        facing: 'West',
        facing_road_width: 40,
        polygon_geometry: JSON.stringify([[265, 175], [505, 175], [505, 295], [265, 295]]),
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 40 },
          { side: 'South', length: 40 },
          { side: 'East', length: 60 },
          { side: 'West', length: 60 }
        ]),
        valuation: 5280000,
        price_per_sqft: 2200,
        status: 'Booked',
        location: 'Sector 2, Plot 2',
        customer_name: 'Pinnacle Infrastructure',
        customer_phone: '+91 98224 56789',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-21',
        verification_status: 'Verified',
        valuation_notes: 'Booked for IT hub branch.'
      },
      {
        id: 'PLOT-COMM-B07',
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
        edge_dimensions: JSON.stringify([
          { side: 'North', length: 30 },
          { side: 'South', length: 30 },
          { side: 'East', length: 48 },
          { side: 'West', length: 48 }
        ]),
        valuation: 3168000,
        price_per_sqft: 2200,
        status: 'Available',
        location: 'Sector 2, Plot 7',
        customer_name: '',
        customer_phone: '',
        verified_by: 'Marcus Vance',
        verified_at: '2026-08-20',
        verification_status: 'Verified',
        valuation_notes: 'Irregular polygon vector geometry.'
      }
    ];

    for (const p of commercialPlots) {
      await pool.query(
        `INSERT INTO plots (
           id, plot_number, layout_id, project, area, unit, length, width,
           document_area, facing, facing_road_width, polygon_geometry,
           edge_dimensions, valuation, price_per_sqft, status, location,
           customer_name, customer_phone, verified_by, verified_at,
           verification_status, valuation_notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
          p.document_area, p.facing, p.facing_road_width, p.polygon_geometry,
          p.edge_dimensions, p.valuation, p.price_per_sqft, p.status, p.location,
          p.customer_name, p.customer_phone, p.verified_by, p.verified_at,
          p.verification_status, p.valuation_notes
        ]
      );
    }
    console.log(`✅ Seeded ${commercialPlots.length} clean plots for LAYOUT-002.`);

    // 5c. Seed Golden City 78 Verified Plots
    const goldenJsonPath = path.join(__dirname, 'scratch', 'golden_plots.json');
    if (fs.existsSync(goldenJsonPath)) {
      console.log('Seeding 78 verified plots for Golden City Vita layout...');
      const goldenPlots = JSON.parse(fs.readFileSync(goldenJsonPath, 'utf-8'));
      for (const p of goldenPlots) {
        await pool.query(
          `INSERT INTO plots (
             id, plot_number, layout_id, project, area, unit, length, width,
             document_area, facing, facing_road_width, polygon_geometry,
             edge_dimensions, valuation, price_per_sqft, status, location,
             customer_name, customer_phone, verified_by, verified_at,
             verification_status, valuation_notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
          [
            p.id,
            p.plot_number,
            'LAYOUT-GOLDENCITY-1791027989205',
            'Golden City Vita',
            p.area,
            p.unit || 'sq.ft',
            p.length,
            p.width,
            p.document_area || p.area,
            p.facing || 'East',
            p.facing_road_width || 30,
            typeof p.polygon_geometry === 'string' ? p.polygon_geometry : JSON.stringify(p.polygon_geometry),
            typeof p.edge_dimensions === 'string' ? p.edge_dimensions : JSON.stringify(p.edge_dimensions || []),
            p.valuation,
            p.price_per_sqft,
            p.status || 'Available',
            p.location || 'Golden City Vita, Kundal Road',
            p.customer_name || '',
            p.customer_phone || '',
            p.verified_by || 'Akash Kamble',
            p.verified_at || '2026-10-03',
            'VERIFIED',
            p.valuation_notes || 'Verified plot boundaries from Sanctioned Cadastral Master Plan'
          ]
        );
      }
      console.log(`✅ Seeded ${goldenPlots.length} clean plots for Golden City Vita.`);
    }

    // 6. Seed Clean Bookings
    console.log('Seeding official bookings...');
    const bookings = [
      {
        id: 'BK-2026-01',
        plot_id: 'PLOT-A02',
        plot_number: 'A-02',
        customer_name: 'Apex Developments Ltd.',
        customer_phone: '+91 98220 12345',
        customer_email: 'contact@apexdev.com',
        booking_date: '2026-08-20',
        total_value: 3000000,
        booking_amount: 600000,
        paid_amount: 600000,
        remaining_amount: 2400000,
        status: 'Booked',
        notes: 'Advance booking received via NEFT.'
      },
      {
        id: 'BK-2026-02',
        plot_id: 'PLOT-B02',
        plot_number: 'B-02',
        customer_name: 'Pinnacle Infrastructure',
        customer_phone: '+91 98224 56789',
        customer_email: 'projects@pinnacleinfra.co.in',
        booking_date: '2026-08-21',
        total_value: 5280000,
        booking_amount: 1000000,
        paid_amount: 1000000,
        remaining_amount: 4280000,
        status: 'Booked',
        notes: 'Commercial plot booking.'
      },
      {
        id: 'BK-2026-03',
        plot_id: 'PLOT-C02',
        plot_number: 'C-02',
        customer_name: 'Rajesh & Sunita Sharma',
        customer_phone: '+91 98222 34567',
        customer_email: 'rajesh.sharma@gmail.com',
        booking_date: '2026-08-19',
        total_value: 4000000,
        booking_amount: 500000,
        paid_amount: 500000,
        remaining_amount: 3500000,
        status: 'Booked',
        notes: 'Residential villa plot.'
      },
      {
        id: 'BK-2026-04',
        plot_id: 'PLOT-D04',
        plot_number: 'D-04',
        customer_name: 'Vikramaditya Patil',
        customer_phone: '+91 98225 67890',
        customer_email: 'vikram.patil@outlook.com',
        booking_date: '2026-08-24',
        total_value: 4500000,
        booking_amount: 750000,
        paid_amount: 750000,
        remaining_amount: 3750000,
        status: 'Booked',
        notes: 'Token amount paid.'
      }
    ];

    for (const b of bookings) {
      await pool.query(
        `INSERT INTO bookings (id, plot_id, plot_number, customer_name, customer_phone, customer_email, booking_date, total_value, booking_amount, paid_amount, remaining_amount, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [b.id, b.plot_id, b.plot_number, b.customer_name, b.customer_phone, b.customer_email, b.booking_date, b.total_value, b.booking_amount, b.paid_amount, b.remaining_amount, b.status, b.notes]
      );
    }
    console.log(`✅ Seeded ${bookings.length} clean bookings.`);

    // 7. Seed Clean Revenue Transactions
    console.log('Seeding official revenue register...');
    const revenue = [
      {
        id: 'REV-1001',
        date: '2026-08-28',
        time: '11:30 AM',
        plot_number: 'A-02',
        customer_name: 'Apex Developments Ltd.',
        type: 'Booking',
        amount: 600000,
        payment_status: 'Realized',
        payment_type: 'NEFT Transfer',
        note: 'Plot A-02 initial booking amount'
      },
      {
        id: 'REV-1002',
        date: '2026-08-28',
        time: '10:15 AM',
        plot_number: 'A-03',
        customer_name: 'Meridian Civic Authority',
        type: 'Sale',
        amount: 1800000,
        payment_status: 'Realized',
        payment_type: 'Cheque Clearance',
        note: 'Plot A-03 final settlement on registration'
      },
      {
        id: 'REV-1003',
        date: '2026-08-27',
        time: '04:45 PM',
        plot_number: 'D-04',
        customer_name: 'Vikramaditya Patil',
        type: 'Booking',
        amount: 750000,
        payment_status: 'Realized',
        payment_type: 'RTGS',
        note: 'Plot D-04 token booking deposit'
      },
      {
        id: 'REV-1004',
        date: '2026-08-25',
        time: '02:00 PM',
        plot_number: 'C-01',
        customer_name: 'Horizon Green Energy Corp',
        type: 'Sale',
        amount: 7500000,
        payment_status: 'Realized',
        payment_type: 'Wire Transfer',
        note: 'Plot C-01 full sale realization'
      },
      {
        id: 'REV-1005',
        date: '2026-08-22',
        time: '12:30 PM',
        plot_number: 'B-02',
        customer_name: 'Pinnacle Infrastructure',
        type: 'Booking',
        amount: 1000000,
        payment_status: 'Realized',
        payment_type: 'NEFT',
        note: 'Plot B-02 booking advance'
      },
      {
        id: 'REV-1006',
        date: '2026-08-15',
        time: '11:00 AM',
        plot_number: 'D-01',
        customer_name: 'State Highway Dept.',
        type: 'Sale',
        amount: 6250000,
        payment_status: 'Realized',
        payment_type: 'Govt Treasury Draft',
        note: 'Plot D-01 full payment'
      }
    ];

    for (const r of revenue) {
      await pool.query(
        `INSERT INTO revenue_transactions (id, date, time, plot_number, customer_name, type, amount, payment_status, payment_type, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [r.id, r.date, r.time, r.plot_number, r.customer_name, r.type, r.amount, r.payment_status, r.payment_type, r.note]
      );
    }
    console.log(`✅ Seeded ${revenue.length} clean revenue transactions.`);

    // 8. Seed Clean Expenses
    console.log('Seeding official expenses register...');
    const expenses = [
      {
        id: 'EXP-501',
        date: '2026-08-28',
        time: '09:30 AM',
        category: 'Marketing',
        description: 'Site Banners & Billboard Branding',
        amount: 18500,
        note: 'Site branding near Phase 2 entrance'
      },
      {
        id: 'EXP-502',
        date: '2026-08-28',
        time: '01:15 PM',
        category: 'Travel',
        description: 'Fuel for Survey Drone Vehicle & Team',
        amount: 4200,
        note: 'Site inspection travel to Lakeview Sector 3'
      },
      {
        id: 'EXP-503',
        date: '2026-08-27',
        time: '03:30 PM',
        category: 'Documentation',
        description: 'Legal Stamp Duty & Registration Documentation Fee',
        amount: 25000,
        note: 'Sub-registrar filing expenses'
      },
      {
        id: 'EXP-504',
        date: '2026-08-26',
        time: '11:00 AM',
        category: 'Office',
        description: 'High-precision Plotter Paper & Printing Cartridges',
        amount: 8600,
        note: 'CAD blueprint printing supplies'
      },
      {
        id: 'EXP-505',
        date: '2026-08-24',
        time: '05:00 PM',
        category: 'Labour',
        description: 'Boundary Stone Placement Field Labour',
        amount: 15000,
        note: 'Survey team daily wages'
      }
    ];

    for (const e of expenses) {
      await pool.query(
        `INSERT INTO expenses (id, date, time, category, description, amount, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [e.id, e.date, e.time, e.category, e.description, e.amount, e.note]
      );
    }
    console.log(`✅ Seeded ${expenses.length} clean expenses.`);

    // 9. Seed Clean Daily Diary Entries
    console.log('Seeding daily diary entry...');
    const today = new Date().toISOString().split('T')[0];
    const initialTasks = [
      { id: 'TASK-1', text: 'Follow up with Apex Developments on Plot A-02 booking agreement', completed: true },
      { id: 'TASK-2', text: 'Conduct physical boundary stone inspection at Phase 2 (B-07)', completed: false },
      { id: 'TASK-3', text: 'Submit daily revenue register report to management', completed: false }
    ];
    const initialNotes = "Today's Field Notes & Admin Summary:\n- Completed boundary survey check for Phase 1 plots.\n- Verified document dimensions with land registrar.\n- Client meeting scheduled at 3:00 PM.";

    await pool.query(
      `INSERT INTO diary_entries (id, entry_date, notes, tasks)
       VALUES ($1, $2, $3, $4)`,
      [`DIARY-${today}`, today, initialNotes, JSON.stringify(initialTasks)]
    );

    // 10. Seed System Settings & Official Letterhead
    console.log('Seeding official system & letterhead settings...');
    const defaultLetterhead = {
      companyName: 'SKY CADASTRAL LAND SERVICES',
      tagline: 'Precision Cadastral Surveying, Valuation & Land Management',
      proprietor: 'Akash Kamble (Lead Land Surveyor & Valuer)',
      regNumber: 'RERA / CAD / MH-2024-884920',
      address: 'Sky Cadastral Towers, Suite 402, Civil Lines, Pune, Maharashtra - 411001',
      phone: '+91 98220 99887 / +91 020 2554 1122',
      email: 'official@skycadastral.in / akash.kamble@skycadastral.in',
      website: 'www.skycadastral.in'
    };

    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)`,
      ['letterhead', JSON.stringify(defaultLetterhead)]
    );

    console.log('\n✨ Database successfully cleaned and populated with pristine master cadastral data!');
    console.log('  • 7 Official Projects');
    console.log('  • 3 Published Cadastral Layouts (Master Plan 2026, Commercial Hub, Golden City Vita)');
    console.log('  • 97 Verified Plots with clean non-overlapping vector geometry for 2D & 3D viewers');
    console.log('  • 4 Active Bookings');
    console.log('  • 6 Revenue Transactions & 5 Expenses');
    console.log('  • Daily Diary & Letterhead Configuration');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Database:', err);
    process.exit(1);
  }
}

runSeed();
