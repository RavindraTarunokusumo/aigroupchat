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
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Screenshot: Chat Page
  console.log('Taking screenshot of Chat Page...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_chat_page.png'), fullPage: false });

  // 2. Click "Message Board" in the top navigation switcher
  console.log('Switching to Message Board...');
  const boardNavBtn = page.getByRole('button', { name: 'Message Board' });
  await boardNavBtn.click();
  await page.waitForTimeout(1000);

  // 3. Screenshot: Initial Message Board View
  console.log('Taking screenshot of Message Board Stream View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_board_stream_view.png'), fullPage: false });

  // 4. Switch to Kanban View
  console.log('Switching to Kanban Column View...');
  const kanbanBtn = page.locator('button[title="Column / Kanban view"]');
  await kanbanBtn.click();
  await page.waitForTimeout(500);

  // 5. Screenshot: Kanban View
  console.log('Taking screenshot of Kanban View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_board_kanban_view.png'), fullPage: false });

  // Switch back to Stream View
  const streamBtn = page.locator('button[title="Stream view"]');
  await streamBtn.click();
  await page.waitForTimeout(300);

  // 6. Click "+ Add Instruction"
  console.log('Opening Add Instruction Modal...');
  const addInstBtn = page.getByRole('button', { name: 'Add Instruction' });
  await addInstBtn.click();
  await page.waitForTimeout(500);

  // 7. Screenshot: Add Instruction Modal
  console.log('Taking screenshot of Add Instruction Modal...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_add_instruction_modal.png'), fullPage: false });

  // 8. Type instruction and submit
  console.log('Submitting extra directive...');
  await page.fill('#instruction-input', 'Must achieve zero data loss (RPO=0) under simulated availability zone partition and run on AWS Graviton3.');
  const injectBtn = page.getByRole('button', { name: 'Inject Directive' });
  await injectBtn.click();
  await page.waitForTimeout(800);

  // 9. Screenshot: Board with Injected Instruction
  console.log('Taking screenshot with new directive added...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_directive_added.png'), fullPage: false });

  // 10. Click "Resume" to start autonomous collaboration
  console.log('Resuming autonomous execution...');
  const resumeBtn = page.getByRole('button', { name: /Resume|Restart|Start/i });
  await resumeBtn.click();

  // Wait for autonomous turns to progress
  console.log('Waiting for autonomous agent execution (5s)...');
  await page.waitForTimeout(5500);

  // 11. Screenshot: Board during autonomous execution
  console.log('Taking screenshot of active autonomous execution...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_autonomous_execution.png'), fullPage: false });

  // 12. Pause the board
  console.log('Pausing execution...');
  const pauseBtn = page.getByRole('button', { name: 'Pause' });
  if (await pauseBtn.isVisible()) {
    await pauseBtn.click();
    await page.waitForTimeout(500);
  }

  // 13. Open "Assign New Task Board" modal
  console.log('Opening New Board Task Modal...');
  const newBoardBtn = page.getByRole('button', { name: /New Board|Assign New Task/i }).first();
  await newBoardBtn.click();
  await page.waitForTimeout(600);

  // 14. Screenshot: New Task Modal
  console.log('Taking screenshot of New Task Modal...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_new_task_modal.png'), fullPage: false });

  // 15. Select a preset template: Autonomous LLM Security
  console.log('Selecting security template...');
  const secTplBtn = page.getByRole('button', { name: /Autonomous LLM Security/i });
  await secTplBtn.scrollIntoViewIfNeeded();
  await secTplBtn.click();
  await page.waitForTimeout(400);

  // Submit new board
  console.log('Submitting new board...');
  const launchBtn = page.getByRole('button', { name: 'Launch Collaborative Board' });
  await launchBtn.scrollIntoViewIfNeeded();
  await launchBtn.click();
  await page.waitForTimeout(3500);

  // 16. Screenshot: Newly created board running
  console.log('Taking screenshot of new board...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_new_board_running.png'), fullPage: false });

  await browser.close();
  console.log('Verification completed successfully! All screenshots saved.');
}

run().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
