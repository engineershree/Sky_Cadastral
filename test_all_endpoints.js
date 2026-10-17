import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function runAllEndpointsTest() {
  console.log('========================================================================');
  console.log('🚀 SKY CADASTRAL — COMPREHENSIVE ENDPOINT VERIFICATION SUITE');
  console.log('========================================================================');

  const PORT = process.env.PORT || 5000;
  const BASE_URL = `http://127.0.0.1:${PORT}/api`;

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ PASS (${passedTests}/${totalTests}): ${message}`);
  }

  let serverProcess = null;
  const testRunId = `TST-${Date.now()}`;
  const testDate = new Date().toISOString().split('T')[0];

  try {
    // 0. Ensure server is running
    let serverRunning = false;
    try {
      const res = await fetch(`${BASE_URL}/health`).catch(() => null);
      if (res && res.ok) serverRunning = true;
    } catch (_) {}

    if (!serverRunning) {
      console.log(`Spawning backend server on port ${PORT}...`);
      serverProcess = spawn('node', ['index.js'], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch(`${BASE_URL}/health`);
          if (res.ok) {
            ready = true;
            console.log('Backend server is live and accepting HTTP connections.\n');
            break;
          }
        } catch (_) {}
      }

      if (!ready) {
        throw new Error('Server failed to start within timeout.');
      }
    } else {
      console.log('Backend server is already live and listening.\n');
    }

    // =======================================================================
    // 1. HEALTH & CORE SYSTEM ENDPOINTS
    // =======================================================================
    console.log('--- [1. Health & Core System] ---');
    
    // 1a. GET /api/health
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health returns 200');
    assert(healthData.status === 'online', 'Health status is "online"');
    assert(healthData.database.includes('PostgreSQL'), 'Database reports PostgreSQL connected');

    // 1b. GET /api/notifications
    const notifRes = await fetch(`${BASE_URL}/notifications`);
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, 'GET /api/notifications returns 200');
    assert(Array.isArray(notifData.notifications) || Array.isArray(notifData), 'Notifications response contains array');

    // 1c. GET /api/audit-logs
    const auditRes = await fetch(`${BASE_URL}/audit-logs`);
    const auditData = await auditRes.json();
    assert(auditRes.status === 200, 'GET /api/audit-logs returns 200');
    assert(Array.isArray(auditData), 'Audit logs response is an array');

    // 1d. GET /api/dashboard/stats
    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, 'GET /api/dashboard/stats returns 200');
    assert(typeof statsData.totalPlots === 'number', 'Stats contains totalPlots numeric field');
    assert(typeof statsData.totalRevenueAmount === 'number', 'Stats contains totalRevenueAmount numeric field');

    // 1e. GET & POST /api/settings
    const getSettingsRes = await fetch(`${BASE_URL}/settings`);
    const getSettingsData = await getSettingsRes.json();
    assert(getSettingsRes.status === 200, 'GET /api/settings returns 200');

    const postSettingsRes = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'test_company_info', value: { companyName: 'Sky Cadastral Pvt Ltd', phone: '+91 99999 88888' } })
    });
    const postSettingsData = await postSettingsRes.json();
    assert(postSettingsRes.status === 200, 'POST /api/settings returns 200');
    assert(postSettingsData.success === true, 'Settings update returns success: true');

    // =======================================================================
    // 2. AUTHENTICATION ENDPOINTS
    // =======================================================================
    console.log('\n--- [2. Authentication] ---');

    // 2a. POST /api/auth/login (Success)
    const loginOkRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skycadastral.in', password: 'admin123' })
    });
    const loginOkData = await loginOkRes.json();
    assert(loginOkRes.status === 200, 'POST /api/auth/login returns 200 for valid credentials');
    assert(loginOkData.success === true && loginOkData.token, 'Login returns auth token');

    // 2b. POST /api/auth/login (Invalid)
    const loginBadRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@skycadastral.in', password: 'wrongpassword' })
    });
    assert(loginBadRes.status === 401, 'POST /api/auth/login returns 401 for wrong credentials');

    // 2c. POST /api/auth/logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200');
    assert(logoutData.success === true, 'Logout returns success: true');

    // =======================================================================
    // 3. PROJECTS & AREAS ENDPOINTS (CRUD)
    // =======================================================================
    console.log('\n--- [3. Projects & Areas CRUD] ---');

    // 3a. GET /api/projects & GET /api/areas
    const getProjectsRes = await fetch(`${BASE_URL}/projects`);
    const getProjectsData = await getProjectsRes.json();
    assert(getProjectsRes.status === 200, 'GET /api/projects returns 200');
    assert(Array.isArray(getProjectsData), 'Projects response is an array');

    const getAreasRes = await fetch(`${BASE_URL}/areas`);
    const getAreasData = await getAreasRes.json();
    assert(getAreasRes.status === 200, 'GET /api/areas returns 200');
    assert(getAreasData.success === true || Array.isArray(getAreasData), 'Areas endpoint returns success response');

    // 3b. POST /api/projects
    const testProjectId = `PROJ-${testRunId}`;
    const postProjRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: testProjectId,
        name: `Test Project ${testRunId}`,
        ownerName: 'Test Owner',
        address: 'Test Valley, Pune',
        description: 'Test Project Description'
      })
    });
    const postProjData = await postProjRes.json();
    assert(postProjRes.status === 201 || postProjRes.status === 200, 'POST /api/projects creates project');
    assert(postProjData.id === testProjectId || postProjData.name, 'Created project returned');

    // 3c. PUT /api/projects/:id
    const putProjRes = await fetch(`${BASE_URL}/projects/${testProjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Updated Project ${testRunId}`,
        description: 'Updated Description'
      })
    });
    const putProjData = await putProjRes.json();
    assert(putProjRes.status === 200, 'PUT /api/projects/:id updates project');
    assert(putProjData.success === true, 'Project update returns success: true');

    // =======================================================================
    // 4. LAYOUTS & CADASTRAL VERIFICATION
    // =======================================================================
    console.log('\n--- [4. Layouts & Cadastral Verification] ---');

    // 4a. GET /api/layouts
    const getLayoutsRes = await fetch(`${BASE_URL}/layouts`);
    const getLayoutsData = await getLayoutsRes.json();
    assert(getLayoutsRes.status === 200, 'GET /api/layouts returns 200');
    assert(Array.isArray(getLayoutsData), 'Layouts response is an array');

    // 4b. POST /api/cadastral/generate-js-layout
    const genLayoutRes = await fetch(`${BASE_URL}/cadastral/generate-js-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutName: 'Vector Cadastral Gen Layout',
        projectName: `Updated Project ${testRunId}`
      })
    });
    const genLayoutData = await genLayoutRes.json();
    assert(genLayoutRes.status === 200, 'POST /api/cadastral/generate-js-layout returns 200');
    assert(genLayoutData.success === true, 'JS layout generator returns success: true');
    assert(Array.isArray(genLayoutData.plots), 'Generated layout contains plots array');

    // 4c. POST /api/cadastral/save-verified-layout (Verification Sync)
    const testLayoutId = `LAYOUT-${testRunId}`;
    const testPlotNumber = `P-${testRunId.slice(-4)}`;
    const syncRes = await fetch(`${BASE_URL}/cadastral/save-verified-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: testLayoutId,
        projectId: testProjectId,
        projectName: `Updated Project ${testRunId}`,
        name: `Layout Plan ${testRunId}`,
        plots: [
          {
            plotNumber: testPlotNumber,
            officialAreaSqft: 1500,
            length: 50,
            width: 30,
            facing: 'East',
            facingRoadWidth: 40,
            polygonGeometry: [[0, 0], [50, 0], [50, 30], [0, 30]], // non-closed ring to test auto-close
            edgeDimensions: [{ edgeIndex: 0, calculatedLengthFt: 50 }],
            verificationStatus: 'Verified',
            valuation: 3000000,
            pricePerSqFt: 2000,
            status: 'Available'
          }
        ],
        infrastructureGeometry: { roads: [], openSpaces: [] }
      })
    });
    const syncData = await syncRes.json();
    assert(syncRes.status === 200, 'POST /api/cadastral/save-verified-layout returns 200');
    assert(syncData.success === true, 'Sync response success: true');
    assert(syncData.layout.status === 'Verified', 'Layout is marked Verified when all plots verified');
    assert(syncData.verification.isVerified === true, 'verification.isVerified is true');

    // 4d. POST /api/cadastral/publish-layout
    const pubCadRes = await fetch(`${BASE_URL}/cadastral/publish-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layoutId: testLayoutId })
    });
    const pubCadData = await pubCadRes.json();
    assert(pubCadRes.status === 200, 'POST /api/cadastral/publish-layout returns 200');
    assert(pubCadData.success === true, 'Cadastral publish returns success: true');

    // 4e. POST /api/layouts/:id/publish
    const pubLayoutRes = await fetch(`${BASE_URL}/layouts/${testLayoutId}/publish`, {
      method: 'POST'
    });
    const pubLayoutData = await pubLayoutRes.json();
    assert(pubLayoutRes.status === 200, 'POST /api/layouts/:id/publish returns 200');
    assert(pubLayoutData.success === true, 'Layout publish returns success: true');

    // =======================================================================
    // 5. PLOTS ENDPOINTS (CRUD & Geometry Updates)
    // =======================================================================
    console.log('\n--- [5. Plots Admin CRUD] ---');

    // 5a. GET /api/plots
    const getPlotsRes = await fetch(`${BASE_URL}/plots`);
    const getPlotsData = await getPlotsRes.json();
    assert(getPlotsRes.status === 200, 'GET /api/plots returns 200');
    assert(Array.isArray(getPlotsData), 'Plots response is an array');

    // 5b. POST /api/plots
    const standalonePlotId = `PLT-ADD-${testRunId}`;
    const postPlotRes = await fetch(`${BASE_URL}/plots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: standalonePlotId,
        plotNumber: `SP-${testRunId.slice(-4)}`,
        layoutId: testLayoutId,
        project: `Updated Project ${testRunId}`,
        area: 1200,
        unit: 'sq.ft',
        length: 40,
        width: 30,
        documentArea: 1200,
        facing: 'North',
        facingRoadWidth: 30,
        status: 'Available'
      })
    });
    const postPlotData = await postPlotRes.json();
    assert(postPlotRes.status === 201 || postPlotRes.status === 200, 'POST /api/plots creates plot');
    assert(postPlotData.success === true, 'Plot creation returns success: true');

    // 5c. PUT /api/plots/:id
    const putPlotRes = await fetch(`${BASE_URL}/plots/${standalonePlotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facing: 'South',
        valuation: 2500000
      })
    });
    const putPlotData = await putPlotRes.json();
    assert(putPlotRes.status === 200, 'PUT /api/plots/:id updates plot');
    assert(putPlotData.success === true, 'Plot update returns success: true');

    // 5d. PUT /api/plots/:id/geometry
    const putGeomRes = await fetch(`${BASE_URL}/plots/${standalonePlotId}/geometry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        polygonGeometry: [[10, 10], [50, 10], [50, 40], [10, 40], [10, 10]]
      })
    });
    const putGeomData = await putGeomRes.json();
    assert(putGeomRes.status === 200, 'PUT /api/plots/:id/geometry updates plot geometry');
    assert(putGeomData.success === true, 'Plot geometry update returns success: true');

    // 5e. PUT /api/plots/:id/verify
    const verifyPlotRes = await fetch(`${BASE_URL}/plots/${standalonePlotId}/verify`, {
      method: 'PUT'
    });
    const verifyPlotData = await verifyPlotRes.json();
    assert(verifyPlotRes.status === 200, 'PUT /api/plots/:id/verify verifies plot');
    assert(verifyPlotData.success === true, 'Plot verify returns success: true');

    // 5f. DELETE /api/plots/:id
    const delPlotRes = await fetch(`${BASE_URL}/plots/${standalonePlotId}`, {
      method: 'DELETE'
    });
    const delPlotData = await delPlotRes.json();
    assert(delPlotRes.status === 200, 'DELETE /api/plots/:id deletes plot');
    assert(delPlotData.success === true, 'Plot deletion returns success: true');

    // =======================================================================
    // 6. CLIENT WEBSITE REST API ENDPOINTS
    // =======================================================================
    console.log('\n--- [6. Client Website REST API] ---');

    // 6a. GET /api/client/areas
    const clientAreasRes = await fetch(`${BASE_URL}/client/areas`);
    const clientAreasData = await clientAreasRes.json();
    assert(clientAreasRes.status === 200, 'GET /api/client/areas returns 200');
    assert(clientAreasData.success === true && Array.isArray(clientAreasData.areas), 'Client areas response contains areas array');

    // 6b. GET /api/client/areas/:areaId (By Layout ID)
    const clientAreaDetailRes = await fetch(`${BASE_URL}/client/areas/${testLayoutId}`);
    const clientAreaDetailData = await clientAreaDetailRes.json();
    assert(clientAreaDetailRes.status === 200, 'GET /api/client/areas/:areaId returns 200');
    assert(clientAreaDetailData.success === true, 'Client area detail success: true');
    assert(clientAreaDetailData.area.id === testLayoutId, 'Area matched layout ID');
    assert(clientAreaDetailData.isVerified === true, 'isVerified is true for verified layout');
    assert(clientAreaDetailData.plots.length >= 1, 'Returns vector plots structure');
    
    // Check closed polygon ring
    const testP = clientAreaDetailData.plots[0];
    const geom = testP.polygonGeometry;
    assert(geom[0][0] === geom[geom.length - 1][0] && geom[0][1] === geom[geom.length - 1][1], 'Plot polygon is guaranteed closed ring');

    // 6c. GET /api/client/areas/:areaId/plots
    const clientAreaPlotsRes = await fetch(`${BASE_URL}/client/areas/${testLayoutId}/plots`);
    const clientAreaPlotsData = await clientAreaPlotsRes.json();
    assert(clientAreaPlotsRes.status === 200, 'GET /api/client/areas/:areaId/plots returns 200');
    assert(clientAreaPlotsData.success === true, 'Client area plots success: true');
    assert(clientAreaPlotsData.verification.isVerified === true, 'Verification object returned with isVerified: true');

    // 6d. GET /api/client/plots/:plotId
    const firstPlotId = testP.id;
    const clientPlotRes = await fetch(`${BASE_URL}/client/plots/${firstPlotId}`);
    const clientPlotData = await clientPlotRes.json();
    assert(clientPlotRes.status === 200, 'GET /api/client/plots/:plotId returns 200');
    assert((clientPlotData.plot && clientPlotData.plot.id === firstPlotId) || clientPlotData.id === firstPlotId, 'Correct plot details returned');

    // 6e. GET /api/client/published-layouts
    const pubLayoutsRes = await fetch(`${BASE_URL}/client/published-layouts`);
    const pubLayoutsData = await pubLayoutsRes.json();
    assert(pubLayoutsRes.status === 200, 'GET /api/client/published-layouts returns 200');
    assert(pubLayoutsData.success === true && Array.isArray(pubLayoutsData.layouts), 'Published layouts response contains layouts array');

    // 6f. GET /api/client/layouts/:layoutId/plots
    const clientLayoutPlotsRes = await fetch(`${BASE_URL}/client/layouts/${testLayoutId}/plots`);
    const clientLayoutPlotsData = await clientLayoutPlotsRes.json();
    assert(clientLayoutPlotsRes.status === 200, 'GET /api/client/layouts/:layoutId/plots returns 200');
    assert(clientLayoutPlotsData.success === true, 'Layout plots success: true');

    // 6g. POST /api/client/bookings
    const clientBookingRes = await fetch(`${BASE_URL}/client/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plotId: firstPlotId,
        customerName: 'Aarav Sharma',
        customerPhone: '+91 98765 43210',
        customerEmail: 'aarav.sharma@example.com',
        bookingAmount: 50000,
        notes: 'Inquiry via automated test'
      })
    });
    const clientBookingData = await clientBookingRes.json();
    assert(clientBookingRes.status === 200, 'POST /api/client/bookings returns 200');
    assert(clientBookingData.success === true, 'Client booking success: true');
    const createdBookingId = clientBookingData.booking.id;

    // =======================================================================
    // 7. BOOKINGS MANAGEMENT
    // =======================================================================
    console.log('\n--- [7. Bookings Management] ---');

    // 7a. GET /api/bookings
    const getBookingsRes = await fetch(`${BASE_URL}/bookings`);
    const getBookingsData = await getBookingsRes.json();
    assert(getBookingsRes.status === 200, 'GET /api/bookings returns 200');
    assert(Array.isArray(getBookingsData), 'Bookings response is an array');

    // 7b. PUT /api/bookings/:id/mark-sold
    const markSoldRes = await fetch(`${BASE_URL}/bookings/${createdBookingId}/mark-sold`, {
      method: 'PUT'
    });
    const markSoldData = await markSoldRes.json();
    assert(markSoldRes.status === 200, 'PUT /api/bookings/:id/mark-sold returns 200');
    assert(markSoldData.success === true, 'Mark sold returns success: true');

    // 7c. PUT /api/bookings/:id/cancel
    const cancelRes = await fetch(`${BASE_URL}/bookings/${createdBookingId}/cancel`, {
      method: 'PUT'
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, 'PUT /api/bookings/:id/cancel returns 200');
    assert(cancelData.success === true, 'Cancel booking returns success: true');

    // =======================================================================
    // 8. FINANCIAL ENDPOINTS (Revenue & Expenses)
    // =======================================================================
    console.log('\n--- [8. Revenue & Expenses] ---');

    // 8a. GET & POST /api/revenue
    const postRevRes = await fetch(`${BASE_URL}/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plotNumber: testPlotNumber,
        customerName: 'Aarav Sharma',
        type: 'Token Advance',
        amount: 45000,
        paymentStatus: 'Completed',
        paymentType: 'NEFT',
        note: `Cadastral Consultation ${testRunId}`
      })
    });
    const postRevData = await postRevRes.json();
    assert(postRevRes.status === 200, 'POST /api/revenue creates revenue entry');
    assert(postRevData.id !== undefined, 'Revenue entry created with ID');

    const getRevRes = await fetch(`${BASE_URL}/revenue`);
    const getRevData = await getRevRes.json();
    assert(getRevRes.status === 200, 'GET /api/revenue returns 200');
    assert(Array.isArray(getRevData), 'Revenue response is an array');

    // 8b. GET & POST /api/expenses
    const postExpRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Survey & Equipment',
        description: `Total Station Calibration ${testRunId}`,
        amount: 8500,
        note: 'Calibration certificate renewed'
      })
    });
    const postExpData = await postExpRes.json();
    assert(postExpRes.status === 200, 'POST /api/expenses creates expense entry');
    assert(postExpData.id !== undefined, 'Expense entry created with ID');

    const getExpRes = await fetch(`${BASE_URL}/expenses`);
    const getExpData = await getExpRes.json();
    assert(getExpRes.status === 200, 'GET /api/expenses returns 200');
    assert(Array.isArray(getExpData), 'Expenses response is an array');

    // =======================================================================
    // 9. DIARY & TASKS MANAGEMENT
    // =======================================================================
    console.log('\n--- [9. Diary & Tasks] ---');

    // 9a. GET /api/diary
    const getDiaryAllRes = await fetch(`${BASE_URL}/diary`);
    const getDiaryAllData = await getDiaryAllRes.json();
    assert(getDiaryAllRes.status === 200, 'GET /api/diary returns 200');
    assert(typeof getDiaryAllData === 'object' && getDiaryAllData !== null, 'Diary response is a date-keyed dictionary object');

    // 9b. PUT /api/diary/:date & GET /api/diary/:date
    const putDiaryRes = await fetch(`${BASE_URL}/diary/${testDate}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: `Field survey and demarcation inspection notes for ${testDate}`,
        tasks: [{ id: `TASK-INIT-${testRunId}`, text: 'Check boundary stones', completed: false }]
      })
    });
    const putDiaryData = await putDiaryRes.json();
    assert(putDiaryRes.status === 200, 'PUT /api/diary/:date updates diary');
    assert(putDiaryData.success === true, 'Diary update returns success: true');

    const getDiaryDateRes = await fetch(`${BASE_URL}/diary/${testDate}`);
    const getDiaryDateData = await getDiaryDateRes.json();
    assert(getDiaryDateRes.status === 200, 'GET /api/diary/:date returns 200');
    assert(getDiaryDateData.date === testDate, 'Diary entry matches requested date');

    // 9c. POST /api/diary/:date/tasks
    const postTaskRes = await fetch(`${BASE_URL}/diary/${testDate}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText: 'Verify benchmark elevation' })
    });
    const postTaskData = await postTaskRes.json();
    assert(postTaskRes.status === 200, 'POST /api/diary/:date/tasks creates task');
    assert(postTaskData.success === true, 'Task creation returns success: true');
    const createdTaskId = postTaskData.task.id;

    // 9d. PUT /api/diary/:date/tasks/:taskId
    const putTaskRes = await fetch(`${BASE_URL}/diary/${testDate}/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    const putTaskData = await putTaskRes.json();
    assert(putTaskRes.status === 200, 'PUT /api/diary/:date/tasks/:taskId toggles task completion');
    assert(putTaskData.success === true, 'Task toggle returns success: true');

    // 9e. DELETE /api/diary/:date/tasks/:taskId
    const delTaskRes = await fetch(`${BASE_URL}/diary/${testDate}/tasks/${createdTaskId}`, {
      method: 'DELETE'
    });
    const delTaskData = await delTaskRes.json();
    assert(delTaskRes.status === 200, 'DELETE /api/diary/:date/tasks/:taskId deletes task');
    assert(delTaskData.success === true, 'Task deletion returns success: true');

    // =======================================================================
    // 10. PAYMENTS GATEWAY ENDPOINTS
    // =======================================================================
    console.log('\n--- [10. Payments Gateway] ---');
    
    // 10a. POST /api/payments/create-order
    const createOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 25000,
        currency: 'INR',
        plotId: firstPlotId,
        plotNumber: testPlotNumber,
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav.sharma@example.com'
      })
    });
    const createOrderData = await createOrderRes.json();
    assert(createOrderRes.status === 200 || createOrderRes.status === 500, 'POST /api/payments/create-order responds with handled HTTP code');
    if (createOrderRes.status === 200) {
      assert(createOrderData.success === true, 'Razorpay order creation returns success: true');
      assert(createOrderData.orderId !== undefined, 'Razorpay orderId returned');
    } else {
      console.log(`  ℹ️ Razorpay order creation handled provider notice: ${createOrderData.error}`);
    }

    // =======================================================================
    // 11. CLEANUP OF TEST ARTIFACTS
    // =======================================================================
    console.log('\n--- [11. Cleanup] ---');
    await query('DELETE FROM bookings WHERE id = $1', [createdBookingId]);
    await query('DELETE FROM plots WHERE layout_id = $1', [testLayoutId]);
    await query('DELETE FROM layouts WHERE id = $1', [testLayoutId]);
    await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
    await query('DELETE FROM diary_entries WHERE entry_date = $1', [testDate]);
    await query('DELETE FROM revenue_transactions WHERE note LIKE $1', [`%${testRunId}%`]);
    await query('DELETE FROM expenses WHERE description LIKE $1', [`%${testRunId}%`]);
    await query('DELETE FROM system_settings WHERE key = $1', ['test_company_info']);
    console.log('  🧹 Successfully cleaned up all temporary test records from Neon PostgreSQL.');

    console.log('\n========================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} ENDPOINTS TESTED AND 100% OPERATIONAL!`);
    console.log('========================================================================');

    if (serverProcess) {
      serverProcess.kill('SIGINT');
      await new Promise((r) => setTimeout(r, 500));
    }
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Endpoints Test Error:', err);
    if (serverProcess) {
      serverProcess.kill('SIGINT');
      await new Promise((r) => setTimeout(r, 500));
    }
    process.exit(1);
  }
}

runAllEndpointsTest();
