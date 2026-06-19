# 💡 Datenbank-Migrationsplan: SQLite zu PostgreSQL im Valtheron Agentic Workspace

Dieses offizielle Dokument beschreibt den detaillierten Plan für die technische Portierung der Valtheron-Kernspeicherschicht von einer lokalen SQLite-Instanz zu einem hochverfügbaren, relationalen PostgreSQL-Datenbanksystem.

---

## 1. Strategie für die physische Datenmigration (ETL-Prozess)

Die Migration bereits aufgezeichneter WORM-Audit-Logs, Benutzer-Sitzungen und Custom-Themen von SQLite zu PostgreSQL erfordert ein präzises Datentyp-Mapping, um Integritätsverluste zu unterbinden:

### 1.1 Datentyp-Mapping-Spezifikation

| SQLite-Datentyp | PostgreSQL-Datentyp | Verwendungszweck im Workspace |
| :--- | :--- | :--- |
| `TEXT` | `VARCHAR(36)` | UUIDs von Agenten, Drafts und Log-IDs |
| `TEXT` (JSON-String) | `JSONB` | Datensätze des Agenten-Zustands, JSON-Payloads |
| `TEXT` (ISO-Format) | `TIMESTAMP WITH TIME ZONE` | Revisions-Zeitstempel und Audit-Logging-Zeitpunkte |
| `INTEGER` (Boolean-Ersatz) | `BOOLEAN` | Plugin-Zustände (`enabled: true/false`) |
| `TEXT` (Markdown) | `TEXT` | responseMarkdown Entwürfe |

### 1.2 Extraktions- und Einspielungsskript (pg_dump & JSON ETL)
Um offline-feste Datensätze (wie in `database.json` abgelegt) verlustfrei zu portieren, wird folgendes Node.js ETL-Migrationsskript verwendet:

```typescript
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'fs';
import { Client } from 'pg';

interface SeedData {
  topics: any[];
  drafts: any[];
  auditLogs: any[];
}

export async function executeDataBackfilling(databaseJsonPath: string, postgresConnString: string) {
  const rawData = fs.readFileSync(databaseJsonPath, 'utf8');
  const parsed: SeedData = JSON.parse(rawData);

  const client = new Client({ connectionString: postgresConnString });
  await client.connect();

  try {
    // Transaktion starten
    await client.query('BEGIN');

    // Tabellenstruktur erstellen
    await client.query(`
      CREATE TABLE IF NOT EXISTS valtheron_topics (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        short_desc TEXT NOT NULL,
        full_desc TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        suggested_effort VARCHAR(30) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS valtheron_drafts (
        id VARCHAR(50) PRIMARY KEY,
        topic_id VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        prompt_notes TEXT,
        response_markdown TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Daten transponieren
    for (const topic of parsed.topics) {
      await client.query(
        `INSERT INTO valtheron_topics (id, category, title, short_desc, full_desc, difficulty, suggested_effort) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [topic.id, topic.category, topic.title, topic.shortDesc, topic.fullDesc, topic.difficulty, topic.suggestedEffort]
      );
    }

    for (const draft of parsed.drafts) {
      await client.query(
        `INSERT INTO valtheron_drafts (id, topic_id, title, category, prompt_notes, response_markdown) 
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [draft.id, draft.topicId, draft.title, draft.category, draft.promptNotes, draft.responseMarkdown]
      );
    }

    await client.query('COMMIT');
    console.log("ETL Migration and Data Backfilling successfully executed!");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Critical Migration Failure! Executed database rollback.", error);
  } finally {
    await client.end();
  }
}
```

---

## 2. Code-Anpassungen (Database Abstraction Layer)

### 2.1 JDBC / PG Connection Pooling Config
Unter SQLite blockiert jeder Schreibzugriff die gesamte relationale Datenbank. PostgreSQL löst dies über ein **Row-Level-Locking-Modell** und separate Worker-Threads. Um dies optimal zu verwalten, implementiert das System ein robustes Connection Pooling:

```typescript
import { Pool } from 'pg';

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // Maximal 20 parallele Client-Verbindungen im Pool
  idleTimeoutMillis: 30000, // Verbindung nach 30s Leerlauf schließen
  connectionTimeoutMillis: 2000, 
});
```

### 2.2 Dialekt-Unterschiede & Transaktionshandling
In SQLite existiert kein automatisches Multi-User Conflict-Handling. In PostgreSQL ersetzen wir SQLite-spezifische Dialekte wie `INSERT OR IGNORE` durch PostgreSQL-konforme, standardisierte SQL-Befehle:

```sql
-- SQLite Dialekt
INSERT OR IGNORE INTO valtheron_topics (id, category) VALUES ('id_value', 'docs');

-- PostgreSQL Dialekt
INSERT INTO valtheron_topics (id, category) 
VALUES ('id_value', 'docs') 
ON CONFLICT (id) DO NOTHING;
```

---

## 3. Performance-Optimierungen für PostgreSQL

Zur Bewältigung von Massen-Schreibvorgängen der 290 parallel laufenden Agenten werden folgende Tuning-Parameter angewendet:

1. **B-Tree Indizierung für Fremdschlüssel und Handoff-IDs:**
   Wir binden Revisions-Abfragen an Indizes, um sequenzielle Tabellenscans (Table Scans) zu umgehen:
   ```sql
   CREATE INDEX idx_drafts_topic_id ON valtheron_drafts (topic_id);
   ```
2. **GIN (Generalized Inverted Index) für JSONB Payload Felder:**
   Wenn interne Agenten-Anweisungen in flexiblen JSON-B-Feldern gespeichert werden, schützt ein GIN-Index die Suchgeschwindigkeit:
   ```sql
   CREATE INDEX idx_agent_tasks_payload_gin ON valtheron_agent_tasks USING gin (log_data);
   ```
3. **Optimierung des Autovacuum-Verhaltens:**
   Da Agenten stetig transiente Protokolldubletten aktualisieren, sorgt ein aggressiver Autovacuum-Tuning-Zyklus für das automatische Freigeben von physischem Plattenplatz:
   ```sql
   ALTER TABLE valtheron_agent_tasks SET (
     autovacuum_vacuum_scale_factor = 0.05,
     autovacuum_vacuum_threshold = 50
   );
   ```

---

## 4. Gewährleistung der Datenintegrität

Um die Datenintegrität während und nach der Portierung lückenlos zu sichern, kommen folgende Strategien zum Einsatz:

- **Mathematical Ledger Checksum Verification (SHA-256 Chaining):**
  Nach dem Import beider Datenbankzustände wird das gesamte WORM-Sicherheitsledger blockweise verifiziert. Ein Prüfskript vergleicht den SQLite-Endhashwert mathematisch mit dem importierten PostgreSQL-Endhashwert. Stimmen diese überein, gilt die Kette als integer.
- **Dual-Writing Phase (Echtzeit-Sicherheitsnetz):**
  Während des Produktivgangs schreibt die Applet-Anwendung transaktionale Audit-Logs für einen Übergangszeitraum von 72 Stunden **synchron in beide Datenbanken**. Lesend wird weiterhin SQLite als Fallback genutzt, bis PostgreSQL absolute Fehlerfreiheit belegt hat.
- **Notfall-Rollback Konzept:**
  Sollte die CPU-Last von PostgreSQL unvorhergesehen ansteigen, kann die Webanwendung über ein hot-swap Umgebungsvariablen-Flag (`DATABASE_DRIVER='sqlite'`) innerhalb von 5 Sekunden ohne Neustart des Docker-Containers auf die SQLite-Sicherungsdatei zurückgesetzt werden.
