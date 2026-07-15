import dotenv from 'dotenv';
import { Pool } from 'pg';
import { WorkflowItem, WorkflowTemplate, WorkflowUser } from '../models/workflow';

dotenv.config();

export interface WorkflowState {
  users: WorkflowUser[];
  templates: WorkflowTemplate[];
  items: WorkflowItem[];
}

export interface WorkflowStore {
  loadState(): Promise<WorkflowState>;
  saveState(state: WorkflowState): Promise<void>;
}

export class InMemoryWorkflowStore implements WorkflowStore {
  private state: WorkflowState = { users: [], templates: [], items: [] };

  async loadState(): Promise<WorkflowState> {
    return {
      users: [...this.state.users],
      templates: [...this.state.templates],
      items: [...this.state.items]
    };
  }

  async saveState(state: WorkflowState): Promise<void> {
    this.state = {
      users: [...state.users],
      templates: [...state.templates],
      items: [...state.items]
    };
  }
}

export class PostgresWorkflowStore implements WorkflowStore {
  private readonly pool: Pool;

  constructor(connectionString = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/workforce') {
    this.pool = new Pool({
      connectionString,
      ssl: false
    });
  }

  private async ensureInitialized(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS workflow_state (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL
      )
    `);

    const existing = await this.pool.query('SELECT 1 FROM workflow_state WHERE id = $1', ['app']);
    if (existing.rowCount === 0) {
      await this.pool.query('INSERT INTO workflow_state (id, payload) VALUES ($1, $2)', [
        'app',
        { users: [], templates: [], items: [] }
      ]);
    }
  }

  async loadState(): Promise<WorkflowState> {
    await this.ensureInitialized();

    const result = await this.pool.query('SELECT payload FROM workflow_state WHERE id = $1', ['app']);
    const payload = result.rows[0]?.payload as WorkflowState | undefined;

    return payload ?? { users: [], templates: [], items: [] };
  }

  async saveState(state: WorkflowState): Promise<void> {
    await this.ensureInitialized();

    await this.pool.query('INSERT INTO workflow_state (id, payload) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload', [
      'app',
      state
    ]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
