# Observability & Tracing with Braintrust

## 1. Overview
**AI Group Chat** integrates Braintrust as a first-class observability, tracing, and prompt evaluation platform. Operating within our client-first, BYOK architecture, all multi-agent deliberation sessions, conversation sub-threads, agent turns, prompts, structured actions, file attachments, token counts, and latencies are streamed and logged to Braintrust in real time.

---

## 2. Configuration & Credentials

### Default Target Parameters
* **Project ID**: `3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96`
* **Organization ID**: `da63e6aa-e92d-4a66-a938-920f72f27a26`
* **API Data Plane Gateway**: `https://api-eu.braintrust.dev` (EU Data Plane)
* **Application URL**: `https://www.braintrust.dev`
* **Direct Logs URL**: `https://www.braintrust.dev/app/~/logs?project_id=3e0ba1ce-e50d-4c77-ac7d-4b715e83ad96`

### Key Storage & Privacy
* The user's Braintrust API key (format: `sk-...`) is entered in the **BYOK API Credentials** dialog.
* Keys are stored across both browser `localStorage` (`aigroupchat_braintrust_config`) and IndexedDB (`db.apiKeys` table), with automatic bi-directional synchronization via `syncBraintrustConfigFromDb()`.
* Environment variable fallbacks (`VITE_BRAINTRUST_API_KEY` and `BRAINTRUST_API_KEY`) are supported for automated and CI setups.
* An enable/disable toggle allows users to pause or resume trace logging at any time without clearing their credentials.

### Local Development Proxy Architecture (CORS Bypass)
When running locally (`localhost` / `127.0.0.1`), browser cross-origin requests to Braintrust's data plane (`https://api-eu.braintrust.dev`) are restricted by browser CORS preflight policies. To guarantee seamless telemetry ingestion:
1. `createProxiedFetch()` wraps `initLogger` network requests, automatically redirecting requests targeted at `api-eu.braintrust.dev`, `api.braintrust.dev`, and `www.braintrust.dev` to `/api/braintrust-eu`, `/api/braintrust-api`, and `/api/braintrust-app`.
2. Vite dev server proxies (`vite.config.ts`) forward these calls server-to-server with `changeOrigin: true`, avoiding any browser CORS drops and ensuring reliable ingestion into Braintrust cloud.

---

## 3. Distributed Trace Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    Discussion Swarm Root Session                                   |
|   Span Type: 'task'                                                                                |
|   Name: "Discussion: <Discussion Title>"                                                           |
|   Metadata: discussionId, barrierTotal, activeAgentIds                                             |
|   Tags: ['ai-group-chat', 'discussion-session']                                                    |
+----------------------------------------------------------------------------------------------------+
                                      |
       +------------------------------+------------------------------+
       |                                                             |
       v                                                             v
+---------------------------------------------+       +---------------------------------------------+
|    Conversation Sub-Thread Spawn Span       |       |              Agent Turn Span                |
|   Span Type: 'task'                         |       |   Span Type: 'llm'                          |
|   Name: "Spawn Sub-Thread: <Topic>"         |       |   Name: "<Agent Name>: <Action Type>"       |
|   Input: topic, initiator, participants     |       |   Input: systemPrompt, messages, context    |
|   Tags: ['ai-group-chat', 'sub-thread']     |       |   Output: rawOutput, cleanMarkdown, actions |
+---------------------------------------------+       |   Metrics: latency (s), tokens (est)        |
                                                      |   Tags: [provider, model, 'live'|'simulated']|
                                                      +---------------------------------------------+
```

---

## 4. Spans & Event Data Model

Each deliberation turn generates an `llm` span containing:
1. **Input Context**:
   - `systemPrompt`: The complete system persona and deliberation guidelines passed to the model.
   - `messages`: Array of conversation turns (role, name, content) assembled using the Parent Lineage + Threshold Recency model.
   - `discussionTopic`: Root thesis being deliberated.
   - `threadContext`: Sub-thread topic or `"Main Discussion Thread"`.
   - `phase`: Synchronization Barrier vs. Concurrent Deliberation.
2. **Output & Artifacts**:
   - `content`: Clean, formatted markdown response.
   - `rawOutput`: Raw LLM generation text prior to tag stripping.
   - `actionType`: `initial_response` | `reply_main` | `reply_thread` | `spawn_thread` | `synthesize_to_main`.
   - `spawnedTopic`: Topic title if the agent branched a new sub-thread.
   - `mentions`: Tagged agent colleague IDs.
   - `attachmentsCount` & `attachments`: Metadata of structured specifications or code blobs attached to the message.
3. **Execution Metrics**:
   - `latency`: Total request duration in seconds.
   - `tokens`: Estimated or actual tokens consumed.
4. **Metadata & Tags**:
   - `agentId`, `agentName`, `agentRole`, `provider`, `model`, `temperature`.
   - `isLive`: `true` if executed via BYOK API key; `false` if high-fidelity simulation.
   - `status`: `'success'` or `'error'` (with full error trace logged upon failure).

---

## 5. UI Integration

* **Header Traces Badge**: When Braintrust is configured and active, a subtle pill button (`~ Traces ↗`) appears in the masthead. Clicking it immediately opens the Braintrust project log dashboard.
* **Credentials Modal**: Dedicated card with live status badges (`active`, `disabled`), credential validation ("Test & Save"), direct documentation links, and endpoint configuration.

---

## 6. Verification & Telemetry Audit

* **In-Memory Trace Buffer**: `braintrustTracer.getRecentSpans()` maintains an immutable queue of the latest spans captured during the active browser session, exposed via `window.braintrustTracer`. This allows developers and automated test harnesses (`scripts/verify_spawn_and_traces.mjs`) to audit the exact trace schema, latency numbers, and token metrics even in offline or mock environments.
* **End-to-End Validation**: Run `node scripts/verify_spawn_and_traces.mjs` to launch a headless browser session, formulate a new multi-agent thesis, execute Phase 1 barrier synchronization, branch sub-threads, and inspect live trace spans.

