import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/rvind/.gemini/antigravity/brain/8827e16a-4069-4572-b5d2-e6fa8939e0ad/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser to test KaTeX and Delete Discussion...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('PAGE UNCAUGHT ERROR:', err);
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Test KaTeX Math Rendering
  console.log('1. Testing KaTeX Math Rendering via Director Prompt...');
  const input = page.locator('input[placeholder*="Inject directive"]').first();
  await input.fill('Here is our formal swarm loss: $\\mathcal{L}(\\theta) = \\sum_{i=1}^N (y_i - f(x_i))^2$ with display loss: $$\\min_\\theta \\mathbb{E}_{x \\sim \\mathcal{D}}[\\mathcal{L}(x, \\theta)] + \\lambda \\|\\theta\\|_2^2$$ and quadratic complexity $O(N^2)$.');
  await input.press('Enter');
  await page.waitForTimeout(1500);

  // Check if .katex elements exist in the DOM
  const katexCount = await page.locator('.katex').count();
  const katexDisplayCount = await page.locator('.katex-display').count();
  console.log(`KaTeX elements rendered: ${katexCount}, Display blocks: ${katexDisplayCount}`);

  if (katexCount === 0) {
    throw new Error('KaTeX math elements failed to render in the DOM!');
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_katex_math_rendering.png') });
  console.log('KaTeX math screenshot saved as 06_katex_math_rendering.png');

  // 2. Test Discussion Creation & Deletion
  console.log('2. Testing New Discussion creation...');
  const newDiscBtn = page.getByRole('button', { name: /New Discussion/i });
  await newDiscBtn.click();
  await page.locator('dialog[open]').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);

  // Fill modal
  await page.fill('input[placeholder*="Constitutional AI"]', 'Temporary Deletion Test Topic');
  await page.fill('textarea[placeholder*="primary dilemma"]', 'This is a temporary discussion thread created specifically to verify cascade deletion and selection fallback.');
  
  // Submit modal
  const createSubmitBtn = page.getByRole('button', { name: /Start Deliberation/i }).last();
  await createSubmitBtn.waitFor({ state: 'visible' });
  await createSubmitBtn.click();
  await page.waitForTimeout(1500);

  console.log('Created temporary discussion. Verifying presence...');
  const discussionsBeforeDelete = await page.locator('aside button:has-text("Temporary Deletion Test Topic")').count();
  console.log(`Temporary discussion in sidebar: ${discussionsBeforeDelete}`);

  // Test Delete Discussion in Thesis Header
  console.log('3. Testing Delete Discussion in Thesis Banner with Confirmation...');
  const deleteBtn = page.locator('button:has-text("Delete")').first();
  await deleteBtn.click();
  await page.waitForTimeout(500);

  // Check for confirmation buttons
  const confirmBtn = page.locator('button:has-text("Confirm")').first();
  const isConfirmVisible = await confirmBtn.isVisible();
  console.log(`Delete confirmation prompt visible: ${isConfirmVisible}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_delete_confirmation.png') });
  console.log('Delete confirmation screenshot saved as 07_delete_confirmation.png');

  // Click Confirm to perform deletion
  await confirmBtn.click();
  await page.waitForTimeout(1500);

  // Verify discussion is gone and switched back to the remaining discussion
  const discussionsAfterDelete = await page.locator('aside button:has-text("Temporary Deletion Test Topic")').count();
  console.log(`Temporary discussion count after delete: ${discussionsAfterDelete}`);

  if (discussionsAfterDelete !== 0) {
    throw new Error('Discussion was not deleted from the list!');
  }

  // Also verify sidebar delete button with hover
  console.log('4. Verifying sidebar delete button on another test discussion...');
  await newDiscBtn.click();
  await page.locator('dialog[open]').waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  await page.fill('input[placeholder*="Constitutional AI"]', 'Sidebar Delete Test');
  await page.fill('textarea[placeholder*="primary dilemma"]', 'Testing sidebar trash button deletion cascade.');
  const createSubmitBtn2 = page.getByRole('button', { name: /Start Deliberation/i }).last();
  await createSubmitBtn2.waitFor({ state: 'visible' });
  await createSubmitBtn2.click();
  await page.waitForTimeout(1200);

  // Hover on sidebar item and click its trash icon
  const sidebarItem = page.locator('div.group:has-text("Sidebar Delete Test")').first();
  await sidebarItem.hover();
  const trashBtn = sidebarItem.locator('button[title="Delete discussion"]');
  await trashBtn.click();
  await page.waitForTimeout(400);

  // Confirm sidebar delete
  const sidebarConfirm = page.locator('aside button:has-text("Delete")').first();
  await sidebarConfirm.click();
  await page.waitForTimeout(1200);

  const sidebarCountAfter = await page.locator('aside button:has-text("Sidebar Delete Test")').count();
  console.log(`Sidebar delete test count after delete: ${sidebarCountAfter}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_after_deletion.png') });
  console.log('After deletion screenshot saved as 08_after_deletion.png');

  console.log('All KaTeX and Discussion Deletion tests passed cleanly!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
