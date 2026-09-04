import { IRateLimitStore } from '../types';
import { getPgClient } from '@/lib/postgres';

/**
 * Distributed PostgreSQL Rate Limit Store.
 *
 * Implements atomic, distributed rate limiting using PostgreSQL row-level locking
 * with `INSERT ... ON CONFLICT DO UPDATE`.
 * 
 * Works uniformly across all serverless instances, processes, and cold starts.
 */
export class PostgresRateLimitStore implements IRateLimitStore {
  private schemaInitialized = false;
  private lastCleanupTime = Date.now();

  private async ensureSchema(client: { query: (sql: string, params?: any[]) => Promise<any> }): Promise<void> {
    if (this.schemaInitialized) return;
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at BIGINT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);
      `);
      this.schemaInitialized = true;
    } catch (err: any) {
      // Table might already exist or concurrent creation in progress
      this.schemaInitialized = true;
    }
  }

  async increment(
    key: string,
    windowMs: number,
    _max: number
  ): Promise<{ count: number; resetAt: number }> {
    const client = await getPgClient();
    await this.ensureSchema(client);

    const now = Date.now();
    const newResetAt = now + windowMs;

    // Trigger non-blocking opportunistic background cleanup (1 in 200 requests or once per 2 minutes)
    if (now - this.lastCleanupTime > 120000 || Math.random() < 0.005) {
      this.lastCleanupTime = now;
      this.cleanupNonBlocking(client, now).catch(() => {});
    }

    const sql = `
      INSERT INTO rate_limits (key, count, reset_at, updated_at)
      VALUES ($1, 1, $2, NOW())
      ON CONFLICT (key) DO UPDATE
      SET
        count = CASE
          WHEN rate_limits.reset_at <= ($2 - $3) THEN 1
          ELSE rate_limits.count + 1
        END,
        reset_at = CASE
          WHEN rate_limits.reset_at <= ($2 - $3) THEN $2
          ELSE rate_limits.reset_at
        END,
        updated_at = NOW()
      RETURNING count, reset_at;
    `;

    const res = await client.query(sql, [key, newResetAt, windowMs]);

    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      const count = Number(row.count) || 1;
      const resetAt = Number(row.reset_at) || newResetAt;
      return { count, resetAt };
    }

    return { count: 1, resetAt: newResetAt };
  }

  /**
   * Non-blocking background deletion of expired rate limit entries.
   */
  private async cleanupNonBlocking(
    client: { query: (sql: string, params?: any[]) => Promise<any> },
    now: number
  ): Promise<void> {
    try {
      await client.query('DELETE FROM rate_limits WHERE reset_at < $1', [now]);
    } catch {
      // Ignore background cleanup errors to never block live traffic
    }
  }

  /**
   * Explicit synchronous cleanup for tests and maintenance.
   */
  async cleanup(): Promise<number> {
    try {
      const client = await getPgClient();
      await this.ensureSchema(client);
      const res = await client.query('DELETE FROM rate_limits WHERE reset_at < $1', [Date.now()]);
      return res.rowCount || 0;
    } catch {
      return 0;
    }
  }
}

export const postgresRateLimitStore = new PostgresRateLimitStore();
