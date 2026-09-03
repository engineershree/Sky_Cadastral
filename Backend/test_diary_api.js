const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function testDiaryAPI() {
  console.log('🧪 Starting Daily Diary REST API Automated Integration Tests...\n');
  const testDate = '2026-09-02';
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
    // 1. GET /api/diary
    console.log('1. Testing GET /api/diary...');
    const listRes = await fetch(`${API_BASE}/diary`);
    assert(listRes.ok, `GET /api/diary returned status ${listRes.status}`);
    const diaryMap = await listRes.json();
    assert(typeof diaryMap === 'object', 'GET /api/diary returned a valid map object');
    console.log(`   Fetched ${Object.keys(diaryMap).length} diary entries from backend.`);

    // 2. PUT /api/diary/:date (Upsert Notes & Tasks)
    console.log(`\n2. Testing PUT /api/diary/${testDate} (Upsert notes)...`);
    const testNotes = "Field survey report for Sector 1 boundary line check.\nVerified 3 plot pillars.";
    const putRes = await fetch(`${API_BASE}/diary/${testDate}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: testNotes })
    });
    assert(putRes.ok, `PUT /api/diary/${testDate} status ${putRes.status}`);
    const putData = await putRes.json();
    assert(putData.success === true, 'Response contains success: true');
    assert(putData.entry.notes === testNotes, 'Saved notes match input string');

    // 3. GET /api/diary/:date (Fetch specific date)
    console.log(`\n3. Testing GET /api/diary/${testDate}...`);
    const getRes = await fetch(`${API_BASE}/diary/${testDate}`);
    assert(getRes.ok, `GET /api/diary/${testDate} status ${getRes.status}`);
    const entryData = await getRes.json();
    assert(entryData.date === testDate, `Entry date matches ${testDate}`);
    assert(entryData.notes === testNotes, 'Fetched notes match updated notes');

    // 4. POST /api/diary/:date/tasks (Add Task)
    console.log(`\n4. Testing POST /api/diary/${testDate}/tasks (Add task)...`);
    const taskText = 'Verify GPS coordinates for Plot A-01';
    const addTaskRes = await fetch(`${API_BASE}/diary/${testDate}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskText })
    });
    assert(addTaskRes.ok, `POST /api/diary/${testDate}/tasks status ${addTaskRes.status}`);
    const taskData = await addTaskRes.json();
    assert(taskData.success === true, 'Task added successfully');
    assert(taskData.task.text === taskText, 'Added task text matches input');
    const createdTaskId = taskData.task.id;

    // 5. PUT /api/diary/:date/tasks/:taskId (Toggle Task Completion)
    console.log(`\n5. Testing PUT /api/diary/${testDate}/tasks/${createdTaskId} (Toggle task completion)...`);
    const toggleRes = await fetch(`${API_BASE}/diary/${testDate}/tasks/${createdTaskId}`, {
      method: 'PUT'
    });
    assert(toggleRes.ok, `Toggle task status ${toggleRes.status}`);
    const toggleData = await toggleRes.json();
    const updatedTask = toggleData.tasks.find((t) => t.id === createdTaskId);
    assert(updatedTask && updatedTask.completed === true, 'Task completion status toggled to true');

    // 6. DELETE /api/diary/:date/tasks/:taskId (Delete Task)
    console.log(`\n6. Testing DELETE /api/diary/${testDate}/tasks/${createdTaskId} (Delete task)...`);
    const deleteRes = await fetch(`${API_BASE}/diary/${testDate}/tasks/${createdTaskId}`, {
      method: 'DELETE'
    });
    assert(deleteRes.ok, `Delete task status ${deleteRes.status}`);
    const deleteData = await deleteRes.json();
    const remainingTask = deleteData.tasks.find((t) => t.id === createdTaskId);
    assert(!remainingTask, 'Task successfully removed from diary entry');

    // 7. PUT /api/diary/2026-09-99/tasks/TASK-NEW (Upsert-safety test for new date)
    console.log('\n7. Testing PUT /api/diary/2026-09-99/tasks/TASK-NEW (Upsert safety for new date)...');
    const newDateRes = await fetch(`${API_BASE}/diary/2026-09-99/tasks/TASK-NEW`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [{ id: 'TASK-NEW', text: 'New date task', completed: true }]
      })
    });
    assert(newDateRes.ok, `PUT /api/diary/2026-09-99/tasks/TASK-NEW returned status ${newDateRes.status} (No 404!)`);
    const newDateData = await newDateRes.json();
    assert(newDateData.success === true, 'New date entry automatically created and task updated');

    console.log(`\n==================================================`);
    console.log(`🏁 API Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`==================================================`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('❌ API Test Error:', err);
    process.exit(1);
  }
}

testDiaryAPI();
