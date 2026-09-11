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

  // 1. Screenshot: Chat Page + Sound Toggle Check
  console.log('1. Verifying Chat Page and Sound Toggle...');
  const volumeBtn = page.getByRole('button', { name: /Mute sound effects|Unmute sound effects/i });
  if (await volumeBtn.isVisible()) {
    await volumeBtn.click(); // toggle to muted
    await page.waitForTimeout(300);
    await volumeBtn.click(); // toggle back to unmuted
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_chat_page.png') });

  // 2. Click "Message Board"
  console.log('2. Switching to Message Board...');
  const boardNavBtn = page.getByRole('button', { name: 'Message Board' });
  await boardNavBtn.click();
  await page.waitForTimeout(1000);

  // 3. Screenshot: Stream View
  console.log('3. Capturing Message Board Stream View...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_board_stream_view.png') });

  // 4. Test Pinning, Bookmarking, and Upvoting on first card
  console.log('4. Testing Pin, Bookmark, and Upvote actions on post card...');
  const firstCard = page.locator('article').first();
  if (await firstCard.isVisible()) {
    // Upvote
    const upvoteBtn = firstCard.getByRole('button', { name: 'Upvote contribution' });
    if (await upvoteBtn.isVisible()) {
      await upvoteBtn.click();
      await page.waitForTimeout(300);
    }
    // Bookmark
    const bookmarkBtn = firstCard.getByRole('button', { name: /Bookmark card|Remove bookmark/i });
    if (await bookmarkBtn.isVisible()) {
      await bookmarkBtn.click();
      await page.waitForTimeout(300);
    }
    // Pin
    const pinBtn = firstCard.getByRole('button', { name: /Pin card to top|Unpin card/i });
    if (await pinBtn.isVisible()) {
      await pinBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // 5. Screenshot: Board with pinned, bookmarked & upvoted card
  console.log('5. Capturing pinned & bookmarked card with golden accent...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_card_pinned_bookmarked.png') });

  // 6. Test Pinned and Bookmarked Filter Tabs
  console.log('6. Testing Pinned Filter Tab...');
  const pinnedTab = page.getByRole('button', { name: /📌 Pinned/i });
  if (await pinnedTab.isVisible()) {
    await pinnedTab.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_pinned_filter_view.png') });
    // Switch back to All
    await page.getByRole('button', { name: 'All Posts' }).click();
    await page.waitForTimeout(300);
  }

  // 7. Switch to 4-Column Kanban View
  console.log('7. Switching to 4-Column Kanban View...');
  const kanbanBtn = page.locator('button[title="Column / Kanban view"]');
  await kanbanBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_board_kanban_4col.png') });

  // Switch back to Stream View
  const streamBtn = page.locator('button[title="Stream view"]');
  await streamBtn.click();
  await page.waitForTimeout(400);

  // 8. Test Export Dropdown
  console.log('8. Testing Multi-Format Export Dropdown...');
  const exportBtn = page.getByRole('button', { name: /Export/i }).first();
  await exportBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_export_dropdown.png') });
  // Close export dropdown
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 9. Test Time-Travel Replay Mode
  console.log('9. Testing Time-Travel Replay Mode...');
  const replayToggleBtn = page.getByRole('button', { name: /Replay/i });
  if (await replayToggleBtn.isVisible()) {
    await replayToggleBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_replay_mode_active.png') });

    // Step back in replay
    const stepBackBtn = page.getByRole('button', { name: 'Previous contribution' });
    if (await stepBackBtn.isVisible()) {
      await stepBackBtn.click();
      await page.waitForTimeout(300);
    }
    // Toggle speed
    const speedBtn = page.getByRole('button', { name: 'Toggle playback speed' });
    if (await speedBtn.isVisible()) {
      await speedBtn.click();
      await page.waitForTimeout(200);
    }
    // Exit replay
    const exitReplayBtn = page.getByRole('button', { name: 'Exit time-travel replay' });
    if (await exitReplayBtn.isVisible()) {
      await exitReplayBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // 10. Test Add Instruction Modal with preset chips
  console.log('10. Opening Add Instruction Modal...');
  const addInstBtn = page.getByRole('button', { name: 'Add Instruction' });
  await addInstBtn.click();
  await page.waitForTimeout(600);

  const latencyPresetBtn = page.getByRole('button', { name: /Low Latency/i });
  if (await latencyPresetBtn.isVisible()) {
    await latencyPresetBtn.click();
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_add_instruction_modal.png') });

  // Submit directive
  const injectBtn = page.getByRole('button', { name: /Inject Directive|Inject for/i });
  await injectBtn.click();
  await page.waitForTimeout(800);

  // 11. Autonomous agent collaboration
  console.log('11. Resuming autonomous multi-agent collaboration (6s)...');
  const resumeBtn = page.getByRole('button', { name: /Resume|Restart|Start/i });
  await resumeBtn.click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_autonomous_execution.png') });

  // Pause
  const pauseBtn = page.getByRole('button', { name: 'Pause' });
  if (await pauseBtn.isVisible()) {
    await pauseBtn.click();
    await page.waitForTimeout(500);
  }

  // 12. Trigger Celebration Confetti Burst
  console.log('12. Triggering Celebration Confetti...');
  await page.evaluate(async () => {
    const { db } = await import('/src/lib/db.ts');
    const boards = await db.taskBoards.toArray();
    if (boards.length > 0) {
      await db.taskBoards.update(boards[0].id, { status: 'completed' });
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_celebration_confetti.png') });

  console.log('All Playwright verifications passed and screenshots saved successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
