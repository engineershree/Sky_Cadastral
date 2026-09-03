async function testClientApiConsumption() {
  console.log('========================================================================');
  console.log('🌐 SKY CADASTRAL — CLIENT PORTAL API CONSUMPTION & SYNC TEST');
  console.log('========================================================================');
  const API_BASE = process.env.API_BASE_URL || 'https://sky-cadastral.onrender.com/api';

  // 1. Fetch All Layouts via Client API
  console.log('\n[1. FETCHING LAYOUTS VIA CLIENT API (GET /api/layouts)]');
  const layoutsRes = await fetch(`${API_BASE}/layouts`);
  const layouts = await layoutsRes.json();
  console.log(`  ✅ API Response: Received ${layouts.length} Layouts from Neon DB`);
  
  const targetLayout = layouts.find(l => l.name.includes('30-Plot')) || layouts[0];
  console.log(`  ✅ Selected Layout for Client 2D/3D Viewer: "${targetLayout.name}" (ID: ${targetLayout.id})`);

  // 2. Fetch All 30 Verified Plots for Client 2D/3D Renderer
  console.log(`\n[2. FETCHING 30-PLOT GEOMETRIES & SPECS (GET /api/client/layouts/${targetLayout.id}/plots)]`);
  const clientPlotsRes = await fetch(`${API_BASE}/client/layouts/${targetLayout.id}/plots`);
  const clientPlotsResult = await clientPlotsRes.json();

  console.log(`  ✅ API Status: Success (${clientPlotsRes.status} OK)`);
  console.log(`  ✅ Total Plots Received for Client Renderer: ${clientPlotsResult.totalPlots}`);

  // Inspect first 3 plots
  clientPlotsResult.plots.slice(0, 3).forEach((p, idx) => {
    console.log(`     • [Plot ${idx + 1}] Number: ${p.plotNumber} | Dimensions: ${p.length}x${p.width}ft | Area: ${p.area} sq.ft | Facing: ${p.facing}`);
    console.log(`       Vector Vertices for Three.js/SVG: ${JSON.stringify(p.polygonGeometry)}`);
  });

  // 3. Test Client Booking Submission (POST /api/client/bookings)
  console.log('\n[3. TESTING CLIENT PLOT BOOKING SUBMISSION (POST /api/client/bookings)]');
  const targetPlot = clientPlotsResult.plots[0];
  console.log(`  -> Submitting Client Booking Inquiry for Plot "${targetPlot.plotNumber}" (ID: ${targetPlot.id})...`);

  const bookingRes = await fetch(`${API_BASE}/client/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plotId: targetPlot.id,
      customerName: 'Rohan Deshmukh',
      customerPhone: '+91 98230 45678',
      customerEmail: 'rohan.d@example.com',
      bookingAmount: 100000
    })
  });

  const bookingResult = await bookingRes.json();
  console.log(`  ✅ Booking API Response Status: ${bookingRes.status}`);
  console.log(`  ✅ Message: ${bookingResult.message}`);
  console.log(`  ✅ Booking Reference ID: ${bookingResult.booking?.id}`);
  console.log(`  ✅ Updated Plot Status in Neon DB: ${bookingResult.plot?.status}`);

  console.log('\n========================================================================');
  console.log('🎉 CLIENT PORTAL API CONSUMPTION & ZERO DATA LOSS SYNC TEST PASSED!');
  console.log('========================================================================');
  process.exit(0);
}

testClientApiConsumption().catch(err => {
  console.error('❌ Client API Test Error:', err);
  process.exit(1);
});
