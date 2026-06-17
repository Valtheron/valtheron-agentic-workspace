import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db } from "./server_db";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is missing or contains placeholder. AI features will fallback to sample structural response.");
}

// API endpoint to handle interactive generation of contribution assets
app.post("/api/generate", async (req, res) => {
  try {
    const { category, title, payload } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Category is required." });
    }

    let prompt = "";
    let systemInstruction = "You are the Lead Maintainer and Architect of the Valtheron Agentic Workspace (https://github.com/Valtheron/valtheron-agentic-workspace). Your goal is to guide open-source contributors into creating highly polished, production-ready code. Keep your advice technically accurate, realistic, and tailored to the platform: React 19, Express 5.1, TypeScript, SQLite, AES-256-GCM encryption, Multi-Factor Authentication (MFA), and audit trailing.";

    switch (category) {
      case "docs": {
        const { format, scope } = payload;
        systemInstruction += " Focus on creating outstanding technical documentation. Use markdown with clear headings, clean structure, practical TypeScript examples, and a professional, humble, clear tone.";
        prompt = `Please generate high-quality documentation for the topic: "${title}".
Format: ${format || "tutorial / guide"}
Additional context & scope: ${scope || "none provided"}

Ensure the output contains:
1. Executive Summary
2. Conceptual Explanation
3. Step-by-Step Code Examples (React 19 or Express 5.1/TypeScript, with comments)
4. Key Best Practices lists`;
        break;
      }
      case "review": {
        const { code, context } = payload;
        systemInstruction += " Focus on rigorous code review. Act as an expert in security, database queries, and modular design. Be critical yet educational and encouraging. Point out security vulnerabilities (like SQL injection or raw passwords), performance bottle-necks (like missing SQLite indexes, unclosed statements), or React 19 specific improvements if applicable.";
        prompt = `Please review this code snippet for Valtheron Workspace.
Focus Context: ${context || "general / security / sqlite"}

Code Snippet:
\`\`\`typescript
${code}
\`\`\`

Provide a professional, clear architectural review containing:
1. Overall Rating (e.g. Approved / Changes Requested)
2. Strengths of the snippet
3. Security/Performance Vulnerabilities and issues
4. Improved refactored Code Example (complete, pristine TypeScript, following excellent quality criteria)`;
        break;
      }
      case "tests": {
        const { component, agentType, complexity } = payload;
        systemInstruction += " Focus on robust, production-grade test suite design. Use Vitest or Jest. Ensure extensive edge-cases are covered: network delays, invalid payloads, state machine anomalies, concurrent agent handoffs, encryption key decryption failures.";
        prompt = `Please generate a comprehensive, ready-to-use developer test suite for the component/concept: "${title}".
Component/File: ${component || "Orchestrator Layer"}
Agent Type Involved: ${agentType || "Specialized AI Agent"}
Complexity Target: ${complexity || "complex"}

Include:
1. Overview of Test Cases & Scenarios
2. Edge Cases Handled (e.g. handoff failure, race conditions, decryption error)
3. Ready-to-copy complete TypeScript test file utilizing Vitest/Jest and mock handlers`;
        break;
      }
      case "brainstorm": {
        const { feature, details } = payload;
        systemInstruction += " Focus on high-level architectural brainstorming and planning for Valtheron's roadmap (v1.1.0/v2.0.0). Provide step-by-step blueprints, database schemas, deployment manifests, or structural flowcharts.";
        prompt = `Please draft a detailed architectural design and roadmap for implementing "${title}" in Valtheron Workspace.
Sub-feature category: ${feature}
User requirements: ${details || "none provided"}

Include:
1. Architectural Blueprint Overview
2. Concrete Technical Plan (e.g., PostgreSQL DB Schema migrations, K8s configuration, or SSO/OIDC redirect flows)
3. Step-by-Step Milestones for Contribution
4. Design Tradeoffs (pros/cons) of this approach`;
        break;
      }
      default:
        prompt = `Explain how a developer can coordinate and contribute to the Valtheron Workspace regarding "${title}".`;
    }

    let finalMarkDown = "";
    let isMocked = false;

    if (!ai) {
      // Graceful fallback with high-quality, tailored offline response
      finalMarkDown = getFallbackResponse(category, title, payload);
      isMocked = true;
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });
      finalMarkDown = response.text || "";
    }

    // Save actual draft to the real backend database!
    const draftTitle = category === 'review' ? `Audit: ${title}` : title;
    const engineName = isMocked ? "Offline Secure Core Fallback Engine" : "Gemini AI LLM Pipeline";
    const dbDraft = db.addDraft({
      topicId: title.replace(/\s+/g, '-').toLowerCase(),
      title: draftTitle,
      category: category,
      promptNotes: `Compiled securely via ${engineName}`,
      responseMarkdown: finalMarkDown
    });

    res.json({ ...dbDraft, isMocked });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// API endpoint to handle AI-based refinement (conciseness and tone improvement)
