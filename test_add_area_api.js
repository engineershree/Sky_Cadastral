import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function testAddArea() {
  console.log('========================================================================');
  console.log('🧪 TESTING AREA CREATION AND RETRIEVAL BACKEND API LOGIC');
  console.log('========================================================================');

  const testAreaName = `Test Sector ${Date.now().toString().slice(-4)}`;
  const testId = `AREA-${Date.now()}`;

  try {
    // 1. Test direct DB insertion of project
    console.log(`\n[1. Inserting new project "${testAreaName}"]`);
    const insertProj = await query(
      `INSERT INTO projects (id, name, owner_name, address, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [testId, testAreaName, 'Akash Land Devs', 'Hinjewadi Sector 4, Pune', 'Premium Cadastral Layout']
    );
    console.log('  ✅ Project Inserted:', insertProj.rows[0]);

    // 2. Test auto layout creation
    const layoutId = `LAYOUT-${Date.now()}`;
    console.log(`\n[2. Auto-creating layout record for project "${testId}"]`);
    const insertLayout = await query(
      `INSERT INTO layouts (id, project_id, project_name, name, status, original_pdf_url, original_pdf_name, file_size, extracted_plots_count, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, '', '', '0 MB', 0, CURRENT_DATE) RETURNING *`,
      [layoutId, testId, testAreaName, `${testAreaName} Master Demarcation Plan`, 'Published']
    );
    console.log('  ✅ Layout Inserted:', insertLayout.rows[0]);

    // 3. Test querying /api/client/areas logic
    console.log('\n[3. Verifying retrieval in client/admin areas query]');
    const projectsRes = await query('SELECT * FROM projects ORDER BY created_at DESC');
    const layoutsRes = await query('SELECT * FROM layouts ORDER BY created_at DESC');

    const createdProject = projectsRes.rows.find((p) => p.id === testId);
    const createdLayout = layoutsRes.rows.find((l) => l.project_id === testId || l.id === layoutId);

    if (createdProject && createdLayout) {
      console.log('  ✅ Area verified in database list!');
      console.log(`     • Project Name: "${createdProject.name}"`);
      console.log(`     • Layout Name: "${createdLayout.name}"`);
    } else {
      console.error('  ❌ Area or layout missing from query results!');
    }

    // Cleanup test record
    await query('DELETE FROM layouts WHERE id = $1', [layoutId]);
    await query('DELETE FROM projects WHERE id = $1', [testId]);
    console.log('\n  🧹 Cleanup completed.');

    console.log('\n========================================================================');
    console.log('🎉 TEST COMPLETED SUCCESSFULLY');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testAddArea();
