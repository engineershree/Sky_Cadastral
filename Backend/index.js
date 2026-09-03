import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { pool, query } from './db.js';
import { parseCadastralPdf } from './pdf_parser.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

app.use(cors());
app.use(express.json());

// 1. Health Check Endpoint & Neon DB Verification
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await query('SELECT NOW(), current_database(), version()');
    const layoutCount = await query('SELECT COUNT(*) FROM layouts');
    const plotCount = await query('SELECT COUNT(*) FROM plots');

    res.json({
      status: 'online',
      database: 'Neon PostgreSQL Connected',
      databaseName: dbRes.rows[0].current_database,
      dbTimestamp: dbRes.rows[0].now,
      counts: {
        layouts: Number(layoutCount.rows[0].count),
        plots: Number(plotCount.rows[0].count)
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Auth API Endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (
    (cleanEmail === 'admin@skycadastral.in' || cleanEmail === 'admin') &&
    cleanPassword === 'admin123'
  ) {
    return res.json({
      success: true,
      user: {
        name: 'Akash Kamble',
        role: 'Lead Land Surveyor & Valuer',
        email: 'admin@skycadastral.in'
      },
      token: 'jwt_demo_token_sky_cadastral_2026'
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid email or password' });
});

app.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});


// 2. POST /api/layouts/upload - Upload PDF Layout & Extract Plots into Neon DB
app.post('/api/layouts/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    const { projectId, projectName, layoutName } = req.body;
    let pdfBuffer;

    if (req.file) {
      pdfBuffer = req.file.buffer;
    } else if (req.body.pdfPath) {
      pdfBuffer = req.body.pdfPath;
    } else {
      // Use generated sample layout PDF if no file uploaded in body
      pdfBuffer = './sample_cadastral_layout.pdf';
    }

    // 1. Run Real PDF Parsing & Vector/OCR Extraction
    const extractionResult = await parseCadastralPdf(pdfBuffer);

    const layoutId = `LAYOUT-${Date.now()}`;
    const name = layoutName || req.file?.originalname || 'Master Demarcation PDF';
    const pdfFileName = req.file?.originalname || 'sample_cadastral_layout.pdf';
    const fileSizeStr = req.file ? `${(req.file.size / (1024 * 1024)).toFixed(1)} MB` : '2.4 MB';

    // 2. Insert Layout Record into Neon DB
    const layoutRes = await query(
      `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, extracted_plots_count, uploaded_at)
       VALUES ($1, $2, $3, $4, 'Needs Verification', $5, $6, $7, $8, CURRENT_DATE) RETURNING *`,
      [layoutId, projectId || 'AREA-001', projectName || 'Sky Cadastral Phase 1', name, `/docs/${pdfFileName}`, pdfFileName, fileSizeStr, extractionResult.extractedPlotsCount]
    );

    // 3. Insert Extracted Plots into Neon DB
    const insertedPlots = [];
    for (const plotData of extractionResult.plots) {
      const plotId = `PLOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const plotRes = await query(
        `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, verification_status, valuation_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        [
          plotId,
          plotData.plotNumber,
          layoutId,
          projectName || 'Sky Cadastral Phase 1',
          plotData.area,
          plotData.unit,
          plotData.length,
          plotData.width,
          plotData.documentArea,
          plotData.facing,
          plotData.facingRoadWidth,
          JSON.stringify(plotData.polygonGeometry),
          plotData.valuation,
          plotData.pricePerSqFt,
          plotData.status,
          `${projectName || 'Sky Cadastral'}, Sector 1`,
          plotData.verificationStatus,
          plotData.valuationNotes
        ]
      );
      insertedPlots.push(plotRes.rows[0]);
    }

    res.json({
      success: true,
      message: `PDF parsed & ${insertedPlots.length} plots extracted and saved to Neon DB`,
      pdfMetadata: {
        pageCount: extractionResult.pageCount,
        textParsedLength: extractionResult.textLength
      },
      diagnostics: extractionResult.diagnostics,
      layout: layoutRes.rows[0],
      extractedPlots: insertedPlots
    });
  } catch (err) {
    console.error('❌ PDF Upload/Parsing Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ============================================================================
// HIGH-ACCURACY CADASTRAL EXTRACTION & VERIFICATION ENDPOINTS
// ============================================================================

// POST /api/cadastral/parse-pdf - Geometry-First Vector Cadastral Extraction Pipeline
app.post('/api/cadastral/parse-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    let pdfInput;
    if (req.file) {
      pdfInput = req.file.buffer;
    } else if (req.body.pdfPath) {
      pdfInput = req.body.pdfPath;
    } else {
      pdfInput = './GOLDEN  CITY FINAL PLAN Model.pdf';
    }

    const extractionResult = await parseCadastralPdf(pdfInput);
    res.json({
      success: true,
      forensicReport: extractionResult.forensicReport,
      officialTableMap: extractionResult.officialTableMap,
      plots: extractionResult.plots,
      unmatchedPolygons: extractionResult.unmatchedPolygons
    });
  } catch (err) {
    console.error('❌ Cadastral Extraction Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cadastral/save-verified-layout - Save Verified Plots & Layout to Database
app.post('/api/cadastral/save-verified-layout', async (req, res) => {
  try {
    const { layoutId, projectId, projectName, name, plots, forensicReport } = req.body;
    const targetLayoutId = layoutId || `LAYOUT-${Date.now()}`;

    // 1. Upsert Layout Record
    const layoutRes = await query(
      `INSERT INTO layouts (id, project_id, project_name, name, status, extracted_plots_count, uploaded_at)
       VALUES ($1, $2, $3, $4, 'Needs Verification', $5, CURRENT_DATE)
       ON CONFLICT (id) DO UPDATE 
       SET extracted_plots_count = EXCLUDED.extracted_plots_count, status = 'Needs Verification'
       RETURNING *`,
      [targetLayoutId, projectId || 'AREA-001', projectName || 'Golden City Vita Layout', name || 'Golden City Final Plan', plots.length]
    );

    // 2. Delete existing plots for layout if updating
    await query('DELETE FROM plots WHERE layout_id = $1', [targetLayoutId]);

    // 3. Insert Verified Plot Records
    const savedPlots = [];
    for (const p of plots) {
      const plotDbId = `PLOT-${targetLayoutId}-${p.plotNumber}`;
      const plotRes = await query(
        `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, verification_status, valuation_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        [
          plotDbId,
          p.plotNumber,
          targetLayoutId,
          projectName || 'Golden City Vita Layout',
          p.officialAreaSqft || p.area || 1000,
          'sq.ft',
          p.length || 50,
          p.width || 30,
          p.officialAreaSqft || p.documentArea || 1000,
          p.facing || 'North',
          p.facingRoadWidth || 40,
          JSON.stringify(p.polygonGeometry),
          p.valuation || 2500000,
          p.pricePerSqFt || 2200,
          p.status || 'Available',
          'Golden City Vita, Sector 1',
          p.verificationStatus || 'Verified',
          p.valuationNotes || 'Verified Cadastral Vector Polygon'
        ]
      );
      savedPlots.push(plotRes.rows[0]);
    }

    res.json({
      success: true,
      layout: layoutRes.rows[0],
      savedPlotsCount: savedPlots.length,
      forensicReport
    });
  } catch (err) {
    console.error('❌ Save Verified Layout Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/cadastral/publish-layout - Enforce Strict Publishing Rules
app.post('/api/cadastral/publish-layout', async (req, res) => {
  try {
    const { layoutId, forensicReport } = req.body;

    // Strict Publishing Rules Check
    if (forensicReport) {
      if (forensicReport.missingPlotIdsInSource && forensicReport.missingPlotIdsInSource.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Publishing blocked: ${forensicReport.missingPlotIdsInSource.length} plots are missing from map geometry association (Plot IDs: ${forensicReport.missingPlotIdsInSource.join(', ')})`
        });
      }
      if (forensicReport.duplicateIdsFound && forensicReport.duplicateIdsFound.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Publishing blocked: Duplicate plot IDs detected (${forensicReport.duplicateIdsFound.join(', ')})`
        });
      }
      if (forensicReport.geometryMismatchCount && forensicReport.geometryMismatchCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Publishing blocked: ${forensicReport.geometryMismatchCount} plots have geometry vs table area mismatches exceeding tolerance.`
        });
      }
    }

    // Check DB plots verification status for layout
    const unverifiedPlots = await query(
      `SELECT plot_number, verification_status FROM plots WHERE layout_id = $1 AND verification_status != 'Verified'`,
      [layoutId]
    );

    if (unverifiedPlots.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Publishing blocked: ${unverifiedPlots.rows.length} plots are unverified or mismatched. Human admin approval required.`,
        unverifiedPlots: unverifiedPlots.rows
      });
    }

    // Update layout status to Published
    const updateRes = await query(
      `UPDATE layouts SET status = 'Published' WHERE id = $1 RETURNING *`,
      [layoutId]
    );

    res.json({
      success: true,
      message: 'Layout successfully published to 2D & 3D client platforms!',
      layout: updateRes.rows[0]
    });
  } catch (err) {
    console.error('❌ Publish Layout Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// 2. GET /api/layouts - List all Cadastral Layout Plans
app.get('/api/layouts', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM layouts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/plots - List all Plots
app.get('/api/plots', async (req, res) => {
  try {
    const { layoutId } = req.query;
    let text = 'SELECT * FROM plots ORDER BY plot_number ASC';
    let params = [];
    if (layoutId) {
      text = 'SELECT * FROM plots WHERE layout_id = $1 ORDER BY plot_number ASC';
      params = [layoutId];
    }
    const { rows } = await query(text, params);
    
    // Map snake_case DB fields to camelCase frontend expectations
    const mapped = rows.map((r) => ({
      id: r.id,
      plotNumber: r.plot_number,
      layoutId: r.layout_id,
      project: r.project,
      area: Number(r.area),
      unit: r.unit,
      length: Number(r.length),
      width: Number(r.width),
      documentArea: Number(r.document_area),
      facing: r.facing,
      facingRoadWidth: Number(r.facing_road_width),
      polygonGeometry: typeof r.polygon_geometry === 'string' ? JSON.parse(r.polygon_geometry) : r.polygon_geometry,
      valuation: Number(r.valuation),
      pricePerSqFt: Number(r.price_per_sqft),
      status: r.status,
      location: r.location,
      customerName: r.customer_name || '',
      customerPhone: r.customer_phone || '',
      verifiedBy: r.verified_by || '',
      verifiedAt: r.verified_at || '',
      verificationStatus: r.verification_status,
      valuationNotes: r.valuation_notes || '',
      documents: typeof r.documents === 'string' ? JSON.parse(r.documents) : r.documents || []
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/plots/:id/geometry - Update Vector Polygon Vertices
app.put('/api/plots/:id/geometry', async (req, res) => {
  try {
    const { id } = req.params;
    const { polygonGeometry, area, verifiedBy } = req.body;

    const plotRes = await query('SELECT * FROM plots WHERE id = $1', [id]);
    if (plotRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plot not found' });
    }

    const oldPlot = plotRes.rows[0];
    const newGeomStr = JSON.stringify(polygonGeometry);

    // Update Plot in Neon DB
    const updateRes = await query(
      `UPDATE plots 
       SET polygon_geometry = $1, area = $2, verification_status = 'Verified', verified_by = $3, verified_at = CURRENT_DATE
       WHERE id = $4 RETURNING *`,
      [newGeomStr, area, verifiedBy || 'Akash Kamble', id]
    );

    // Audit Log
    await query(
      `INSERT INTO plot_audit_logs (plot_id, plot_number, field_changed, old_value, new_value, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, oldPlot.plot_number, 'polygon_geometry', JSON.stringify(oldPlot.polygon_geometry), newGeomStr, verifiedBy || 'Akash Kamble']
    );

    res.json({ success: true, message: 'Plot geometry & area updated in Neon DB', plot: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/layouts/:id/publish - Publish Layout to Portal
app.post('/api/layouts/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE layouts SET status = 'Published' WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json({ success: true, message: 'Layout published to Client Portal', layout: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// DEDICATED CLIENT WEBSITE REST API ENDPOINTS FOR 2D/3D VIEWERS & BOOKING
// =========================================================================

// 6a. GET /api/client/areas - Returns All Real Projects & Layout Areas for Client Portal
app.get('/api/client/areas', async (req, res) => {
  try {
    const projectsRes = await query('SELECT * FROM projects ORDER BY created_at DESC');
    const layoutsRes = await query('SELECT * FROM layouts ORDER BY created_at DESC');
    const plotsCountRes = await query('SELECT layout_id, project, COUNT(*) as count FROM plots GROUP BY layout_id, project');

    const projects = projectsRes.rows;
    const layouts = layoutsRes.rows;
    const plotCounts = plotsCountRes.rows;

    const areasList = projects.map((proj) => {
      const projLayouts = layouts.filter(
        (l) => l.project_id === proj.id || (l.project_name && l.project_name.toLowerCase() === proj.name.toLowerCase())
      );

      const totalPlots = plotCounts
        .filter((c) => (c.project && c.project.toLowerCase() === proj.name.toLowerCase()) || projLayouts.some((l) => l.id === c.layout_id))
        .reduce((sum, c) => sum + Number(c.count), 0);

      const mappedLayouts = projLayouts.map((l) => {
        const lCount = plotCounts.find((c) => c.layout_id === l.id);
        return {
          id: l.id,
          layoutId: l.id,
          name: l.name,
          layoutName: l.name,
          status: l.status || 'Published',
          pdfUrl: l.original_pdf_url || '',
          pdfName: l.original_pdf_name || '',
          fileSize: l.file_size || '',
          boundingWidth: Number(l.bounding_width || 800),
          boundingHeight: Number(l.bounding_height || 600),
          plotCount: lCount ? Number(lCount.count) : Number(l.extracted_plots_count || 0)
        };
      });

      if (mappedLayouts.length === 0) {
        mappedLayouts.push({
          id: proj.id,
          layoutId: proj.id,
          name: `${proj.name} Master Plan`,
          layoutName: `${proj.name} Master Plan`,
          status: 'Published',
          pdfUrl: '',
          pdfName: '',
          fileSize: '',
          boundingWidth: 800,
          boundingHeight: 600,
          plotCount: totalPlots
        });
      }

      return {
        id: proj.id,
        projectId: proj.id,
        layoutId: mappedLayouts[0].id,
        name: proj.name,
        ownerName: proj.owner_name || '',
        address: proj.address || '',
        location: proj.address || '',
        description: proj.description || '',
        status: 'Published',
        pdfUrl: mappedLayouts[0].pdfUrl || '',
        pdfName: mappedLayouts[0].pdfName || '',
        fileSize: mappedLayouts[0].fileSize || '',
        boundingWidth: mappedLayouts[0].boundingWidth || 800,
        boundingHeight: mappedLayouts[0].boundingHeight || 600,
        plotCount: totalPlots || mappedLayouts[0].plotCount || 0,
        layouts: mappedLayouts
      };
    });

    layouts.forEach((l) => {
      const alreadyIncluded = areasList.some((a) => a.layouts && a.layouts.some((ly) => ly.id === l.id));
      if (!alreadyIncluded) {
        const lCount = plotCounts.find((c) => c.layout_id === l.id);
        areasList.push({
          id: l.id,
          layoutId: l.id,
          projectId: l.project_id || l.id,
          name: l.project_name || l.name,
          layoutName: l.name,
          ownerName: '',
          address: '',
          location: '',
          description: '',
          status: l.status || 'Published',
          pdfUrl: l.original_pdf_url || '',
          pdfName: l.original_pdf_name || '',
          fileSize: l.file_size || '',
          boundingWidth: Number(l.bounding_width || 800),
          boundingHeight: Number(l.bounding_height || 600),
          plotCount: lCount ? Number(lCount.count) : Number(l.extracted_plots_count || 0),
          layouts: [{
            id: l.id,
            layoutId: l.id,
            name: l.name,
            layoutName: l.name,
            status: l.status || 'Published',
            pdfUrl: l.original_pdf_url || '',
            pdfName: l.original_pdf_name || '',
            fileSize: l.file_size || '',
            boundingWidth: Number(l.bounding_width || 800),
            boundingHeight: Number(l.bounding_height || 600),
            plotCount: lCount ? Number(lCount.count) : Number(l.extracted_plots_count || 0)
          }]
        });
      }
    });

    res.json({
      success: true,
      count: areasList.length,
      areas: areasList,
      layouts: areasList
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6b. GET /api/client/areas/:areaId - Returns Area Metadata + Bounds + Official PDF Reference
app.get('/api/client/areas/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { rows } = await query(`
      SELECT 
        l.id as layout_id,
        l.name as layout_name,
        l.status as layout_status,
        l.original_pdf_url,
        l.original_pdf_name,
        l.file_size,
        l.bounding_width,
        l.bounding_height,
        l.extracted_plots_count,
        l.uploaded_at,
        p.id as project_id,
        p.name as project_name,
        p.address as project_address,
        p.description as project_description,
        (SELECT COUNT(*) FROM plots WHERE layout_id = l.id) as total_plots_count,
        (SELECT COUNT(*) FROM plots WHERE layout_id = l.id AND (verification_status = 'Verified' OR verification_status IS NULL)) as verified_plots_count
      FROM layouts l
      LEFT JOIN projects p ON l.project_id = p.id
      WHERE l.id = $1 OR l.project_id = $1 OR p.id = $1
      LIMIT 1
    `, [areaId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: `Area/Layout with ID ${areaId} not found` });
    }

    const r = rows[0];
    const area = {
      id: r.layout_id,
      layoutId: r.layout_id,
      projectId: r.project_id || r.layout_id,
      name: r.project_name || r.layout_name,
      layoutName: r.layout_name,
      address: r.project_address || '',
      description: r.project_description || '',
      location: r.project_address || '',
      status: r.layout_status || 'Published',
      pdfUrl: r.original_pdf_url || '',
      pdfName: r.original_pdf_name || '',
      fileSize: r.file_size || '',
      bounds: {
        minX: 0,
        maxX: Number(r.bounding_width || 800),
        minY: 0,
        maxY: Number(r.bounding_height || 600)
      },
      viewCenter: [Number(r.bounding_width || 800) / 2, Number(r.bounding_height || 600) / 2],
      totalPlots: Number(r.total_plots_count || 0),
      verifiedPlotsCount: Number(r.verified_plots_count || 0)
    };

    // Also fetch plots for this area to return complete layout bundle
    const plotsQuery = await query(`
      SELECT 
        p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
        p.document_area, p.facing, p.facing_road_width, p.polygon_geometry, p.valuation,
        p.price_per_sqft, p.status, p.location, p.verification_status
      FROM plots p
      WHERE (p.layout_id = $1 OR p.project = $1 OR EXISTS (SELECT 1 FROM layouts l WHERE l.id = p.layout_id AND (l.id = $1 OR l.project_id = $1)))
      ORDER BY p.plot_number ASC
    `, [r.layout_id]);

    const plots = plotsQuery.rows.map((pr) => {
      const parsedGeom = typeof pr.polygon_geometry === 'string' ? JSON.parse(pr.polygon_geometry) : pr.polygon_geometry;
      return {
        id: pr.id,
        plotNumber: pr.plot_number,
        layoutId: pr.layout_id,
        project: pr.project,
        length: Number(pr.length || 0),
        width: Number(pr.width || 0),
        area: Number(pr.area || 0),
        unit: pr.unit || 'sq.ft',
        documentArea: Number(pr.document_area || pr.area || 0),
        facing: pr.facing || 'East',
        facingRoadWidth: Number(pr.facing_road_width || 30),
        polygonGeometry: parsedGeom,
        coordinates: parsedGeom,
        valuation: Number(pr.valuation || 0),
        pricePerSqFt: Number(pr.price_per_sqft || 0),
        status: pr.status || 'Available',
        location: pr.location || '',
        verificationStatus: pr.verification_status || 'Verified',
        isAvailable: pr.status === 'Available'
      };
    });

    res.json({
      success: true,
      area,
      metadata: area, // Alias for client compatibility
      project: { id: area.projectId, name: area.name, address: area.address },
      plots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6c. GET /api/client/areas/:areaId/plots - Returns Verified/Published Plots for Area
app.get('/api/client/areas/:areaId/plots', async (req, res) => {
  try {
    const { areaId } = req.params;
    const { rows } = await query(`
      SELECT 
        p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
        p.document_area, p.facing, p.facing_road_width, p.polygon_geometry, p.valuation,
        p.price_per_sqft, p.status, p.location, p.verification_status
      FROM plots p
      WHERE (p.layout_id = $1 OR p.project = $1 OR EXISTS (SELECT 1 FROM layouts l WHERE l.id = p.layout_id AND (l.id = $1 OR l.project_id = $1)))
      ORDER BY p.plot_number ASC
    `, [areaId]);

    const clientPlots = rows.map((r) => {
      const parsedGeom = typeof r.polygon_geometry === 'string' ? JSON.parse(r.polygon_geometry) : r.polygon_geometry;
      return {
        id: r.id,
        plotNumber: r.plot_number,
        layoutId: r.layout_id,
        project: r.project,
        length: Number(r.length || 0),
        width: Number(r.width || 0),
        area: Number(r.area || 0),
        unit: r.unit || 'sq.ft',
        documentArea: Number(r.document_area || r.area || 0),
        facing: r.facing || 'East',
        facingRoadWidth: Number(r.facing_road_width || 30),
        polygonGeometry: parsedGeom,
        coordinates: parsedGeom,
        valuation: Number(r.valuation || 0),
        pricePerSqFt: Number(r.price_per_sqft || 0),
        status: r.status || 'Available',
        location: r.location || '',
        verificationStatus: r.verification_status || 'Verified',
        isAvailable: r.status === 'Available'
      };
    });

    res.json({
      success: true,
      areaId,
      totalPlots: clientPlots.length,
      plots: clientPlots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6d. GET /api/client/plots/:plotId - Returns Complete Client-Safe Plot Details
app.get('/api/client/plots/:plotId', async (req, res) => {
  try {
    const { plotId } = req.params;
    const { rows } = await query(`
      SELECT 
        p.id, p.plot_number, p.layout_id, p.project, p.area, p.unit, p.length, p.width,
        p.document_area, p.facing, p.facing_road_width, p.polygon_geometry, p.valuation,
        p.price_per_sqft, p.status, p.location, p.verification_status,
        l.original_pdf_url, l.original_pdf_name
      FROM plots p
      LEFT JOIN layouts l ON p.layout_id = l.id
      WHERE p.id = $1 OR p.plot_number = $1
      LIMIT 1
    `, [plotId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: `Plot with ID ${plotId} not found` });
    }

    const r = rows[0];
    const parsedGeom = typeof r.polygon_geometry === 'string' ? JSON.parse(r.polygon_geometry) : r.polygon_geometry;
    const plot = {
      id: r.id,
      plotNumber: r.plot_number,
      layoutId: r.layout_id,
      project: r.project,
      length: Number(r.length || 0),
      width: Number(r.width || 0),
      area: Number(r.area || 0),
      unit: r.unit || 'sq.ft',
      documentArea: Number(r.document_area || r.area || 0),
      facing: r.facing || 'East',
      facingRoadWidth: Number(r.facing_road_width || 30),
      polygonGeometry: parsedGeom,
      coordinates: parsedGeom,
      valuation: Number(r.valuation || 0),
      pricePerSqFt: Number(r.price_per_sqft || 0),
      status: r.status || 'Available',
      location: r.location || '',
      pdfUrl: r.original_pdf_url || '',
      pdfName: r.original_pdf_name || '',
      verificationStatus: r.verification_status || 'Verified',
      isAvailable: r.status === 'Available'
    };

    res.json({
      success: true,
      plot
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6e. GET /api/client/published-layouts - Alias for Published Cadastral Layouts
app.get('/api/client/published-layouts', async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM layouts WHERE status = 'Published' OR status = 'Verified' ORDER BY uploaded_at DESC");
    res.json({
      success: true,
      count: rows.length,
      layouts: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/client/layouts/:layoutId/plots - Alias for Layout Plots
app.get('/api/client/layouts/:layoutId/plots', async (req, res) => {
  try {
    const { layoutId } = req.params;
    const { rows } = await query(
      'SELECT id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, verification_status FROM plots WHERE layout_id = $1 OR project = $1 ORDER BY plot_number ASC',
      [layoutId]
    );

    const clientPlots = rows.map((r) => {
      const parsedGeom = typeof r.polygon_geometry === 'string' ? JSON.parse(r.polygon_geometry) : r.polygon_geometry;
      return {
        id: r.id,
        plotNumber: r.plot_number,
        layoutId: r.layout_id,
        project: r.project,
        length: Number(r.length),
        width: Number(r.width),
        area: Number(r.area),
        unit: r.unit,
        facing: r.facing,
        facingRoadWidth: Number(r.facing_road_width),
        polygonGeometry: parsedGeom,
        coordinates: parsedGeom,
        valuation: Number(r.valuation),
        pricePerSqFt: Number(r.price_per_sqft),
        status: r.status,
        isAvailable: r.status === 'Available'
      };
    });

    res.json({
      success: true,
      layoutId,
      totalPlots: clientPlots.length,
      plots: clientPlots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. POST /api/client/bookings - Client Site Submission for Plot Booking Inquiries
app.post('/api/client/bookings', async (req, res) => {
  try {
    const { plotId, customerName, customerPhone, customerEmail, bookingAmount } = req.body;
    
    if (!plotId || !customerName || !customerPhone) {
      return res.status(400).json({ error: 'plotId, customerName, and customerPhone are required fields' });
    }

    const bookingId = `BOOK-${Date.now()}`;
    
    // Update Plot Status to Booked in Neon DB
    const plotUpdate = await query(
      `UPDATE plots 
       SET status = 'Booked', customer_name = $1, customer_phone = $2
       WHERE id = $3 RETURNING *`,
      [customerName, customerPhone, plotId]
    );

    if (plotUpdate.rows.length === 0) {
      return res.status(404).json({ error: 'Plot entity not found' });
    }

    const plot = plotUpdate.rows[0];
    const bAmt = Number(bookingAmount) || 50000;
    const totalVal = Number(plot.valuation) || 0;
    const remAmt = totalVal - bAmt;

    // Insert Booking Record in Neon DB
    const bookingRes = await query(
      `INSERT INTO bookings (id, plot_id, plot_number, customer_name, customer_phone, customer_email, booking_date, total_value, booking_amount, paid_amount, remaining_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, 'Booked') RETURNING *`,
      [bookingId, plotId, plot.plot_number, customerName, customerPhone, customerEmail || '', totalVal, bAmt, bAmt, remAmt]
    );

    res.json({
      success: true,
      message: `Plot ${plot.plot_number} successfully booked for ${customerName}`,
      booking: bookingRes.rows[0],
      plot: plot
    });
  } catch (err) {
    console.error('❌ Booking API Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 9. PUT /api/plots/:id/verify - Sign Off & Verify Plot Data
app.put('/api/plots/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, valuationNotes, verifiedBy } = req.body;

    const plotRes = await query('SELECT * FROM plots WHERE id = $1', [id]);
    if (plotRes.rows.length === 0) {
      return res.status(404).json({ error: 'Plot not found' });
    }
    const oldPlot = plotRes.rows[0];

    const updateRes = await query(
      `UPDATE plots 
       SET verification_status = $1, valuation_notes = $2, verified_by = $3, verified_at = CURRENT_DATE
       WHERE id = $4 RETURNING *`,
      [verificationStatus || 'Verified', valuationNotes || oldPlot.valuation_notes, verifiedBy || 'Akash Kamble', id]
    );

    await query(
      `INSERT INTO plot_audit_logs (plot_id, plot_number, field_changed, old_value, new_value, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, oldPlot.plot_number, 'verification_status', oldPlot.verification_status, verificationStatus || 'Verified', verifiedBy || 'Akash Kamble']
    );

    res.json({ success: true, message: 'Plot verification signed off in Neon DB', plot: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. GET /api/projects & POST /api/projects - Projects / Areas Management
app.get('/api/projects', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, ownerName, address, description } = req.body;
    const id = `AREA-${Date.now()}`;
    const { rows } = await query(
      `INSERT INTO projects (id, name, owner_name, address, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, name, ownerName || '', address || '', description || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /api/bookings - List Admin Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. GET /api/revenue & POST /api/revenue - Revenue Transactions
app.get('/api/revenue', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM revenue_transactions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/revenue', async (req, res) => {
  try {
    const { plotNumber, customerName, type, amount, paymentStatus, paymentType, note } = req.body;
    const id = `REV-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const { rows } = await query(
      `INSERT INTO revenue_transactions (id, date, time, plot_number, customer_name, type, amount, payment_status, payment_type, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, dateStr, timeStr, plotNumber || 'P-101', customerName || 'Client', type || 'Token Advance', Number(amount) || 0, paymentStatus || 'Completed', paymentType || 'Bank Transfer', note || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. GET /api/expenses & POST /api/expenses - Expenses Diary
app.get('/api/expenses', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM expenses ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { category, description, amount, note } = req.body;
    const id = `EXP-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const { rows } = await query(
      `INSERT INTO expenses (id, date, time, category, description, amount, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, dateStr, timeStr, category || 'Survey & GIS', description || '', Number(amount) || 0, note || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13b. DAILY DIARY REST API ENDPOINTS
// GET /api/diary - List all daily diary entries
app.get('/api/diary', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM diary_entries ORDER BY entry_date DESC');
    const mapped = {};
    rows.forEach((r) => {
      mapped[r.entry_date] = {
        notes: r.notes || '',
        tasks: typeof r.tasks === 'string' ? JSON.parse(r.tasks) : (r.tasks || [])
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/diary/:date - Fetch diary entry for a specific date
app.get('/api/diary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { rows } = await query('SELECT * FROM diary_entries WHERE entry_date = $1', [date]);
    if (rows.length === 0) {
      return res.json({ date, notes: '', tasks: [] });
    }
    const r = rows[0];
    res.json({
      date: r.entry_date,
      notes: r.notes || '',
      tasks: typeof r.tasks === 'string' ? JSON.parse(r.tasks) : (r.tasks || [])
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/diary/:date - Upsert diary notes & tasks for a specific date
app.put('/api/diary/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { notes, tasks } = req.body;

    const id = `DIARY-${date}`;
    const tasksJson = JSON.stringify(tasks || []);

    const { rows } = await query(
      `INSERT INTO diary_entries (id, entry_date, notes, tasks, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_date) DO UPDATE SET
       notes = COALESCE($3, diary_entries.notes),
       tasks = COALESCE($4, diary_entries.tasks),
       updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, date, notes !== undefined ? notes : '', tasksJson]
    );

    const r = rows[0];
    res.json({
      success: true,
      entry: {
        date: r.entry_date,
        notes: r.notes,
        tasks: typeof r.tasks === 'string' ? JSON.parse(r.tasks) : r.tasks
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/diary/:date/tasks - Add a task for a date
app.post('/api/diary/:date/tasks', async (req, res) => {
  try {
    const { date } = req.params;
    const { taskText } = req.body;
    if (!taskText || !taskText.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const { rows } = await query('SELECT * FROM diary_entries WHERE entry_date = $1', [date]);
    let currentTasks = [];
    let currentNotes = '';
    if (rows.length > 0) {
      currentNotes = rows[0].notes || '';
      currentTasks = typeof rows[0].tasks === 'string' ? JSON.parse(rows[0].tasks) : (rows[0].tasks || []);
    }

    const newTask = {
      id: `TASK-${Date.now()}`,
      text: taskText.trim(),
      completed: false
    };

    const updatedTasks = [newTask, ...currentTasks];
    const id = `DIARY-${date}`;

    await query(
      `INSERT INTO diary_entries (id, entry_date, notes, tasks, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_date) DO UPDATE SET
       tasks = $4,
       updated_at = CURRENT_TIMESTAMP`,
      [id, date, currentNotes, JSON.stringify(updatedTasks)]
    );

    res.json({ success: true, task: newTask, tasks: updatedTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/diary/:date/tasks/:taskId - Toggle task completion status
app.put('/api/diary/:date/tasks/:taskId', async (req, res) => {
  try {
    const { date, taskId } = req.params;
    const { rows } = await query('SELECT * FROM diary_entries WHERE entry_date = $1', [date]);

    let tasks = [];
    let notes = '';
    if (rows.length > 0) {
      notes = rows[0].notes || '';
      tasks = typeof rows[0].tasks === 'string' ? JSON.parse(rows[0].tasks) : (rows[0].tasks || []);
    } else if (req.body && Array.isArray(req.body.tasks)) {
      tasks = req.body.tasks;
    }

    let found = false;
    tasks = tasks.map((t) => {
      if (t.id === taskId) {
        found = true;
        return { ...t, completed: typeof req.body?.completed === 'boolean' ? req.body.completed : !t.completed };
      }
      return t;
    });

    if (!found && req.body && Array.isArray(req.body.tasks)) {
      tasks = req.body.tasks;
    }

    const id = `DIARY-${date}`;
    await query(
      `INSERT INTO diary_entries (id, entry_date, notes, tasks, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_date) DO UPDATE SET
       tasks = $4,
       updated_at = CURRENT_TIMESTAMP`,
      [id, date, notes, JSON.stringify(tasks)]
    );

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/diary/:date/tasks/:taskId - Delete task
app.delete('/api/diary/:date/tasks/:taskId', async (req, res) => {
  try {
    const { date, taskId } = req.params;
    const { rows } = await query('SELECT * FROM diary_entries WHERE entry_date = $1', [date]);

    let tasks = [];
    let notes = '';
    if (rows.length > 0) {
      notes = rows[0].notes || '';
      tasks = typeof rows[0].tasks === 'string' ? JSON.parse(rows[0].tasks) : (rows[0].tasks || []);
    } else if (req.body && Array.isArray(req.body.tasks)) {
      tasks = req.body.tasks;
    }

    tasks = tasks.filter((t) => t.id !== taskId);

    const id = `DIARY-${date}`;
    await query(
      `INSERT INTO diary_entries (id, entry_date, notes, tasks, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (entry_date) DO UPDATE SET
       tasks = $4,
       updated_at = CURRENT_TIMESTAMP`,
      [id, date, notes, JSON.stringify(tasks)]
    );

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13c. SYSTEM SETTINGS REST API ENDPOINTS
// GET /api/settings - Fetch all system settings (letterhead, profile, config)
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM system_settings');
    const settingsMap = {};
    rows.forEach((r) => {
      settingsMap[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
    });
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings - Save or update system setting by key
app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const settingKey = key || 'letterhead';
    if (!value) return res.status(400).json({ error: 'Setting value is required' });

    const valJson = JSON.stringify(value);
    const { rows } = await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [settingKey, valJson]
    );

    res.json({
      success: true,
      key: rows[0].key,
      value: typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. GET /api/dashboard/stats - Real-Time Aggregate Stats from SQL
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const plotsCount = await query('SELECT COUNT(*) FROM plots');
    const layoutsCount = await query('SELECT COUNT(*) FROM layouts');
    const totalArea = await query('SELECT COALESCE(SUM(area), 0) as total FROM plots');
    const bookingsCount = await query("SELECT COUNT(*) FROM plots WHERE status = 'Booked'");
    const soldCount = await query("SELECT COUNT(*) FROM plots WHERE status = 'Sold'");
    const verifiedCount = await query("SELECT COUNT(*) FROM plots WHERE verification_status = 'Verified'");
    const needsVerifyCount = await query("SELECT COUNT(*) FROM plots WHERE verification_status = 'Needs Verification'");
    const totalRev = await query('SELECT COALESCE(SUM(amount), 0) as total FROM revenue_transactions WHERE payment_status = \'Completed\'');
    const totalExp = await query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses');

    res.json({
      totalPlots: Number(plotsCount.rows[0].count),
      totalLayouts: Number(layoutsCount.rows[0].count),
      totalCadastralAreaSqFt: Number(totalArea.rows[0].total),
      activeBookingsCount: Number(bookingsCount.rows[0].count),
      soldPlotsCount: Number(soldCount.rows[0].count),
      verifiedPlotsCount: Number(verifiedCount.rows[0].count),
      needsVerificationCount: Number(needsVerifyCount.rows[0].count),
      totalRevenueAmount: Number(totalRev.rows[0].total),
      totalExpensesAmount: Number(totalExp.rows[0].total),
      netProfitAmount: Number(totalRev.rows[0].total) - Number(totalExp.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. GET /api/audit-logs - Fetch Audit Trail History
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM plot_audit_logs ORDER BY changed_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. POST /api/plots - Admin Add New Plot
app.post('/api/plots', async (req, res) => {
  try {
    const {
      plotNumber, layoutId, project, area, unit, length, width, documentArea,
      facing, facingRoadWidth, valuation, pricePerSqFt, status, location,
      valuationNotes
    } = req.body;

    const id = req.body.id || `PLOT-${Date.now()}`;
    const defaultPolygon = [
      [100, 100], [100 + (length || 40) * 2, 100],
      [100 + (length || 40) * 2, 100 + (width || 30) * 2], [100, 100 + (width || 30) * 2]
    ];

    const { rows } = await query(
      `INSERT INTO plots (id, plot_number, layout_id, project, area, unit, length, width, document_area, facing, facing_road_width, polygon_geometry, valuation, price_per_sqft, status, location, verification_status, valuation_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        id, plotNumber, layoutId || 'LAYOUT-001', project || 'Sky Cadastral Phase 1',
        Number(area) || (length * width) || 1200, unit || 'sq.ft', Number(length) || 40, Number(width) || 30,
        Number(documentArea) || (length * width) || 1200, facing || 'North', Number(facingRoadWidth) || 40,
        JSON.stringify(req.body.polygonGeometry || defaultPolygon), Number(valuation) || 2400000,
        Number(pricePerSqFt) || 2000, status || 'Available', location || 'Sector 1',
        (documentArea && documentArea !== (length * width)) ? 'Mismatch' : 'Verified',
        valuationNotes || 'Added manually via Admin Control Panel'
      ]
    );

    res.status(201).json({ success: true, plot: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17. PUT /api/plots/:id - Update Plot Details
app.put('/api/plots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plotNumber, project, area, unit, length, width, documentArea,
      pricePerSqFt, valuation, status, location, valuationNotes
    } = req.body;

    const { rows } = await query(
      `UPDATE plots
       SET plot_number = COALESCE($1, plot_number),
           project = COALESCE($2, project),
           area = COALESCE($3, area),
           unit = COALESCE($4, unit),
           length = COALESCE($5, length),
           width = COALESCE($6, width),
           document_area = COALESCE($7, document_area),
           price_per_sqft = COALESCE($8, price_per_sqft),
           valuation = COALESCE($9, valuation),
           status = COALESCE($10, status),
           location = COALESCE($11, location),
           valuation_notes = COALESCE($12, valuation_notes)
       WHERE id = $13 RETURNING *`,
      [
        plotNumber, project, area ? Number(area) : null, unit, length ? Number(length) : null,
        width ? Number(width) : null, documentArea ? Number(documentArea) : null,
        pricePerSqFt ? Number(pricePerSqFt) : null, valuation ? Number(valuation) : null,
        status, location, valuationNotes, id
      ]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Plot not found' });
    res.json({ success: true, plot: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 18. DELETE /api/plots/:id - Delete Plot
app.delete('/api/plots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM plots WHERE id = $1', [id]);
    res.json({ success: true, message: `Plot ${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 19. PUT /api/bookings/:id/mark-sold - Mark Booking & Plot as Sold
app.put('/api/bookings/:id/mark-sold', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find booking
    const bkRes = await query('SELECT * FROM bookings WHERE id = $1 OR plot_id = $1', [id]);
    if (bkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking record not found' });
    }

    const bk = bkRes.rows[0];

    // Update booking status to Sold
    const updatedBk = await query(
      `UPDATE bookings 
       SET status = 'Sold', paid_amount = total_value, remaining_amount = 0 
       WHERE id = $1 RETURNING *`,
      [bk.id]
    );

    // Update plot status to Sold
    await query(`UPDATE plots SET status = 'Sold' WHERE id = $1`, [bk.plot_id]);

    // Record settlement revenue transaction if remaining amount existed
    if (Number(bk.remaining_amount) > 0) {
      const revId = `REV-${Date.now()}`;
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      await query(
        `INSERT INTO revenue_transactions (id, date, time, plot_number, customer_name, type, amount, payment_status, payment_type, note)
         VALUES ($1, $2, $3, $4, $5, 'Sale', $6, 'Completed', 'Final Settlement', $7)`,
        [revId, dateStr, timeStr, bk.plot_number, bk.customer_name, Number(bk.remaining_amount), `Final sale realization for Plot ${bk.plot_number}`]
      );
    }

    res.json({ success: true, booking: updatedBk.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 20. PUT /api/bookings/:id/cancel - Cancel Booking
app.put('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const bkRes = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking record not found' });
    }

    const bk = bkRes.rows[0];

    // Reset plot to Available
    await query(
      `UPDATE plots SET status = 'Available', customer_name = '', customer_phone = '' WHERE id = $1`,
      [bk.plot_id]
    );

    // Delete booking
    await query('DELETE FROM bookings WHERE id = $1', [id]);

    res.json({ success: true, message: `Booking ${id} cancelled and plot reset to Available` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 21. PUT /api/projects/:id & DELETE /api/projects/:id
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ownerName, address, description } = req.body;
    const { rows } = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name), owner_name = COALESCE($2, owner_name),
           address = COALESCE($3, address), description = COALESCE($4, description)
       WHERE id = $5 RETURNING *`,
      [name, ownerName, address, description, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ success: true, message: `Area/Project ${id} removed` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Sky Cadastral Backend API running on http://localhost:${PORT}`);
  console.log(`Connected to Neon DB: ${process.env.DATABASE_URL.split('@')[1]}`);
});