app.post("/api/refine", async (req, res) => {
  try {
    const { draftId, text, option } = req.body; // option: 'concise' | 'tone' | 'both'

    if (!text) {
      return res.status(400).json({ error: "Draft text content is required for refinement." });
    }

    let instruction = "You are the Lead Maintainer and Architect of the Valtheron Agentic Workspace. Your task is to refine the provided markdown text.";
    if (option === 'concise') {
      instruction += " Make it significantly more concise, direct, and compact. Prune redundant wording, use sharp bullet-points, but preserve all relevant technical specifications, APIs, and code blocks.";
    } else if (option === 'tone') {
      instruction += " Polishing the tone to be exceptionally professional, humble, encouraging, and authoritative. Refine any informal, sloppy, or passive phrasing into clear, precise software engineering language.";
    } else {
      instruction += " Refine the text to be both highly concise/direct and have an outstanding professional, humble, encouraging, and clear technical tone.";
    }

    instruction += " Output ONLY the modified markdown text directly. Do not include any intro, outro, conversational fillers, or markdown code-block wraps around the whole content.";

    let refinedText = "";
    let isMocked = false;

    if (!ai) {
      isMocked = true;
      if (option === 'concise') {
        refinedText = `### [Refined & Condensed Blueprint]\n*This draft was successfully refined to be more concise and direct in Offline Demonstration mode.*\n\n` + 
          text.split('\n').filter((line: string) => !line.includes('Note:') && !line.includes('Demo Mode') && line.trim().length > 0).slice(0, 15).join('\n');
      } else {
        refinedText = `### [Refined Professional Blueprint]\n*This draft was successfully polished in Offline Demonstration mode to adhere to Valtheron's strict corporate standards.*\n\n` + 
          text.split('\n').map((line: string) => line.replace('Offline Draft:', 'Pristine Production Blueprint:')).join('\n');
      }
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Please refine the following markdown document according to your system instructions:\n\n${text}`,
        config: {
          systemInstruction: instruction,
          temperature: 0.6,
        },
      });
      refinedText = response.text || "";
    }

    // Save the refined text in database if activeDraftId is provided
    if (draftId) {
      db.updateDraft(draftId, refinedText, `AI Refinement (${option || 'both'})`);
      try {
        db.addAuditLog('AI_REFINE', `Refined draft ID ${draftId} for improved ${option || 'conciseness/tone'}`);
      } catch (err) {
        console.error("Failed to add audit log for refinement:", err);
      }
    }

    res.json({ refinedText, isMocked });
  } catch (error: any) {
    console.error("Error refining text via Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to refine draft text" });
  }
});

// A library of high-quality mock responses in case the user has no Gemini key yet, ensuring beautiful visual demo
function getFallbackResponse(category: string, title: string, payload: any): string {
  if (category === "docs") {
    return `### 📖 Offline Draft: ${title}

*Note: You are in Demo Mode. Connect a Gemini API Key via Settings > Secrets to unlock full conversational drafts.*

#### 1. Executive Summary
This document provides guidelines and standard patterns for implementing **${title}** within the Valtheron Agentic Workspace. It aims to ensure consistent, secure, and production-ready contributions across the codebase.

#### 2. Conceptual Explanation
Valtheron uses Express 5.1, TypeScript, and SQLite. When adding documentation, ensure clear separation of concerns, secure access flows, and robust error handling.

#### 3. Code Example (TypeScript)
\`\`\`typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Request, Response } from 'express';
import { encryptSecret } from './crypto';

// Example contribution skeleton for ${title || "Feature"}
export async function handleContribution(req: Request, res: Response) {
  try {
    const { payload, secretKey } = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: "Missing payload parameter" });
    }
    
    // Process securely using AES-256-GCM
    const encrypted = encryptSecret(payload, secretKey);
    
    res.json({
      success: true,
      data: encrypted,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Internal processing failed securely" });
  }
}
\`\`\`

#### 4. Contribution Best Practices
- **Secure by Default:** Never log raw API secrets or agent API keys.
- **Type-Safe State:** Avoid using \`any\` in TypeScript declarations.
- **SQLite Transactions:** When executing multiple related updates, bind them inside a transaction block to preserve data integrity.`;
  } else if (category === "review") {
    return `### 🔍 Offline Code Review: ${title}

*Note: You are in Demo Mode. Connect a Gemini API Key via Settings > Secrets to unlock full conversational drafts.*

#### 1. Overall Rating
**APPROVED WITH SUGGESTIONS (Minor Changes Requested)**

#### 2. Code Strengths
- Good modular encapsulation and type discipline.
- Basic input parameter validations are properly executed.

#### 3. Identified Security & Performance Items
- **Cryptographic IV Uniqueness:** Ensure your AES-256-GCM initialization vector (IV) is freshly generated for *every* encryption operation using \`crypto.randomBytes(12)\`. Never reuse IV values.
- **SQLite Concurrency:** Since SQLite operates under writing locks, long-running sync operations can cause lockouts. Always wrap database calls in fast \`async/await\` blocks and keep transactions short.

#### 4. Recommended Refactored Version
\`\`\`typescript
import crypto from 'crypto';

// Refactored implementation with robust IV handling
export function encryptDataSecurely(rawText: string, encryptionKeyHex: string): { encryptedHex: string, ivHex: string, authTagHex: string } {
  const key = Buffer.from(encryptionKeyHex, 'hex');
  const iv = crypto.randomBytes(12); // Always unique
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(rawText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedHex: encrypted,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex')
  };
}
\`\`\``;
  } else if (category === "tests") {
    return `### 🧪 Offline Test Suite: ${title}

*Note: You are in Demo Mode. Connect a Gemini API Key via Settings > Secrets to unlock full conversational drafts.*

#### 1. Overview of Test Scenarios
This spec defines test coverage for the **${title}** subsystem.

#### 2. Key Edge Cases Tested
* Decryption failures (using wrong encryption keys).
* Agent handoff timeout constraints (resolving multi-agent coordination locks).
* SQL constraints violations (trying to create duplicate audit logs).

#### 3. Complete Vitest Test Suite Example
\`\`\`typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orchestrateAgentHandoff } from './orchestrator';

describe('Valtheron Handoff Security', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully pass context from Sender Agent to Receiver Agent', async () => {
    const sender = { id: 'agent-101', type: 'translator' };
    const receiver = { id: 'agent-205', type: 'summarizer' };
    const context = { text: 'Hello World', confidence: 0.99 };

    const result = await orchestrateAgentHandoff(sender, receiver, context);
    expect(result.success).toBe(true);
    expect(result.auditLogCreated).toBe(true);
  });

  it('should fail gracefully if recipient agent is offline and log to audit trail', async () => {
    const sender = { id: 'agent-101', type: 'translator' };
    const receiver = { id: 'agent-offline', type: 'summarizer' }; // Offline boundary failure

    await expect(
      orchestrateAgentHandoff(sender, receiver, {})
    ).rejects.toThrow('Recipient agent offline');
  });
});
\`\`\``;
  } else {
    return `### 💡 Offline Architecture Brainstorm: ${title}

*Note: You are in Demo Mode. Connect a Gemini API Key via Settings > Secrets to unlock full conversational drafts.*

#### 1. Architecture Overviews
For implementing **${title}** (specifically focusing on **${payload.feature || "Scaling Features"}**), we recommend a decoupled modular design that integrates seamlessly with Valtheron’s core.

#### 2. Migration & Integration Strategy
- **Stage 1 (Database Alignment):** Abstract the database driver behind a unified repository interface. This allows simple SQLite database calls for quick localized builds while enabling full PostgreSQL support for scalable production environments.
- **Stage 2 (Stateless Sessions):** Extract session authentication states into a robust JWT format backed by local verification keys or OIDC authentication loops.

#### 3. Recommended DB Schema Draft (PostgreSQL & SQLite cross-compatible)
\`\`\`sql
-- Proposed Schema for ${title}
CREATE TABLE IF NOT EXISTS valtheron_contribution_meta (
  id VARCHAR(36) PRIMARY KEY,
  topic VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  planned_version VARCHAR(20) DEFAULT 'v1.1.0',
  architectural_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### 4. Design Tradeoffs
- *Pros:* High scalability, cleaner code structure, native container readiness.
- *Cons:* Slightly higher initialization latency, minor overhead in local development setups.`;
  }
}

// --- FUNCTIONAL DATABASE BACKUP API ENDPOINTS ---

// 1. GET /api/topics - Fetch all custom + seeded contribution topics
app.get("/api/topics", (req, res) => {
  try {
    res.json(db.getTopics());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/topics - Create a custom topic and store it in database
app.post("/api/topics", (req, res) => {
  try {
    const { category, title, shortDesc, fullDesc, difficulty, suggestedEffort } = req.body;
    if (!category || !title || !shortDesc || !fullDesc) {
      return res.status(400).json({ error: "Required fields missing for custom topic." });
    }
    const newTopic = db.addTopic({
      category,
      title,
      shortDesc,
      fullDesc,
      difficulty: difficulty || 'Beginner',
      suggestedEffort: suggestedEffort || '2 hours'
    });
    res.json(newTopic);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/drafts - Fetch all drafts from the real database
app.get("/api/drafts", (req, res) => {
  try {
    res.json(db.getDrafts());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3.5 PUT /api/drafts/:id - Update real draft content in the database
app.put("/api/drafts/:id", (req, res) => {
  try {
    const { responseMarkdown, label } = req.body;
    const success = db.updateDraft(req.params.id, responseMarkdown || '', label || 'User Save');
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Draft not found in server database." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3.6 POST /api/drafts/:id/revert - Revert draft to a specific version
app.post("/api/drafts/:id/revert", (req, res) => {
  try {
    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({ error: "Version ID is required." });
    }
    const result = db.revertDraft(req.params.id, versionId);
    if (result.success) {
      res.json({ success: true, draft: result.draft });
    } else {
      res.status(404).json({ error: result.error || "Draft or version not found." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE /api/drafts/:id - Delete a draft and record in Blockchain Ledger WORM Audit
app.delete("/api/drafts/:id", (req, res) => {
  try {
    const success = db.deleteDraft(req.params.id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Draft not found in server database." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/audit-logs - Retrieve cryptographic logs
app.get("/api/audit-logs", (req, res) => {
  try {
    res.json(db.getAuditLogs());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/audit-logs/verify - On-demand physical verify of chaining hashes
app.post("/api/audit-logs/verify", (req, res) => {
  try {
    res.json(db.verifyIntegrity());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /api/agent-tasks - Get active logs for background worker agents
app.get("/api/agent-tasks", (req, res) => {
  try {
    res.json([]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Vite middleware setup or static distribution
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Valtheron Assistant Server running on http://localhost:${PORT}`);
    
    // Seed initial startup audit logs
    try {
      db.addAuditLog('SYSTEM_BOOT', 'Valtheron High-Consequences Node initialized on cluster ingress port.');
    } catch (err) {
      console.error("Boot routine audit writing failed:", err);
    }
  });
}

startServer();
