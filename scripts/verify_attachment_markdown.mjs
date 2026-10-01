import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/rvind/.gemini/antigravity/brain/8827e16a-4069-4572-b5d2-e6fa8939e0ad/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser to test attachment markdown formatting...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('PAGE UNCAUGHT ERROR:', err);
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Inject a multiline document attachment with tables, code blocks, lists, and math via Dexie
  console.log('Inserting test message with rich markdown attachment...');
  await page.evaluate(async () => {
    const { db } = await import('/src/lib/db.ts');
    const disc = (await db.discussions.toArray())[0];
    if (!disc) return;

    const testMsg = {
      id: `dmsg-test-${Date.now()}`,
      discussionId: disc.id,
      threadId: null,
      senderId: 'agent-deepseek',
      senderType: 'agent',
      actionType: 'reply_main',
      content: 'I have attached our complete Constitutional AI Swarm specification with guardrails, complexity analysis, and verification hooks.',
      timestamp: Date.now(),
      attachments: [
        {
          id: `att-test-${Date.now()}`,
          name: 'constitutional_ai_swarm.md',
          title: 'Constitutional AI in Agent Swarm Framework',
          type: 'markdown',
          language: 'markdown',
          content: `\`\`\`markdown
# Constitutional AI in Autonomous Agent Swarms

### 1. Foundational Guardrails
- **Invariant A**: Non-destructive action policies must be verified before side-effects.
- **Invariant B**: Distributed consensus threshold $\\gamma \\ge 0.85$ required for root actions.

### 2. Verification Performance Matrix
| Mechanism | Complexity | Latency Tax | Isolation |
| :--- | :--- | :--- | :--- |
| Hardware MicroVM | $O(1)$ | $\\le 2\\text{ms}$ | Process Boundary |
| Causal DAG Rollback | $O(N)$ | $\\le 15\\text{ms}$ | State Reversion |

### 3. Implementation Blueprint
\`\`\`python
def verify_swarm_constitution(action, invariants):
    for inv in invariants:
        if not inv.check(action):
            raise ConstitutionViolation(inv.name)
    return True
\`\`\`
\`\`\``,
          summary: 'Constitutional AI framework with invariance proofs and implementation blueprint.'
        }
      ]
    };

    await db.discussionMessages.add(testMsg);
  });

  await page.waitForTimeout(1000);

  // Expand the newly added document attachment preview
  console.log('Expanding newly inserted document attachment preview...');
  const lastPreviewBtn = page.getByRole('button', { name: /Preview/i }).last();
  await lastPreviewBtn.waitFor({ state: 'visible' });
  await lastPreviewBtn.click();
  await page.waitForTimeout(1000);

  // Check all rich elements
  const headings = await page.locator('.overflow-x-auto h1, .overflow-x-auto h3').count();
  const bullets = await page.locator('.overflow-x-auto li').count();
  const tables = await page.locator('.overflow-x-auto table').count();
  const codeBlocks = await page.locator('.overflow-x-auto pre code').count();
  const mathElements = await page.locator('.overflow-x-auto .katex').count();

  console.log(`Rich document preview stats: Headings=${headings}, Bullets=${bullets}, Tables=${tables}, CodeBlocks=${codeBlocks}, KaTeX=${mathElements}`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_attachment_markdown_formatting.png') });
  console.log('Saved screenshot 09_attachment_markdown_formatting.png');

  if (headings === 0 || bullets === 0 || tables === 0 || codeBlocks === 0 || mathElements === 0) {
    throw new Error('Rich markdown elements failed to render properly!');
  }

  console.log('All rich attachment markdown formatting verified successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
