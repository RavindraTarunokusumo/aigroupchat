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
    id: 'tpl-deep-research-ai-memory',
    title: 'State of the Art in Agentic Memory & Long-Horizon Reasoning',
    category: 'Deep Research',
    task: 'Conduct an exhaustive deep research survey on memory architectures for autonomous LLM swarms. Compare hierarchical episodic memory, knowledge graphs, semantic vector retrieval, and self-reflection loops. Synthesize state-of-the-art benchmarks and identify open research challenges.',
    suggestedDuration: 15,
    suggestedBudget: 25000,
    suggestedTurns: 12,
    initialInstruction: 'Include empirical benchmark citations, trade-off comparisons, and concrete theoretical frameworks.'
  },
  {
    id: 'tpl-semi-geopolitics',
    title: 'Global Semiconductor Geopolitics & Supply Chain Resilience',
    category: 'Deep Research',
    task: 'Produce a comprehensive strategic research brief on the global advanced semiconductor supply chain. Analyze chokepoints in EUV lithography, advanced packaging (CoWoS), raw materials (gallium, germanium, rare earths), and geopolitical redundancy strategies across North America, Europe, and Asia-Pacific.',
    suggestedDuration: 20,
    suggestedBudget: 30000,
    suggestedTurns: 15,
    initialInstruction: 'Focus on verifiable geopolitical facts, technological chokepoints, and strategic risk modeling.'
  },
  {
    id: 'tpl-whitepaper-post-agi',
    title: 'Whitepaper: Post-AGI Economic Reallocation & Policy Governance',
    category: 'Plain Text Writing',
    task: 'Author an executive-level whitepaper exploring the structural economic and policy transformations following transformative AI. Formulate detailed proposals for compute-based taxation, decentralized sovereign wealth dividends, workforce transition frameworks, and international oversight accords.',
    suggestedDuration: 20,
    suggestedBudget: 30000,
    suggestedTurns: 14,
    initialInstruction: 'Structure with formal whitepaper conventions: Executive Summary, Macroeconomic Trajectories, Policy Blueprints, and Conclusion.'
  },
  {
    id: 'tpl-quantum-neuromorphic',
    title: 'Comparative Survey: Neuromorphic Silicon vs Quantum AI',
    category: 'Deep Research',
    task: 'Compile a rigorous academic-style comparative review analyzing Spiking Neural Networks (SNNs) on event-driven neuromorphic processors (Intel Loihi, BrainScaleS) against Quantum Machine Learning (QML) algorithms on NISQ processors. Detail energy efficiency, algorithmic expressivity, and hardware scalability limits.',
    suggestedDuration: 15,
    suggestedBudget: 20000,
    suggestedTurns: 12,
    initialInstruction: 'Provide detailed qualitative comparisons and mathematical formulations of energy scaling laws.'
  },
  {
    id: 'tpl-scifi-worldbuilding',
    title: 'Speculative Hard Sci-Fi Worldbuilding Bible: Orbital Lagrange Civilizations',
    category: 'Creative Writing',
    task: 'Create an immersive, scientifically grounded worldbuilding bible for a speculative fiction novel set in 2180 AD among L4/L5 orbital Lagrange colonies. Detail political factions, vacuum economics, artificial biosphere ecology, cultural dialects, and legal doctrines governing asteroid resource rights.',
    suggestedDuration: 15,
    suggestedBudget: 25000,
    suggestedTurns: 12,
    initialInstruction: 'Focus on evocative sensory prose, internal consistency, realistic physics, and compelling interpersonal dynamics.'
  }
];
