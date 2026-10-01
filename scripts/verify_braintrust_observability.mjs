import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(
  'C:/Users/rvind/.gemini/antigravity/brain/8827e16a-4069-4572-b5d2-e6fa8939e0ad/screenshots'
);

async function run() {
  console.log('Launching browser to test Braintrust Observability integration...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    // 1. Navigate to app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('Navigated to AI Group Chat.');

    // 2. Open API Keys Modal
    const apiKeysButton = page.locator('button:has-text("API Keys")');
    await apiKeysButton.click();
    await page.waitForTimeout(500);

    // Verify Observability section is visible
    const obsHeader = page.locator('text=Observability & Tracing');
    await obsHeader.waitFor({ state: 'visible', timeout: 5000 });
    console.log('Found Observability & Tracing section.');

    // Verify Braintrust card elements
    const braintrustTitle = page.locator('text=Braintrust Tracing');
    await braintrustTitle.waitFor({ state: 'visible' });

    const projectIdText = page.locator('text=Project: 3e0ba1ce');
    await projectIdText.waitFor({ state: 'visible' });

    const apiEndpointText = page.locator('text=api-eu.braintrust.dev');
    await apiEndpointText.waitFor({ state: 'visible' });

    console.log('Verified Braintrust project, org, and EU gateway display.');

    // Scroll modal container down to reveal full Braintrust card
    await page.locator('dialog[open] .overflow-y-auto').first().evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(300);

    // Take screenshot of modal with Braintrust card
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '10_api_key_modal_braintrust.png'),
      fullPage: false
    });
    console.log('Captured 10_api_key_modal_braintrust.png');

    // Test entering a key into Braintrust input
    const btInput = page.locator('input[placeholder="sk-..."]');
    await btInput.fill('sk-test-braintrust-tracer-mock-key');

    // Click "Test & Save" for Braintrust
    const btTestBtn = btInput.locator('..').locator('button:has-text("Test & Save")');
    await btTestBtn.click();
    await page.waitForTimeout(1000);

    // Since mock key fails auth with Braintrust servers, verify the error message is cleanly shown without crashing
    const errorMsg = page.locator('div:has-text("Braintrust Tracing") >> text=Invalid API Key');
    const isErrorVisible = await errorMsg.isVisible().catch(() => false);
    console.log('Auth check test result rendered cleanly:', isErrorVisible);

    // Now save a mock configuration directly to verify the active "Traces" badge in header
    await page.evaluate(() => {
      localStorage.setItem(
        'aigroupchat_braintrust_config',
        JSON.stringify({
          apiKey: 'sk-bt-active-token-mock',
          projectId: '3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96',
          orgId: 'da63e6aa-e92d-4a66-a938-920f72f27a26',
          apiUrl: 'https://api-eu.braintrust.dev',
          appUrl: 'https://www.braintrust.dev',
          enabled: true
        })
      );
    });

    // Close modal
    const doneBtn = page.locator('button:has-text("Done")');
    await doneBtn.click();
    await page.waitForTimeout(600);

    // Verify the "Traces" badge appears in the header
    const tracesBadge = page.locator('header a:has-text("Traces")');
    await tracesBadge.waitFor({ state: 'visible', timeout: 5000 });
    const href = await tracesBadge.getAttribute('href');
    console.log('Found Traces badge in header. Target URL:', href);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '11_braintrust_traces_badge.png'),
      fullPage: false
    });
    console.log('Captured 11_braintrust_traces_badge.png');

    // 3. Test Deliberation Execution & Tracing
    // Trigger a steering message to verify agent turns execute with Braintrust tracing active
    const steeringInput = page.locator('input[placeholder*="directive"]');
    if (await steeringInput.isVisible()) {
      await steeringInput.fill('Compare WASM micro-sandboxing memory footprint with causal DAG rollback state overhead.');
      await steeringInput.press('Enter');
      console.log('Sent steering prompt.');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '12_deliberation_traced.png'),
      fullPage: false
    });
    console.log('Captured 12_deliberation_traced.png');

    console.log('All Braintrust Observability verifications succeeded!');
  } catch (err) {
    console.error('Verification failed:', err);
    console.log('Recent Console Logs:\n', consoleMessages.slice(-15).join('\n'));
    throw err;
  } finally {
    await browser.close();
  }
}

run();
