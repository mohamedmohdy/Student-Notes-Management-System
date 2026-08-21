import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  User,
  Grade,
  ClassRoom,
  Student,
  Note,
  FollowUp,
  DashboardStats,
  NoteType,
  NotePriority,
  StudentStatus,
  FollowUpStatus,
} from './types';
import { generateId } from './utils';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'student_notes.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
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

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      grade_id TEXT NOT NULL,
      name TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (grade_id) REFERENCES grades(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      student_number TEXT NOT NULL,
      name TEXT NOT NULL,
      photo TEXT,
      status TEXT NOT NULL DEFAULT 'normal',
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'academic',
      priority TEXT NOT NULL DEFAULT 'medium',
      content TEXT NOT NULL,
      action_taken TEXT,
      requires_follow_up INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      follow_up_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      additional_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON classes(grade_id);
    CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
    CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
    CREATE INDEX IF NOT EXISTS idx_followups_student_id ON follow_ups(student_id);
    CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_ups(status);
  `);
}

/* =========================================================================
   USER & PASSWORD RESET REPOSITORY
   ========================================================================= */

export const UserRepository = {
  findByEmail(email: string): (User & { password_hash: string }) | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    return (row as any) || null;
  },

  findById(id: string): User | null {
    const db = getDb();
    const row = db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?').get(id);
    return (row as any) || null;
  },

  create(data: { name: string; email: string; password_hash: string; role?: string }): User {
    const db = getDb();
    const id = generateId('user');
    const now = new Date().toISOString();
    const role = data.role || 'teacher';
    
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.name.trim(), data.email.toLowerCase().trim(), data.password_hash, role, now, now);

    return {
      id,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      role: role as any,
      created_at: now,
      updated_at: now,
    };
  },

  updatePassword(email: string, password_hash: string): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?
    `).run(password_hash, now, email.toLowerCase().trim());
    return res.changes > 0;
  },

  createPasswordReset(email: string, code: string): void {
    const db = getDb();
    const id = generateId('reset');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // Clear previous resets for this email
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(email.toLowerCase().trim());

    db.prepare(`
      INSERT INTO password_resets (id, email, code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase().trim(), code, expiresAt, now);
  },

  verifyPasswordReset(email: string, code: string): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    const row = db.prepare(`
      SELECT * FROM password_resets 
      WHERE email = ? AND code = ? AND expires_at > ?
    `).get(email.toLowerCase().trim(), code.trim(), now);
    return !!row;
  },

  clearPasswordReset(email: string): void {
    const db = getDb();
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(email.toLowerCase().trim());
  },

  count(): number {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    return row.count || 0;
  }
};

/* =========================================================================
   GRADES REPOSITORY
   ========================================================================= */

export const GradeRepository = {
  getAll(includeArchived = false): Grade[] {
    const db = getDb();
    const where = includeArchived ? '' : 'WHERE g.archived = 0';
    const rows = db.prepare(`
      SELECT 
        g.*,
        (SELECT COUNT(*) FROM classes c WHERE c.grade_id = g.id AND c.archived = 0) as classes_count,
        (SELECT COUNT(*) FROM students s JOIN classes c ON s.class_id = c.id WHERE c.grade_id = g.id AND s.archived = 0 AND c.archived = 0) as students_count
      FROM grades g
      ${where}
      ORDER BY g.created_at ASC
    `).all();
    return rows as any;
  },

  findById(id: string): Grade | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT 
        g.*,
        (SELECT COUNT(*) FROM classes c WHERE c.grade_id = g.id AND c.archived = 0) as classes_count,
        (SELECT COUNT(*) FROM students s JOIN classes c ON s.class_id = c.id WHERE c.grade_id = g.id AND s.archived = 0 AND c.archived = 0) as students_count
      FROM grades g
      WHERE g.id = ?
    `).get(id);
    return (row as any) || null;
  },

  create(name: string): Grade {
    const db = getDb();
    const id = generateId('grade');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO grades (id, name, archived, created_at, updated_at)
      VALUES (?, ?, 0, ?, ?)
    `).run(id, name.trim(), now, now);

    return {
      id,
      name: name.trim(),
      archived: 0,
      created_at: now,
      updated_at: now,
      classes_count: 0,
      students_count: 0,
    };
  },

  update(id: string, name: string): Grade | null {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE grades SET name = ?, updated_at = ? WHERE id = ?
    `).run(name.trim(), now, id);

    return this.findById(id);
  },

  setArchived(id: string, archived: boolean): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE grades SET archived = ?, updated_at = ? WHERE id = ?
    `).run(archived ? 1 : 0, now, id);
  },

  deletePermanent(id: string): void {
    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const classes = db.prepare('SELECT id FROM classes WHERE grade_id = ?').all(id) as any[];
      for (const cls of classes) {
        const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(cls.id) as any[];
        for (const stu of students) {
          db.prepare('DELETE FROM follow_ups WHERE student_id = ?').run(stu.id);
          db.prepare('DELETE FROM notes WHERE student_id = ?').run(stu.id);
        }
        db.prepare('DELETE FROM students WHERE class_id = ?').run(cls.id);
      }
      db.prepare('DELETE FROM classes WHERE grade_id = ?').run(id);
      db.prepare('DELETE FROM grades WHERE id = ?').run(id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};

/* =========================================================================
   CLASSES REPOSITORY
   ========================================================================= */

export const ClassRepository = {
  getAll(gradeId?: string, includeArchived = false): ClassRoom[] {
    const db = getDb();
    let query = `
      SELECT 
        c.*,
        g.name as grade_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.archived = 0) as students_count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (!includeArchived) {
      query += ' AND c.archived = 0 AND g.archived = 0';
    }
    if (gradeId) {
      query += ' AND c.grade_id = ?';
      params.push(gradeId);
    }
    query += ' ORDER BY c.created_at ASC';
    const rows = db.prepare(query).all(...params);
    return rows as any;
  },

  findById(id: string): ClassRoom | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT 
        c.*,
        g.name as grade_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.archived = 0) as students_count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      WHERE c.id = ?
    `).get(id);
    return (row as any) || null;
  },

  create(gradeId: string, name: string): ClassRoom {
    const db = getDb();
    const id = generateId('class');
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO classes (id, grade_id, name, archived, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(id, gradeId, name.trim(), now, now);

    return this.findById(id)!;
  },

  update(id: string, name: string, gradeId?: string): ClassRoom | null {
    const db = getDb();
    const now = new Date().toISOString();
    if (gradeId) {
      db.prepare(`
        UPDATE classes SET name = ?, grade_id = ?, updated_at = ? WHERE id = ?
      `).run(name.trim(), gradeId, now, id);
    } else {
      db.prepare(`
        UPDATE classes SET name = ?, updated_at = ? WHERE id = ?
      `).run(name.trim(), now, id);
    }
    return this.findById(id);
  },

  setArchived(id: string, archived: boolean): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE classes SET archived = ?, updated_at = ? WHERE id = ?
    `).run(archived ? 1 : 0, now, id);
  },

  deletePermanent(id: string): void {
    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      const students = db.prepare('SELECT id FROM students WHERE class_id = ?').all(id) as any[];
      for (const stu of students) {
        db.prepare('DELETE FROM follow_ups WHERE student_id = ?').run(stu.id);
        db.prepare('DELETE FROM notes WHERE student_id = ?').run(stu.id);
      }
      db.prepare('DELETE FROM students WHERE class_id = ?').run(id);
      db.prepare('DELETE FROM classes WHERE id = ?').run(id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};

/* =========================================================================
   STUDENTS REPOSITORY (WITH BATCH EXCEL IMPORT)
   ========================================================================= */

export const StudentRepository = {
  getAll(filters: {
    classId?: string;
    gradeId?: string;
    search?: string;
    status?: StudentStatus;
    includeArchived?: boolean;
  } = {}): Student[] {
    const db = getDb();
    let query = `
      SELECT 
        s.*,
        c.name as class_name,
        g.id as grade_id,
        g.name as grade_name,
        (SELECT COUNT(*) FROM notes n WHERE n.student_id = s.id AND n.archived = 0) as notes_count,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.student_id = s.id) as follow_ups_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!filters.includeArchived) {
      query += ' AND s.archived = 0 AND c.archived = 0 AND g.archived = 0';
    }
    if (filters.classId) {
      query += ' AND s.class_id = ?';
      params.push(filters.classId);
    }
    if (filters.gradeId) {
      query += ' AND c.grade_id = ?';
      params.push(filters.gradeId);
    }
    if (filters.status) {
      query += ' AND s.status = ?';
      params.push(filters.status);
    }
    if (filters.search) {
      const s = `%${filters.search.trim()}%`;
      query += ' AND (s.name LIKE ? OR s.student_number LIKE ? OR c.name LIKE ? OR g.name LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY s.name ASC';
    const rows = db.prepare(query).all(...params);
    return rows as any;
  },

  findById(id: string): Student | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT 
        s.*,
        c.name as class_name,
        g.id as grade_id,
        g.name as grade_name,
        (SELECT COUNT(*) FROM notes n WHERE n.student_id = s.id AND n.archived = 0) as notes_count,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.student_id = s.id) as follow_ups_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE s.id = ?
    `).get(id);

    if (!row) return null;

    const latestNote = db.prepare(`
      SELECT n.*, u.name as teacher_name
      FROM notes n
      JOIN users u ON n.teacher_id = u.id
      WHERE n.student_id = ? AND n.archived = 0
      ORDER BY n.created_at DESC
      LIMIT 1
    `).get(id);

    return {
      ...(row as any),
      latest_note: (latestNote as any) || null,
    };
  },

  create(data: {
    class_id: string;
    student_number: string;
    name: string;
    photo?: string | null;
    status?: StudentStatus;
  }): Student {
    const db = getDb();
    const id = generateId('stu');
    const now = new Date().toISOString();
    const status = data.status || 'normal';

    db.prepare(`
      INSERT INTO students (id, class_id, student_number, name, photo, status, archived, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(id, data.class_id, data.student_number.trim(), data.name.trim(), data.photo || null, status, now, now);

    return this.findById(id)!;
  },

  // Batch import students from parsed Excel
  importBatch(studentsList: Array<{ class_id: string; student_number: string; name: string; status?: StudentStatus }>): number {
    const db = getDb();
    const now = new Date().toISOString();
    let count = 0;

    db.exec('BEGIN TRANSACTION;');
    try {
      const stmt = db.prepare(`
        INSERT INTO students (id, class_id, student_number, name, photo, status, archived, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, ?, 0, ?, ?)
      `);

      for (const item of studentsList) {
        if (!item.name || !item.name.trim() || !item.class_id) continue;
        const id = generateId('stu');
        const num = item.student_number ? item.student_number.toString().trim() : Math.floor(100 + Math.random() * 900).toString();
        const status = item.status || 'normal';

        stmt.run(id, item.class_id, num, item.name.trim(), status, now, now);
        count++;
      }

      db.exec('COMMIT;');
      return count;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  update(id: string, data: {
    class_id?: string;
    student_number?: string;
    name?: string;
    photo?: string | null;
    status?: StudentStatus;
  }): Student | null {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    const class_id = data.class_id || current.class_id;
    const student_number = data.student_number ? data.student_number.trim() : current.student_number;
    const name = data.name ? data.name.trim() : current.name;
    const photo = data.photo !== undefined ? data.photo : current.photo;
    const status = data.status || current.status;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE students 
      SET class_id = ?, student_number = ?, name = ?, photo = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(class_id, student_number, name, photo, status, now, id);

    return this.findById(id);
  },

  setArchived(id: string, archived: boolean): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE students SET archived = ?, updated_at = ? WHERE id = ?
    `).run(archived ? 1 : 0, now, id);
  },

  deletePermanent(id: string): void {
    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM follow_ups WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM notes WHERE student_id = ?').run(id);
      db.prepare('DELETE FROM students WHERE id = ?').run(id);
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};

/* =========================================================================
   NOTES REPOSITORY
   ========================================================================= */

export const NoteRepository = {
  getAll(filters: {
    studentId?: string;
    classId?: string;
    gradeId?: string;
    teacherId?: string;
    type?: NoteType;
    priority?: NotePriority;
    requiresFollowUp?: boolean;
    search?: string;
    startDate?: string;
    endDate?: string;
    includeArchived?: boolean;
  } = {}): Note[] {
    const db = getDb();
    let query = `
      SELECT 
        n.*,
        s.name as student_name,
        s.student_number,
        c.id as class_id,
        c.name as class_name,
        g.id as grade_id,
        g.name as grade_name,
        u.name as teacher_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON n.teacher_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!filters.includeArchived) {
      query += ' AND n.archived = 0 AND s.archived = 0';
    }
    if (filters.studentId) {
      query += ' AND n.student_id = ?';
      params.push(filters.studentId);
    }
    if (filters.classId) {
      query += ' AND c.id = ?';
      params.push(filters.classId);
    }
    if (filters.gradeId) {
      query += ' AND g.id = ?';
      params.push(filters.gradeId);
    }
    if (filters.teacherId) {
      query += ' AND n.teacher_id = ?';
      params.push(filters.teacherId);
    }
    if (filters.type) {
      query += ' AND n.type = ?';
      params.push(filters.type);
    }
    if (filters.priority) {
      query += ' AND n.priority = ?';
      params.push(filters.priority);
    }
    if (filters.requiresFollowUp !== undefined) {
      query += ' AND n.requires_follow_up = ?';
      params.push(filters.requiresFollowUp ? 1 : 0);
    }
    if (filters.startDate) {
      query += ' AND n.created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND n.created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters.search) {
      const s = `%${filters.search.trim()}%`;
      query += ' AND (n.content LIKE ? OR s.name LIKE ? OR s.student_number LIKE ?)';
      params.push(s, s, s);
    }

    query += ' ORDER BY n.created_at DESC';
    const notes = db.prepare(query).all(...params) as any[];

    for (const note of notes) {
      if (note.requires_follow_up === 1) {
        const fu = db.prepare(`
          SELECT * FROM follow_ups WHERE note_id = ?
        `).get(note.id);
        note.follow_up = fu || null;
      }
    }

    return notes;
  },

  findById(id: string): Note | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT 
        n.*,
        s.name as student_name,
        s.student_number,
        c.id as class_id,
        c.name as class_name,
        g.id as grade_id,
        g.name as grade_name,
        u.name as teacher_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON n.teacher_id = u.id
      WHERE n.id = ?
    `).get(id);

    if (!row) return null;
    const note = row as any;

    if (note.requires_follow_up === 1) {
      const fu = db.prepare('SELECT * FROM follow_ups WHERE note_id = ?').get(id);
      note.follow_up = fu || null;
    }

    return note;
  },

  create(data: {
    student_id: string;
    teacher_id: string;
    type: NoteType;
    priority: NotePriority;
    content: string;
    action_taken?: string | null;
    requires_follow_up: boolean;
    follow_up_date?: string | null;
  }): Note {
    const db = getDb();
    const id = generateId('note');
    const now = new Date().toISOString();
    const requiresFollowUpInt = data.requires_follow_up ? 1 : 0;

    db.prepare(`
      INSERT INTO notes (id, student_id, teacher_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      data.student_id,
      data.teacher_id,
      data.type,
      data.priority,
      data.content.trim(),
      data.action_taken ? data.action_taken.trim() : null,
      requiresFollowUpInt,
      now,
      now
    );

    if (data.requires_follow_up && data.follow_up_date) {
      const followUpId = generateId('fu');
      db.prepare(`
        INSERT INTO follow_ups (id, note_id, student_id, teacher_id, follow_up_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(followUpId, id, data.student_id, data.teacher_id, data.follow_up_date, now, now);

      db.prepare(`
        UPDATE students SET status = 'needs_followup', updated_at = ? WHERE id = ?
      `).run(now, data.student_id);
    } else if (data.type === 'positive') {
      const pendingCount = (db.prepare(`
        SELECT COUNT(*) as count FROM follow_ups WHERE student_id = ? AND status = 'pending'
      `).get(data.student_id) as any).count;
      if (pendingCount === 0) {
        db.prepare(`
          UPDATE students SET status = 'excellent', updated_at = ? WHERE id = ?
        `).run(now, data.student_id);
      }
    }

    return this.findById(id)!;
  },

  update(id: string, data: {
    type?: NoteType;
    priority?: NotePriority;
    content?: string;
    action_taken?: string | null;
    requires_follow_up?: boolean;
    follow_up_date?: string | null;
  }): Note | null {
    const db = getDb();
    const current = this.findById(id);
    if (!current) return null;

    const type = data.type || current.type;
    const priority = data.priority || current.priority;
    const content = data.content !== undefined ? data.content.trim() : current.content;
    const action_taken = data.action_taken !== undefined ? (data.action_taken ? data.action_taken.trim() : null) : current.action_taken;
    const requires_follow_up = data.requires_follow_up !== undefined ? (data.requires_follow_up ? 1 : 0) : current.requires_follow_up;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE notes
      SET type = ?, priority = ?, content = ?, action_taken = ?, requires_follow_up = ?, updated_at = ?
      WHERE id = ?
    `).run(type, priority, content, action_taken, requires_follow_up, now, id);

    if (requires_follow_up === 1) {
      const existingFu = db.prepare('SELECT * FROM follow_ups WHERE note_id = ?').get(id) as any;
      if (existingFu) {
        if (data.follow_up_date) {
          db.prepare('UPDATE follow_ups SET follow_up_date = ?, updated_at = ? WHERE id = ?')
            .run(data.follow_up_date, now, existingFu.id);
        }
      } else if (data.follow_up_date) {
        const followUpId = generateId('fu');
        db.prepare(`
          INSERT INTO follow_ups (id, note_id, student_id, teacher_id, follow_up_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        `).run(followUpId, id, current.student_id, current.teacher_id, data.follow_up_date, now, now);
      }
    }

    return this.findById(id);
  },

  setArchived(id: string, archived: boolean): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE notes SET archived = ?, updated_at = ? WHERE id = ?
    `).run(archived ? 1 : 0, now, id);
  }
};

/* =========================================================================
   FOLLOW-UPS REPOSITORY
   ========================================================================= */

export const FollowUpRepository = {
  getAll(filters: {
    status?: FollowUpStatus;
    studentId?: string;
    teacherId?: string;
  } = {}): FollowUp[] {
    const db = getDb();
    let query = `
      SELECT 
        f.*,
        s.name as student_name,
        s.student_number,
        c.name as class_name,
        g.name as grade_name,
        u.name as teacher_name,
        n.content as note_content,
        n.type as note_type,
        n.priority as note_priority,
        n.action_taken as action_taken
      FROM follow_ups f
      JOIN notes n ON f.note_id = n.id
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON f.teacher_id = u.id
      WHERE n.archived = 0 AND s.archived = 0
    `;
    const params: any[] = [];

    if (filters.status) {
      query += ' AND f.status = ?';
      params.push(filters.status);
    }
    if (filters.studentId) {
      query += ' AND f.student_id = ?';
      params.push(filters.studentId);
    }
    if (filters.teacherId) {
      query += ' AND f.teacher_id = ?';
      params.push(filters.teacherId);
    }

    query += ' ORDER BY f.follow_up_date ASC, f.created_at DESC';
    const rows = db.prepare(query).all(...params);
    return rows as any;
  },

  findById(id: string): FollowUp | null {
    const db = getDb();
    const row = db.prepare(`
      SELECT 
        f.*,
        s.name as student_name,
        s.student_number,
        c.name as class_name,
        g.name as grade_name,
        u.name as teacher_name,
        n.content as note_content,
        n.type as note_type,
        n.priority as note_priority,
        n.action_taken as action_taken
      FROM follow_ups f
      JOIN notes n ON f.note_id = n.id
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON f.teacher_id = u.id
      WHERE f.id = ?
    `).get(id);
    return (row as any) || null;
  },

  resolve(id: string, data: {
    status: FollowUpStatus;
    result?: string;
    additional_notes?: string;
  }): FollowUp | null {
    const db = getDb();
    const now = new Date().toISOString();
    const current = this.findById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE follow_ups
      SET status = ?, result = ?, additional_notes = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.status,
      data.result ? data.result.trim() : null,
      data.additional_notes ? data.additional_notes.trim() : null,
      now,
      id
    );

    if (data.status === 'completed') {
      const pendingCount = (db.prepare(`
        SELECT COUNT(*) as count FROM follow_ups 
        WHERE student_id = ? AND status = 'pending' AND id != ?
      `).get(current.student_id, id) as any).count;

      if (pendingCount === 0) {
        db.prepare(`
          UPDATE students SET status = 'normal', updated_at = ? WHERE id = ? AND status = 'needs_followup'
        `).run(now, current.student_id);
      }
    }

    return this.findById(id);
  }
};

