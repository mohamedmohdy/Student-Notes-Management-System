import path from 'path';
import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';

const dataDir = path.join(process.cwd(), 'data');
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  // Ignore read-only filesystem errors in serverless edge environments
}

const pgDataPath = path.join(dataDir, 'postgres_db');

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5433/student_notes';

let pgPoolInstance: Pool | null = null;
let schemaInitPromise: Promise<void> | null = null;

async function getPool(): Promise<Pool> {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured for production environment');
  }

  if (!pgPoolInstance) {
    const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
    pgPoolInstance = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      try {
        await initPgSchema(pgPoolInstance!);
      } catch (err) {
        console.error('Error initializing PostgreSQL schema:', err);
      }
    })();
  }
  await schemaInitPromise;
  return pgPoolInstance;
}

export async function getPgClient(): Promise<{
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
}> {
  const pool = await getPool();
  return {
    query: async (sql: string, params?: any[]) => {
      const res = await pool.query(sql, params);
      return { rows: res.rows || [], rowCount: res.rowCount || 0 };
    },
  };
}

function getSchemaSql(): string {
  return `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'TEACHER',
      status TEXT NOT NULL DEFAULT 'pending',
      must_change_password INTEGER NOT NULL DEFAULT 0,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      onboarding_skipped INTEGER NOT NULL DEFAULT 0,
      onboarding_version INTEGER NOT NULL DEFAULT 1,
      onboarding_completed_at TEXT,
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      is_published INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS announcement_reads (
      id TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_read INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      read_at TEXT,
      hidden_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(announcement_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_number TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      status TEXT NOT NULL DEFAULT 'normal',
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'academic',
      priority TEXT NOT NULL DEFAULT 'medium',
      content TEXT NOT NULL,
      action_taken TEXT,
      requires_follow_up INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS class_notes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      title TEXT,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      note_date TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      follow_up_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      additional_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      teacher_name TEXT NOT NULL,
      teacher_email TEXT NOT NULL,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      admin_reply TEXT,
      admin_replied_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at BIGINT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at);
    CREATE INDEX IF NOT EXISTS idx_grades_teacher ON grades(teacher_id, archived);
    CREATE INDEX IF NOT EXISTS idx_classes_teacher_grade ON classes(teacher_id, grade_id, archived);
    CREATE INDEX IF NOT EXISTS idx_students_teacher_class ON students(teacher_id, class_id, archived);
    CREATE INDEX IF NOT EXISTS idx_students_status ON students(teacher_id, status);
    CREATE INDEX IF NOT EXISTS idx_notes_teacher_student ON notes(teacher_id, student_id, archived);
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(teacher_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(teacher_id, type, archived);
    CREATE INDEX IF NOT EXISTS idx_class_notes_teacher_class ON class_notes(teacher_id, class_id, note_date DESC);
    CREATE INDEX IF NOT EXISTS idx_followups_teacher_student ON follow_ups(teacher_id, student_id, status);
    CREATE INDEX IF NOT EXISTS idx_followups_date ON follow_ups(teacher_id, follow_up_date ASC);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_teacher ON support_tickets(teacher_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id, announcement_id);
  `;
}

export async function initPgSchema(client: any) {
  const sql = getSchemaSql();
  if (typeof client.exec === 'function') {
    await client.exec(sql);
  } else {
    await client.query(sql);
  }

  // Ensure migration columns exist on existing databases
  try {
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_skipped INTEGER NOT NULL DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_version INTEGER NOT NULL DEFAULT 1',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TEXT',
    ];
    for (const q of alterQueries) {
      if (typeof client.exec === 'function') {
        await client.exec(q);
      } else {
        await client.query(q);
      }
    }
  } catch (err) {
    // Ignore if columns already exist
  }
}