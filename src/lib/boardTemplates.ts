export interface TaskTemplate {
  id: string;
  title: string;
  category: string;
  task: string;
  suggestedDuration: number; // minutes
  suggestedBudget: number; // tokens
  suggestedTurns: number;
  initialInstruction?: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-db-migration',
    title: 'Zero-Downtime Multi-Region Database Migration',
    category: 'Systems Architecture',
    task: 'Design a resilient zero-downtime database migration architecture from single-node PostgreSQL to a globally distributed multi-region setup with sub-100ms read replicas, continuous bi-directional sync, automated conflict resolution, and immediate rollback procedures.',
    suggestedDuration: 15,
    suggestedBudget: 25000,
    suggestedTurns: 20,
    initialInstruction: 'Prioritize zero data loss (RPO=0) and support containerized Kubernetes deployment.'
  },
  {
    id: 'tpl-agent-guardrails',
    title: 'Autonomous LLM Security & Guardrail Pipeline',
    category: 'AI Safety & Security',
    task: 'Formulate an end-to-end multi-layer defense against prompt injections, SSRF via agent tool execution, indirect data exfiltration, and adversarial jailbreaks for autonomous customer-facing AI agents operating in banking and fintech.',
    suggestedDuration: 20,
    suggestedBudget: 30000,
    suggestedTurns: 24,
    initialInstruction: 'Must operate under 80ms latency budget per inference request.'
  },
  {
    id: 'tpl-crdt-collaboration',
    title: 'Sub-Second Real-Time Collaborative Whiteboard',
    category: 'Real-Time Web & Frontend',
    task: 'Architect a collaborative multiplayer whiteboard supporting 500 concurrent active editors per document. Compare CRDTs (Yjs / Automerge) vs Server-authoritative Operational Transformation (OT), state vector compaction, and WebRTC fallback meshes.',
    suggestedDuration: 15,
    suggestedBudget: 20000,
    suggestedTurns: 16,
    initialInstruction: 'Must support offline editing with seamless reconnection and conflict merge.'
  },
  {
    id: 'tpl-core-web-vitals',
    title: 'Modern Core Web Vitals (INP & LCP) Optimization Engine',
    category: 'Web Performance',
    task: 'Investigate and specify an automated performance optimization architecture for large-scale Next.js / Vite web applications to guarantee 99th percentile INP < 100ms and LCP < 1.8s across mid-tier mobile devices in constrained network environments.',
    suggestedDuration: 10,
    suggestedBudget: 15000,
    suggestedTurns: 12,
    initialInstruction: 'Focus on main-thread scheduling, speculative prefetching, and asset prioritization.'
  }
];