/* =========================================================================
   DASHBOARD & STATS REPOSITORY (WITH RECENT ACTIVITY LOG)
   ========================================================================= */

export const DashboardRepository = {
  getStats(): DashboardStats & { recentActivities: Array<{ id: string; type: string; title: string; desc: string; time: string; icon: string }> } {
    const db = getDb();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const totalGrades = (db.prepare('SELECT COUNT(*) as c FROM grades WHERE archived = 0').get() as any).c;
    const totalClasses = (db.prepare('SELECT COUNT(*) as c FROM classes WHERE archived = 0').get() as any).c;
    const totalStudents = (db.prepare('SELECT COUNT(*) as c FROM students WHERE archived = 0').get() as any).c;
    const totalNotes = (db.prepare('SELECT COUNT(*) as c FROM notes WHERE archived = 0').get() as any).c;

    const studentsNeedingFollowUp = (db.prepare(`
      SELECT COUNT(DISTINCT student_id) as c FROM follow_ups WHERE status = 'pending'
    `).get() as any).c;

    const pendingFollowUps = (db.prepare(`
      SELECT COUNT(*) as c FROM follow_ups WHERE status = 'pending'
    `).get() as any).c;

    const notesToday = (db.prepare(`
      SELECT COUNT(*) as c FROM notes WHERE archived = 0 AND created_at LIKE ?
    `).get(`${todayStr}%`) as any).c;

    const notesThisWeek = (db.prepare(`
      SELECT COUNT(*) as c FROM notes WHERE archived = 0 AND created_at >= ?
    `).get(weekAgo) as any).c;

    const notesThisMonth = (db.prepare(`
      SELECT COUNT(*) as c FROM notes WHERE archived = 0 AND created_at >= ?
    `).get(monthAgo) as any).c;

    const recentNotes = NoteRepository.getAll({ includeArchived: false }).slice(0, 5);
    const urgentFollowUps = FollowUpRepository.getAll({ status: 'pending' }).slice(0, 5);

    const typeRows = db.prepare(`
      SELECT type, COUNT(*) as count FROM notes WHERE archived = 0 GROUP BY type
    `).all() as any[];

    const typeLabels: Record<string, string> = {
      academic: 'أكاديمية',
      behavioral: 'سلوكية',
      participation: 'مشاركة',
      skill: 'مهارة',
      positive: 'إيجابية',
      needs_followup: 'تحتاج متابعة',
      other: 'أخرى',
    };

    const notesByType = Object.keys(typeLabels).map((key) => {
      const match = typeRows.find((r) => r.type === key);
      return {
        type: key as NoteType,
        label: typeLabels[key],
        count: match ? match.count : 0,
      };
    });

    const classRows = db.prepare(`
      SELECT c.name as className, COUNT(n.id) as count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.archived = 0
      LEFT JOIN notes n ON n.student_id = s.id AND n.archived = 0
      WHERE c.archived = 0
      GROUP BY c.id, c.name
      ORDER BY count DESC
      LIMIT 8
    `).all() as any[];

    const statusRows = db.prepare(`
      SELECT status, COUNT(*) as count FROM students WHERE archived = 0 GROUP BY status
    `).all() as any[];

    const statusLabels: Record<string, string> = {
      excellent: 'ممتاز',
      normal: 'طبيعي',
      needs_followup: 'يحتاج متابعة',
    };

    const studentsByStatus = Object.keys(statusLabels).map((key) => {
      const match = statusRows.find((r) => r.status === key);
      return {
        status: key as StudentStatus,
        label: statusLabels[key],
        count: match ? match.count : 0,
      };
    });

    // Aggregate Recent Activity Feed
    const recentActivities: Array<{ id: string; type: string; title: string; desc: string; time: string; icon: string }> = [];

    // Recent notes activities
    for (const n of recentNotes.slice(0, 4)) {
      recentActivities.push({
        id: `act_note_${n.id}`,
        type: 'note',
        title: `تسجيل ملاحظة ${typeLabels[n.type] || ''} للطالب ${n.student_name}`,
        desc: n.content,
        time: n.created_at,
        icon: 'FileText',
      });
    }

    // Recent follow-up activities
    const resolvedFollowUps = FollowUpRepository.getAll({ status: 'completed' }).slice(0, 3);
    for (const fu of resolvedFollowUps) {
      recentActivities.push({
        id: `act_fu_${fu.id}`,
        type: 'follow_up',
        title: `إتمام متابعة الطالب ${fu.student_name}`,
        desc: fu.result || 'تم اتخاذ الإجراء المناسب بنجاح',
        time: fu.updated_at,
        icon: 'CheckCircle',
      });
    }

    // Sort combined activities by time
    recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      totalGrades,
      totalClasses,
      totalStudents,
      totalNotes,
      studentsNeedingFollowUp,
      pendingFollowUps,
      notesToday,
      notesThisWeek,
      notesThisMonth,
      recentNotes,
      urgentFollowUps,
      notesByType,
      notesByClass: classRows,
      studentsByStatus,
      recentActivities: recentActivities.slice(0, 6),
    };
  }
};

