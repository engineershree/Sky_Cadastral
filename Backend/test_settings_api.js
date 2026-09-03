const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function testSettingsAPI() {
  console.log('🧪 Starting System Settings REST API Automated Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/settings
    console.log('1. Testing GET /api/settings...');
    const getRes = await fetch(`${API_BASE}/settings`);
    assert(getRes.ok, `GET /api/settings returned status ${getRes.status}`);
    const settingsMap = await getRes.json();
    assert(typeof settingsMap === 'object', 'GET /api/settings returned a valid settings object');
    console.log(`   Fetched keys: [${Object.keys(settingsMap).join(', ')}]`);

    // 2. POST /api/settings (Save Letterhead Settings)
    console.log('\n2. Testing POST /api/settings (Save custom letterhead)...');
    const customLetterhead = {
      companyName: 'Sky Cadastral Test Consultancy',
      tagline: 'Automated Test Tagline',
      proprietor: 'Test Surveyor',
      regNumber: 'RERA-TEST-2026',
      address: 'Test Address Pune',
      phone: '+91 99000 11223',
      email: 'test@skycadastral.in',
      website: 'www.skycadastral.in'
    };

    const postRes = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'letterhead',
        value: customLetterhead
      })
    });

    assert(postRes.ok, `POST /api/settings status ${postRes.status}`);
    const postData = await postRes.json();
    assert(postData.success === true, 'Response contains success: true');
    assert(postData.value.companyName === customLetterhead.companyName, 'Saved companyName matches test value');

    // 3. Verify Persistence via GET /api/settings
    console.log('\n3. Verifying persistence via GET /api/settings...');
    const verifyRes = await fetch(`${API_BASE}/settings`);
    assert(verifyRes.ok, `GET /api/settings verification status ${verifyRes.status}`);
    const updatedSettings = await verifyRes.json();
    assert(
      updatedSettings.letterhead && updatedSettings.letterhead.companyName === customLetterhead.companyName,
      'Fetched letterhead settings reflect updated value in PostgreSQL'
    );

    console.log(`\n==================================================`);
    console.log(`🏁 Settings API Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ Settings API Test Error:', err);
    process.exit(1);
  }
}

testSettingsAPI();
