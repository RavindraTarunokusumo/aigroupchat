import { chromium } from 'playwright';

async function main() {
  console.log('Opening browser to inspect AIGroupChatDB...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('AIGroupChatDB');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(
          ['discussions', 'conversationThreads', 'discussionMessages', 'apiKeys', 'agents'],
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
          getStore('apiKeys'),
          getStore('agents')
        ]).then(([discussions, threads, messages, keys, agents]) => {
          resolve({
            discussionsCount: discussions.length,
            discussions: discussions.map((d) => ({
              id: d.id,
              title: d.title,
              topic: d.topic,
              status: d.status,
              barrierResponded: d.barrierResponded,
              barrierTotal: d.barrierTotal,
              activeAgentIds: d.activeAgentIds
            })),
            threadsCount: threads.length,
            threads: threads.map((t) => ({
              id: t.id,
              discussionId: t.discussionId,
              topic: t.topic,
              status: t.status,
              turnCount: t.turnCount
            })),
            messagesCount: messages.length,
            recentMessages: messages.slice(-5).map((m) => ({
              id: m.id,
              senderId: m.senderId,
              actionType: m.actionType,
              threadId: m.threadId,
              hasAttachments: Boolean(m.attachments && m.attachments.length > 0),
              attachments: m.attachments?.map((a) => a.name),
              snippet: m.content ? m.content.slice(0, 100) : ''
            })),
            keys: keys.map((k) => ({
              id: k.id,
              provider: k.provider,
              hasKey: Boolean(k.key),
              keyPreview: k.key ? `${k.key.slice(0, 7)}...` : null
            })),
            agents: agents.map((a) => ({
              id: a.id,
              name: a.name,
              model: a.model,
              provider: a.provider
            })),
            braintrustConfig: localStorage.getItem('aigroupchat_braintrust_config')
          });
        });
      };
      req.onerror = () => resolve({ error: 'Failed to open DB' });
    });
  });

  console.log('INSPECT_RESULT_START');
  console.log(JSON.stringify(data, null, 2));
  console.log('INSPECT_RESULT_END');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