/* =========================================================================
   ARCHIVE & BACKUP REPOSITORY
   ========================================================================= */

export const ArchiveRepository = {
  getAllArchived() {
    const db = getDb();
    const grades = db.prepare('SELECT * FROM grades WHERE archived = 1').all();
    const classes = db.prepare(`
      SELECT c.*, g.name as grade_name 
      FROM classes c 
      JOIN grades g ON c.grade_id = g.id 
      WHERE c.archived = 1
    `).all();
    const students = db.prepare(`
      SELECT s.*, c.name as class_name, g.name as grade_name 
      FROM students s 
      JOIN classes c ON s.class_id = c.id 
      JOIN grades g ON c.grade_id = g.id 
      WHERE s.archived = 1
    `).all();
    const notes = db.prepare(`
      SELECT n.*, s.name as student_name, c.name as class_name 
      FROM notes n 
      JOIN students s ON n.student_id = s.id 
      JOIN classes c ON s.class_id = c.id 
      WHERE n.archived = 1
    `).all();

    return { grades, classes, students, notes };
  },

  restoreItem(type: 'grade' | 'class' | 'student' | 'note', id: string) {
    const db = getDb();
    const now = new Date().toISOString();
    const tableMap: Record<string, string> = {
      grade: 'grades',
      class: 'classes',
      student: 'students',
      note: 'notes',
    };
    const table = tableMap[type];
    if (!table) throw new Error('نوع غير صالح');

    db.prepare(`UPDATE ${table} SET archived = 0, updated_at = ? WHERE id = ?`).run(now, id);
  }
};

