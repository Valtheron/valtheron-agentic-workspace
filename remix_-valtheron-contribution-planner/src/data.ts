import { ContributionTopic } from './types';

export interface MessyDocFile {
  originalPath: string;
  targetPath: string;
  status: 'messy' | 'restructured';
  type: 'pdf' | 'markdown' | 'text' | 'json' | 'yaml';
  description: string;
  reorganizationJustification: string;
}

export const VALTHERON_INFO = {
  githubUrl: "https://github.com/Valtheron/valtheron-agentic-workspace",
  overview: "Valtheron Agentic Workspace is a production-grade orchestration framework designed to deploy, secure, and manage up to 290 specialized AI agents. Engineered for security-conscious enterprise environments, it ensures safe execution through cryptographic isolation and continuous auditing.",
  stack: [
    { name: "React 19", role: "Declarative UI with native form state optimization and visual canvas integration." },
    { name: "Express 5.1", role: "Next-gen HTTP router handling high-concurrency websocket and agent coordinate streams." },
    { name: "TypeScript", role: "Strict structural and algebraic typing guarding the entire agent state machine." },
    { name: "SQLite", role: "Local embedded db optimized for low latency storage of logs and transient states." }
  ],
  security: [
    { feature: "AES-256-GCM", detail: "Military-grade cryptographic encryption of agent credentials, API tokens, and temporary memory structures." },
    { feature: "Multi-Factor Auth", detail: "Mandatory security layers gating structural agent configuration edits and operational deploys." },
    { feature: "Audit Trailing", detail: "WORM (Write Once, Read Many) secure logger tracing all handoffs, model instructions, and token overhead." }
  ]
};

export const MESSY_DOCS_STRUCTURE: MessyDocFile[] = [
  {
    originalPath: "docs/guides/Valtheron_Handbuch_v2.pdf",
    targetPath: "docs/guides/Valtheron_Handbuch_v2.pdf",
    status: "restructured",
    type: "pdf",
    description: "The primary comprehensive manual covering the orchestration workflow logic, SQLite configuration, encryption/decryption keys, and v2 architecture roadmap.",
    reorganizationJustification: "Keep as-is, but should serve as the source-of-truth reference from which standard Markdown guides are derived."
  },
  {
    originalPath: "docs/v1_setup_instruction.txt",
    targetPath: "docs/guides/getting-started.md",
    status: "messy",
    type: "text",
    description: "Plain text local environments onboarding directives, dependencies config, and sample seed scripts.",
    reorganizationJustification: "Convert flat raw TXT file to standardized Markdown with clear headers, prerequisite checklists, and error recovery commands."
  },
  {
    originalPath: "docs/security_brief.pdf",
    targetPath: "docs/architecture/security-model.md",
    status: "messy",
    type: "pdf",
    description: "Theoretical breakdown of AES-256-GCM encryption streams and TOTP multi-factor authenticate validations.",
    reorganizationJustification: "Compile theoretical brief into proper Markdown documentation. Include sequence flow diagrams in Mermaid style."
  },
  {
    originalPath: "docs/agent-architecture-overview.md",
    targetPath: "docs/architecture/agent-orchestrator.md",
    status: "messy",
    type: "markdown",
    description: "Informal drafts about how the 290 agent categories register their state payloads and process handoffs.",
    reorganizationJustification: "Expand state transition equations, explain state machine rollback behaviors, and document the lock management system."
  },
  {
    originalPath: "docs/routes_v5_full_api.json",
    targetPath: "docs/api/express-endpoints.md",
    status: "messy",
    type: "json",
    description: "Raw JSON backup dictionary of application API routes and Express 5.1 middleware headers.",
    reorganizationJustification: "Refactor JSON schemas into clean markdown API specifications detailing request bodies, success headers, and security errors."
  },
  {
    originalPath: "docs/draft_onboarding_list.md",
    targetPath: "docs/onboarding/contributor-blueprint.md",
    status: "messy",
    type: "markdown",
    description: "Rough checkboxes indicating required lint tests, styling rules, and security guidelines.",
    reorganizationJustification: "Structure into an interactive pull request template checklist to ensure high standards before PR reviews."
  },
  {
    originalPath: "docs/kubernetes_draft.yaml",
    targetPath: "docs/deployment/kubernetes-helm.md",
    status: "messy",
    type: "yaml",
    description: "Loose Kubernetes pod configurations that launch background agents inside isolated namespace containers.",
    reorganizationJustification: "Upgrade to fully detailed production deployment guides, separating configmaps, secret handling, and explaining vertical scaling limits."
  },
  {
    originalPath: "docs/roadmap_discussion_v2.txt",
    targetPath: "docs/roadmap/v2-database-scaling.md",
    status: "messy",
    type: "text",
    description: "Scribbled thoughts around upgrading from single-process SQLite blocks to enterprise Postgres connection pools.",
    reorganizationJustification: "Refactor into formal RFC blueprint format outlining SQL adapter interfaces, model translation criteria, and data backfilling scripts."
  }
];

