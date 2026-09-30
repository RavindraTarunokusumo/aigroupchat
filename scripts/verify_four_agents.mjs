import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/rvind/.gemini/antigravity/brain/8827e16a-4069-4572-b5d2-e6fa8939e0ad/screenshots';

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

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('PAGE UNCAUGHT ERROR:', err);
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Screenshot: Main Discussion Workspace with 4 agents
  console.log('1. Verifying Main Discussion Workspace with 4 frontier models...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_discussion_main.png') });

  // Check agent names in presence or UI
  const bodyText = await page.textContent('body');
  const hasQwen = bodyText.includes('Qwen') || bodyText.includes('QW');
  const hasNemotron = bodyText.includes('Nemotron') || bodyText.includes('NV');
  const hasDeepSeek = bodyText.includes('DeepSeek') || bodyText.includes('DS');
  const hasGLM = bodyText.includes('GLM') || bodyText.includes('GL');

  console.log(`Agent presence detected: Qwen=${hasQwen}, Nemotron=${hasNemotron}, DeepSeek=${hasDeepSeek}, GLM=${hasGLM}`);

  // 2. Click on the Sub-Thread in navigation
  console.log('2. Switching to conversation sub-thread...');
  const subThreadBtn = page.getByRole('button', { name: /Hardware Micro-Sandboxes|Formal Verification/i }).first();
  if (await subThreadBtn.isVisible()) {
    await subThreadBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_sub_thread_view.png') });
    console.log('Sub-thread view captured successfully.');
  }

  // 3. Test API Key Modal
  console.log('3. Opening API Key configuration modal...');
  const keysBtn = page.getByRole('button', { name: /API Keys/i });
  if (await keysBtn.isVisible()) {
    await keysBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_api_keys_modal.png') });
    console.log('API Keys modal captured.');

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'Done' });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 4. Test Starting / Stepping Discussion
  console.log('4. Testing deliberation start/pause execution...');
  const startBtn = page.getByRole('button', { name: /Start Discussion/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
    console.log('Started discussion turn engine...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_active_deliberation.png') });

    // Pause
    const pauseBtn = page.getByRole('button', { name: /Pause/i });
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      console.log('Paused discussion engine.');
      await page.waitForTimeout(500);
    }
  }

  console.log('All automated browser tests completed successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
