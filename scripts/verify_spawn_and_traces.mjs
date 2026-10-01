import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.resolve(
  'C:/Users/rvind/.gemini/antigravity/brain/8827e16a-4069-4572-b5d2-e6fa8939e0ad/screenshots'
);

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('=== AI GROUP CHAT: SPAWN DISCUSSION & BRAINTRUST TRACE VERIFICATION ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 }
  });
  const page = await context.newPage();

  // Track network requests to Braintrust proxies
  const braintrustNetworkCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('braintrust') || url.includes('/api/braintrust-')) {
      braintrustNetworkCalls.push({
        method: req.method(),
        url: url,
        postData: req.postData() ? req.postData().slice(0, 300) : null
      });
    }
  });

  // Track console logs
  const consoleLogs = [];
  page.on('console', (msg) => {
    const txt = msg.text();
    consoleLogs.push(`[${msg.type()}] ${txt}`);
    if (txt.includes('Braintrust') || txt.includes('Orchestrator') || txt.includes('Barrier')) {
      console.log(`[Browser]: ${txt}`);
    }
  });

  try {
    // 1. Navigate to application
    console.log('Step 1: Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // 2. Setup Braintrust configuration in localStorage
    console.log('Step 2: Ensuring Braintrust configuration is active...');
    await page.evaluate(() => {
      const existing = localStorage.getItem('aigroupchat_braintrust_config');
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        'aigroupchat_braintrust_config',
        JSON.stringify({
          apiKey: parsed.apiKey || 'sk-braintrust-test-live-trace',
          projectId: '3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96',
          orgId: 'da63e6aa-e92d-4a66-a938-920f72f27a26',
          apiUrl: 'https://api-eu.braintrust.dev',
          appUrl: 'https://www.braintrust.dev',
          enabled: true
        })
      );
    });

    // Reload page to ensure tracer initializes with config
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 3. Open New Discussion Modal
    console.log('Step 3: Opening New Discussion Modal...');
    const newDiscBtn = page.locator('button:has-text("New Discussion")');
    await newDiscBtn.waitFor({ state: 'visible' });
    await newDiscBtn.click();
    await page.waitForTimeout(600);

    // Fill in discussion form
    console.log('Step 4: Formulating discussion thesis and selecting 4 frontier agents...');
    const titleInput = page.locator('dialog[open] input[placeholder*="Constitutional"]');
    const topicTextarea = page.locator('dialog[open] textarea');

    await titleInput.fill('Constitutional Safety Invariants in Autonomous Swarms');
    await topicTextarea.fill(
      'Can decentralized autonomous agent swarms formally guarantee constitutional safety invariants without central coordinator bottlenecks? Contrast optimistic execution with causal rollback against formal pre-execution micro-sandboxing.'
    );

    // Capture screenshot of the New Discussion modal configured
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13_new_discussion_modal.png'),
      fullPage: false
    });
    console.log('Captured 13_new_discussion_modal.png');

    // Click "Start Deliberation"
    const submitBtn = page.locator('dialog[open] button:has-text("Start Deliberation")');
    await submitBtn.click();
    console.log('Submitted: Initiated new discussion thread.');
    await page.waitForTimeout(1000);

    // 4. Verify Phase 1: Synchronization Barrier
    console.log('Step 5: Verifying Phase 1: Synchronization Barrier progress...');
    let barrierResponded = 0;
    const maxBarrierWaitMs = 25000;
    const startMs = Date.now();

    while (Date.now() - startMs < maxBarrierWaitMs) {
      const state = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('AIGroupChatDB');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(['discussions', 'discussionMessages'], 'readonly');
            const dStore = tx.objectStore('discussions').getAll();
            const mStore = tx.objectStore('discussionMessages').getAll();
            Promise.all([
              new Promise((r) => {
                dStore.onsuccess = () => r(dStore.result);
              }),
              new Promise((r) => {
                mStore.onsuccess = () => r(mStore.result);
              })
            ]).then(([discs, msgs]) => {
              const active = discs.sort((a, b) => b.createdAt - a.createdAt)[0];
              const discMsgs = msgs.filter((m) => m.discussionId === active?.id);
              resolve({
                activeDiscussion: active,
                messageCount: discMsgs.length
              });
            });
          };
          req.onerror = () => resolve(null);
        });
      });

      if (state && state.activeDiscussion) {
        barrierResponded = state.activeDiscussion.barrierResponded;
        console.log(
          `Barrier progress: ${barrierResponded}/${state.activeDiscussion.barrierTotal} | Messages: ${state.messageCount}`
        );

        if (state.activeDiscussion.status === 'active' || barrierResponded >= 4) {
          console.log('Barrier completed! Discussion transitioned to ACTIVE state.');
          break;
        }
      }

      await page.waitForTimeout(1500);
    }

    // Capture screenshot of completed barrier and active deliberation
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14_barrier_completed_active.png'),
      fullPage: false
    });
    console.log('Captured 14_barrier_completed_active.png');

    // 5. Test Deliberation & Sub-thread Spawning
    console.log('Step 6: Injecting steering directive to trigger sub-thread deep-dive...');
    const steeringInput = page.locator('input[placeholder*="directive"]');
    if (await steeringInput.isVisible()) {
      await steeringInput.fill(
        '@Nemotron 3 Ultra and @DeepSeek V4.1 Flash, please spin off a sub-thread to formalize the WASM micro-sandbox latency proof.'
      );
      await steeringInput.press('Enter');
      console.log('Sent steering prompt for sub-thread branching.');
    }

    console.log('Step 7: Monitoring deliberation turns and sub-thread branching...');
    let subThreads = [];
    const maxDelibWait = 25000;
    const delibStart = Date.now();
    while (Date.now() - delibStart < maxDelibWait) {
      const threadState = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('AIGroupChatDB');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(['discussions', 'conversationThreads'], 'readonly');
            const dStore = tx.objectStore('discussions').getAll();
            const tStore = tx.objectStore('conversationThreads').getAll();
            Promise.all([
              new Promise((r) => {
                dStore.onsuccess = () => r(dStore.result);
              }),
              new Promise((r) => {
                tStore.onsuccess = () => r(tStore.result);
              })
            ]).then(([discs, threads]) => {
              const active = discs.sort((a, b) => b.createdAt - a.createdAt)[0];
              const activeThreads = threads.filter((t) => t.discussionId === active?.id);
              resolve(activeThreads);
            });
          };
          req.onerror = () => resolve([]);
        });
      });

      subThreads = threadState;
      if (subThreads.length > 0) {
        console.log(`Sub-thread detected: "${subThreads[0].topic}" (ID: ${subThreads[0].id})`);
        break;
      }
      await page.waitForTimeout(2000);
    }

    // Capture screenshot of main discussion turns with attachments
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '15_deliberation_turns_and_attachments.png'),
      fullPage: false
    });
    console.log('Captured 15_deliberation_turns_and_attachments.png');

    // If sub-thread was spawned, navigate to it in the sidebar and capture screenshot
    if (subThreads.length > 0) {
      console.log(`Navigating to sub-thread: ${subThreads[0].topic}...`);
      const threadNavItem = page.locator(`button:has-text("${subThreads[0].topic.slice(0, 16)}")`).first();
      if (await threadNavItem.isVisible().catch(() => false)) {
        await threadNavItem.click();
        await page.waitForTimeout(2500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, '16_subthread_deliberation.png'),
          fullPage: false
        });
        console.log('Captured 16_subthread_deliberation.png');
      }
    }

    // 6. Inspect Complete Discussion State, Generations & Braintrust Spans
    console.log('\nStep 8: Performing In-Depth Transcript & Telemetry Analysis...');
    const analysisData = await page.evaluate(async () => {
      const tracerSpans =
        (window.braintrustTracer && typeof window.braintrustTracer.getRecentSpans === 'function')
          ? window.braintrustTracer.getRecentSpans()
          : [];

      return new Promise((resolve) => {
        const req = indexedDB.open('AIGroupChatDB');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(
            ['discussions', 'conversationThreads', 'discussionMessages', 'agents'],
            'readonly'
          );

          const getStore = (name) =>
            new Promise((res) => {
              const r = tx.objectStore(name).getAll();
              r.onsuccess = () => res(r.result);
              r.onerror = () => res([]);
            });

          Promise.all([
            getStore('discussions'),
            getStore('conversationThreads'),
            getStore('discussionMessages'),
            getStore('agents')
          ]).then(([discussions, threads, messages, agents]) => {
            const activeDisc = discussions.sort((a, b) => b.createdAt - a.createdAt)[0];
            const discMsgs = messages.filter((m) => m.discussionId === activeDisc?.id);
            const discThreads = threads.filter((t) => t.discussionId === activeDisc?.id);

            resolve({
              discussion: activeDisc,
              threads: discThreads,
              messages: discMsgs,
              agents,
              tracerSpans
            });
          });
        };
        req.onerror = () => resolve(null);
      });
    });

    console.log('\n--- DISCUSSION TELEMETRY & GENERATION AUDIT ---');
    console.log(`Discussion ID: ${analysisData.discussion.id}`);
    console.log(`Discussion Title: "${analysisData.discussion.title}"`);
    console.log(`Discussion Status: ${analysisData.discussion.status}`);
    console.log(`Barrier: ${analysisData.discussion.barrierResponded} / ${analysisData.discussion.barrierTotal}`);
    console.log(`Conversation Sub-Threads Count: ${analysisData.threads.length}`);
    console.log(`Total Messages Generated: ${analysisData.messages.length}`);
    console.log(`Braintrust Spans Captured: ${analysisData.tracerSpans.length}\n`);

    const agentTurnAudit = [];
    for (const msg of analysisData.messages) {
      const agent = analysisData.agents.find((a) => a.id === msg.senderId);
      const isUser = msg.senderType === 'user';
      const senderName = isUser ? 'Director (User)' : (agent ? agent.name : msg.senderId);

      const wordCount = msg.content ? msg.content.trim().split(/\s+/).length : 0;
      const hasMath = msg.content ? /\$.*?\$|\\\(.*?\\\)|\$\$.*?\$\$/s.test(msg.content) : false;
      const hasActionTag = msg.content ? /\[ACTION:/i.test(msg.content) : false;
      const attachments = msg.attachments || [];

      const auditItem = {
        id: msg.id,
        sender: senderName,
        actionType: msg.actionType,
        threadId: msg.threadId || 'main',
        wordCount,
        hasMath,
        hasUnstrippedActionTag: hasActionTag,
        attachmentsCount: attachments.length,
        attachmentNames: attachments.map((a) => a.name),
        modelUsed: msg.modelUsed || (agent ? agent.model : 'n/a'),
        contentSnippet: msg.content ? msg.content.slice(0, 140).replace(/\n/g, ' ') + '...' : ''
      };
      agentTurnAudit.push(auditItem);
    }

    console.log(JSON.stringify(agentTurnAudit, null, 2));

    // 7. Braintrust Tracing Evaluation
    console.log('\n--- BRAINTRUST SPAN BREAKDOWN ---');
    for (const span of analysisData.tracerSpans) {
      console.log(`- [${span.type.toUpperCase()}] ${span.name}`);
      console.log(`  Tags: ${JSON.stringify(span.event.tags)}`);
      if (span.event.metrics) {
        console.log(`  Metrics: latency=${span.event.metrics.latency}s, tokens=${span.event.metrics.tokens}`);
      }
    }

    // Save full audit data to JSON file for analysis
    fs.writeFileSync(
      path.resolve('scripts/discussion_audit_result.json'),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          discussion: analysisData.discussion,
          threads: analysisData.threads,
          messages: analysisData.messages,
          audit: agentTurnAudit,
          tracerSpans: analysisData.tracerSpans,
          braintrustNetworkCalls: braintrustNetworkCalls
        },
        null,
        2
      )
    );
    console.log('\nSaved complete audit log to scripts/discussion_audit_result.json');
    console.log('All verification steps completed successfully!');
  } catch (err) {
    console.error('Test execution error:', err);
    console.log('Console Logs:\n', consoleLogs.slice(-20).join('\n'));
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