export const BackupRepository = {
  exportAll() {
    const db = getDb();
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: db.prepare('SELECT id, name, email, role, created_at, updated_at FROM users').all(),
      grades: db.prepare('SELECT * FROM grades').all(),
      classes: db.prepare('SELECT * FROM classes').all(),
      students: db.prepare('SELECT * FROM students').all(),
      notes: db.prepare('SELECT * FROM notes').all(),
      follow_ups: db.prepare('SELECT * FROM follow_ups').all(),
    };
  },

  resetAllData() {
    const db = getDb();
    db.exec('BEGIN TRANSACTION;');
    try {
      db.exec('DELETE FROM follow_ups;');
      db.exec('DELETE FROM notes;');
      db.exec('DELETE FROM students;');
      db.exec('DELETE FROM classes;');
      db.exec('DELETE FROM grades;');
      db.exec('COMMIT;');
      return { success: true };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  importAll(data: any) {
    const db = getDb();
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.exec('DELETE FROM follow_ups;');
      db.exec('DELETE FROM notes;');
      db.exec('DELETE FROM students;');
      db.exec('DELETE FROM classes;');
      db.exec('DELETE FROM grades;');

      if (Array.isArray(data.grades)) {
        const stmt = db.prepare('INSERT INTO grades (id, name, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
        for (const g of data.grades) {
          stmt.run(g.id, g.name, g.archived || 0, g.created_at || now, g.updated_at || now);
        }
      }

      if (Array.isArray(data.classes)) {
        const stmt = db.prepare('INSERT INTO classes (id, grade_id, name, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
        for (const c of data.classes) {
          stmt.run(c.id, c.grade_id, c.name, c.archived || 0, c.created_at || now, c.updated_at || now);
        }
      }

      if (Array.isArray(data.students)) {
        const stmt = db.prepare('INSERT INTO students (id, class_id, student_number, name, photo, status, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const s of data.students) {
          stmt.run(s.id, s.class_id, s.student_number, s.name, s.photo || null, s.status || 'normal', s.archived || 0, s.created_at || now, s.updated_at || now);
        }
      }

      if (Array.isArray(data.notes)) {
        const stmt = db.prepare('INSERT INTO notes (id, student_id, teacher_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const n of data.notes) {
          stmt.run(n.id, n.student_id, n.teacher_id, n.type, n.priority, n.content, n.action_taken || null, n.requires_follow_up || 0, n.archived || 0, n.created_at || now, n.updated_at || now);
        }
      }

      if (Array.isArray(data.follow_ups)) {
        const stmt = db.prepare('INSERT INTO follow_ups (id, note_id, student_id, teacher_id, follow_up_date, status, result, additional_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        for (const f of data.follow_ups) {
          stmt.run(f.id, f.note_id, f.student_id, f.teacher_id, f.follow_up_date, f.status || 'pending', f.result || null, f.additional_notes || null, f.created_at || now, f.updated_at || now);
        }
      }

      db.exec('COMMIT;');
      return { success: true };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
};
