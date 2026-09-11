import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/rvind/.gemini/antigravity/brain/6184f93c-af83-471e-9a73-6418f0f97c2d/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Screenshot: Chat Page
  console.log('1. Capturing Chat Page...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_chat_page.png') });

  // 2. Click "Message Board"
  console.log('2. Switching to Message Board...');
  const boardNavBtn = page.getByRole('button', { name: 'Message Board' });
  await boardNavBtn.click();
  await page.waitForTimeout(1000);

  // 3. Screenshot: Stream View
  console.log('3. Capturing Message Board Stream View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_board_stream_view.png') });

  // 4. Switch to 4-Column Kanban View
  console.log('4. Switching to 4-Column Kanban View...');
  const kanbanBtn = page.locator('button[title="Column / Kanban view"]');
  await kanbanBtn.click();
  await page.waitForTimeout(600);

  // 5. Screenshot: 4-Column Kanban View
  console.log('5. Capturing 4-Column Kanban View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_board_kanban_4col.png') });

  // Switch back to Stream View
  const streamBtn = page.locator('button[title="Stream view"]');
  await streamBtn.click();
  await page.waitForTimeout(400);

  // 6. Click "Add Instruction"
  console.log('6. Opening Add Instruction Modal...');
  const addInstBtn = page.getByRole('button', { name: 'Add Instruction' });
  await addInstBtn.click();
  await page.waitForTimeout(600);

  // 7. Click a preset chip: "Low Latency (<50ms)"
  console.log('7. Selecting Low Latency preset chip...');
  const latencyPresetBtn = page.getByRole('button', { name: /Low Latency/i });
  if (await latencyPresetBtn.isVisible()) {
    await latencyPresetBtn.click();
  }

  // 8. Screenshot: Add Instruction Modal with preset selected and agent targets
  console.log('8. Capturing Add Instruction Modal with presets & targeting...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_add_instruction_modal.png') });

  // 9. Submit directive
  console.log('9. Injecting directive...');
  const injectBtn = page.getByRole('button', { name: /Inject Directive|Inject for/i });
  await injectBtn.click();
  await page.waitForTimeout(800);

  // 10. Screenshot: Board with Injected Directive
  console.log('10. Capturing board with injected directive...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_directive_added.png') });

  // 11. Click "Resume" to initiate autonomous execution
  console.log('11. Resuming autonomous multi-agent collaboration...');
  const resumeBtn = page.getByRole('button', { name: /Resume|Restart|Start/i });
  await resumeBtn.click();

  // Let agents collaborate for 6 seconds
  console.log('Waiting for autonomous agent deliberation (6s)...');
  await page.waitForTimeout(6000);

  // 12. Screenshot: Active execution
  console.log('12. Capturing active autonomous collaboration...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_autonomous_execution.png') });

  // 13. Test Contributor Filter: select "Human Director"
  console.log('13. Testing Contributor Filter...');
  const filterSelect = page.locator('select[title="Filter posts by contributor"]');
  if (await filterSelect.isVisible()) {
    await filterSelect.selectOption('user');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_agent_filtered_view.png') });
    // Reset back to all contributors
    await filterSelect.selectOption('all');
    await page.waitForTimeout(300);
  }

  // 14. Pause execution
  console.log('14. Pausing execution...');
  const pauseBtn = page.getByRole('button', { name: 'Pause' });
  if (await pauseBtn.isVisible()) {
    await pauseBtn.click();
    await page.waitForTimeout(500);
  }

  // 15. Open New Task Modal
  console.log('15. Opening New Task Modal...');
  const newBoardBtn = page.getByRole('button', { name: /New Board|Assign New Task/i }).first();
  await newBoardBtn.click();
  await page.waitForTimeout(600);

  // 16. Screenshot: New Task Modal
  console.log('16. Capturing New Task Modal...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_new_task_modal.png') });

  // 17. Pick Security Template & Launch
  console.log('17. Launching Security Task Board...');
  const secTplBtn = page.getByRole('button', { name: /Autonomous LLM Security/i });
  await secTplBtn.scrollIntoViewIfNeeded();
  await secTplBtn.click();
  await page.waitForTimeout(600);

  const launchBtn = page.getByRole('button', { name: 'Launch Collaborative Board' });
  await launchBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await launchBtn.click({ force: true });
  await page.waitForTimeout(3500);

  // 18. Screenshot: New Security Board
  console.log('18. Capturing newly launched Security Board...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_new_board_running.png') });

  console.log('All Playwright tests and screenshots completed successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
