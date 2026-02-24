import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '../../data/valtheron.db');
const DB_PATH_ENV_VAR = 'VALTHERON_DB_PATH';

let db: Database.Database;
let activeDbPath: string | undefined;

function resolveDbPath(): string {
  return process.env[DB_PATH_ENV_VAR] || DEFAULT_DB_PATH;
}

export function getDb(): Database.Database {
  if (!db) {
    activeDbPath = resolveDbPath();
    const dataDir = path.dirname(activeDbPath);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    db = new Database(activeDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = undefined as unknown as Database.Database;
    activeDbPath = undefined;
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      successRate REAL NOT NULL DEFAULT 0,
      tasksCompleted INTEGER NOT NULL DEFAULT 0,
      failedTasks INTEGER NOT NULL DEFAULT 0,
      avgTaskDuration REAL NOT NULL DEFAULT 0,
      currentTask TEXT,
      lastActivity TEXT,
      systemPrompt TEXT NOT NULL DEFAULT '',
      personality TEXT NOT NULL DEFAULT '{}',
      parameters TEXT NOT NULL DEFAULT '{}',
      certificationId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      certifiedAt TEXT,
      hooks TEXT NOT NULL DEFAULT '[]',
      testResults TEXT NOT NULL DEFAULT '[]',
      llmProvider TEXT,
      llmModel TEXT,
      riskProfile TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      assignedAgentId TEXT,
      category TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      completedAt TEXT,
      dependencies TEXT NOT NULL DEFAULT '[]',
      kanbanColumn TEXT NOT NULL DEFAULT 'backlog',
      tags TEXT NOT NULL DEFAULT '[]',
      taskType TEXT DEFAULT 'feature',
      deadline TEXT,
      progress INTEGER DEFAULT 0,
      estimatedHours REAL,
      actualHours REAL,
      FOREIGN KEY (assignedAgentId) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      steps TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      startedAt TEXT,
      completedAt TEXT,
      createdBy TEXT NOT NULL DEFAULT 'system',
      tags TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sourceUrl TEXT,
      status TEXT NOT NULL DEFAULT 'importing',
      requirements TEXT NOT NULL DEFAULT '[]',
      files TEXT NOT NULL DEFAULT '[]',
      workflowId TEXT,
      techStack TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      scrapedContent TEXT,
      analyzedStructure TEXT
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      agentId TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      resolved INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      riskLevel TEXT NOT NULL DEFAULT 'info'
    );

    CREATE TABLE IF NOT EXISTS kill_switch (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      armed INTEGER NOT NULL DEFAULT 0,
      triggeredAt TEXT,
      triggeredBy TEXT,
      reason TEXT,
      affectedAgents TEXT NOT NULL DEFAULT '[]',
      autoTriggerRules TEXT NOT NULL DEFAULT '[]',
      history TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Neue Konversation',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agentId) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      sender TEXT NOT NULL,
      senderType TEXT NOT NULL DEFAULT 'user',
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sessionId) REFERENCES chat_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS collaboration_sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      agents TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      sharedFiles TEXT NOT NULL DEFAULT '[]',
      coordinatorPrompt TEXT NOT NULL DEFAULT '',
      delegationStrategy TEXT NOT NULL DEFAULT 'round-robin',
      conflictResolution TEXT NOT NULL DEFAULT 'coordinator-decides',
      consensusThreshold INTEGER NOT NULL DEFAULT 75,
      maxIterations INTEGER NOT NULL DEFAULT 10,
      synthesis TEXT,
      startedAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collaboration_messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      content TEXT NOT NULL,
      messageType TEXT NOT NULL DEFAULT 'message',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sessionId) REFERENCES collaboration_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS metrics_history (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      activeAgents INTEGER NOT NULL DEFAULT 0,
      totalTasks INTEGER NOT NULL DEFAULT 0,
      completedToday INTEGER NOT NULL DEFAULT 0,
      errorRate REAL NOT NULL DEFAULT 0,
      avgResponseTime REAL NOT NULL DEFAULT 0,
      throughput REAL NOT NULL DEFAULT 0,
      successRate REAL NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO kill_switch (id, armed) VALUES (1, 0);
  `);
}