export const CONTRIBUTION_TOPICS: ContributionTopic[] = [
  // 1. IMPROVE DOCUMENTATION
  {
    id: "docs-1",
    category: "docs",
    title: "Specialized Agent Orchestration & API Reference",
    shortDesc: "Comprehensive API references explaining how to define custom agents and coordinate handoffs.",
    fullDesc: "Create clear, thorough guidelines for registering new agent profiles, declaring their tool payloads, and setting coordination topologies using the Express 5.1 API endpoints.",
    difficulty: "Beginner",
    suggestedEffort: "2-4 hours"
  },
  {
    id: "docs-2",
    category: "docs",
    title: "AES-256-GCM Secure Encryption Guide",
    shortDesc: "Step-by-step developer guide on key rotation and secret storage workflows.",
    fullDesc: "Explain the cryptographic architecture of Valtheron. Provide guidelines on how components should securely request decrypted secrets and handle initialization vectors (IVs).",
    difficulty: "Intermediate",
    suggestedEffort: "3-5 hours"
  },

  // 2. CODE REVIEW
  {
    id: "review-1",
    category: "review",
    title: "Express 5.1 Routers & SQLite Concurrency Locks",
    shortDesc: "Audit the Express 5.1 middleware performance under concurrent agent execution loads.",
    fullDesc: "Check for SQLite database locks when 50+ agents are spinning up, writing logs, and reading model contexts concurrently. Suggest robust connection pool tunings or write-ahead logging (WAL) toggles.",
    difficulty: "Advanced",
    suggestedEffort: "4-6 hours"
  },
  {
    id: "review-2",
    category: "review",
    title: "Audit Trail Signature Verification Middleware",
    shortDesc: "Evaluate the integrity checks applied to secure WORM log tables.",
    fullDesc: "Assess whether audit logs can be easily falsified if a container is compromised. Design a HMAC or cryptographic chaining verification script to check the validity of logs.",
    difficulty: "Advanced",
    suggestedEffort: "6-8 hours"
  },

  // 3. TESTING SCENARIOS
  {
    id: "tests-1",
    category: "tests",
    title: "Multi-Agent Parallel Context handoff Tests",
    shortDesc: "Design strict test cases for state conflicts in parallel agent execution.",
    fullDesc: "Develop a suite of automated unit tests using Vitest (or Jest) to simulate a multi-agent transaction where one agent crashes mid-process. Ensure state rollback is verified.",
    difficulty: "Intermediate",
    suggestedEffort: "3-6 hours"
  },
  {
    id: "tests-2",
    category: "tests",
    title: "MFA Token Expiry & Re-Auth Edge Cases",
    shortDesc: "Mock the TOTP MFA engine to test verification failures during agent actions.",
    fullDesc: "Write tests covering scenario paths where an OTP token expires precisely as an agent triggers a highly privileged execution, verifying secure aborts.",
    difficulty: "Intermediate",
    suggestedEffort: "2-4 hours"
  },

  // 4. ONBOARDING
  {
    id: "onboarding-1",
    category: "onboarding",
    title: "Developer Local Environment Seeding Quickstart",
    shortDesc: "Create an interactive CLI script to set up mock SQLite databases with dummy agents.",
    fullDesc: "Build and document a streamlined setup workflow so fresh contributors get the Express backend running and 290 mocked agents loaded with a single terminal command.",
    difficulty: "Beginner",
    suggestedEffort: "1-2 hours"
  },
  {
    id: "onboarding-2",
    category: "onboarding",
    title: "PR Quality & Cryptography Standard Checklist",
    shortDesc: "Formulate a self-assessment checklist that pull requests must pass before review.",
    fullDesc: "Consolidate coding styles, dependency rules, security practices, and testing goals into an interactive Markdown file embedded inside the repo structure.",
    difficulty: "Beginner",
    suggestedEffort: "1-3 hours"
  },

  // 5. ROADMAP BRAINSTORMING
  {
    id: "roadmap-1",
    category: "brainstorm",
    title: "SQLite to PostgreSQL Migration Layer",
    shortDesc: "Draft database adapter abstractions and initial migration SQL schemas for Postgres.",
    fullDesc: "Plan how to upgrade Valtheron's storage layer to robust relational PostgreSQL for production releases while supporting zero-config SQLite for swift local trials.",
    difficulty: "Advanced",
    suggestedEffort: "8-12 hours"
  },
  {
    id: "roadmap-2",
    category: "brainstorm",
    title: "Kubernetes Pod Isolation & Helm Deployments",
    shortDesc: "Brainstorm Helm charts and container manifest structure for Kubernetes deployment.",
    fullDesc: "Detail how specialized agents can be scheduled inside dedicated Kubernetes worker namespaces, managing networking and ingress routes safely.",
    difficulty: "Advanced",
    suggestedEffort: "5-8 hours"
  },
  {
    id: "roadmap-3",
    category: "brainstorm",
    title: "SSO/OIDC & Enterprise RBAC Integration",
    shortDesc: "Integrate Google/Okta Single Sign-On and Role-Based Access Controls.",
    fullDesc: "Map out the authentication flow redirects, token verifications, and agent permission sets to integrate with enterprise user registries securely.",
    difficulty: "Advanced",
    suggestedEffort: "6-10 hours"
  }
];
