import { getPgClient } from './postgres';
import {
  User,
  UserRole,
  UserStatus,
  Grade,
  ClassRoom,
  Student,
  Note,
  ClassNote,
  ClassNoteType,
  FollowUp,
  DashboardStats,
  OwnerStats,
  PricingInfo,
  Announcement,
  AnnouncementType,
  NoteType,
  NotePriority,
  StudentStatus,
  FollowUpStatus,
  LoginBannerSettings,
} from './types';
import { generateId } from './utils';

// ---------------- SYSTEM SETTINGS REPOSITORY ----------------
export const SystemSettingsRepository = {
  get: async (key: string): Promise<any> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    if (res.rows.length === 0) return null;
    try {
      return JSON.parse(res.rows[0].value);
    } catch {
      return res.rows[0].value;
    }
  },

  set: async (key: string, value: any): Promise<void> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    await pg.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3
    `, [key, strValue, now]);
  },

  getLoginBanner: async (): Promise<LoginBannerSettings> => {
    const saved = await SystemSettingsRepository.get('login_banner');
    if (saved) {
      return {
        title: saved.title ?? '🎉 عرض الإطلاق الحصري للمعلمين',
        content: saved.content ?? 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
        priceText: saved.priceText ?? '50 ريال سعودي',
        badgeText: saved.badgeText ?? 'عرض خاص',
        isActive: saved.isActive !== undefined ? Boolean(saved.isActive) : true,
        updatedAt: saved.updatedAt,
      };
    }
    return {
      title: '🎉 عرض الإطلاق الحصري للمعلمين',
      content: 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
      priceText: '50 ريال سعودي',
      badgeText: 'عرض خاص',
      isActive: true,
    };
  },

  updateLoginBanner: async (settings: Partial<LoginBannerSettings>): Promise<LoginBannerSettings> => {
    const current = await SystemSettingsRepository.getLoginBanner();
    const updated: LoginBannerSettings = {
      title: settings.title !== undefined ? String(settings.title).trim() : current.title,
      content: settings.content !== undefined ? String(settings.content).trim() : current.content,
      priceText: settings.priceText !== undefined ? String(settings.priceText).trim() : current.priceText,
      badgeText: settings.badgeText !== undefined ? String(settings.badgeText).trim() : current.badgeText,
      isActive: settings.isActive !== undefined ? Boolean(settings.isActive) : current.isActive,
      updatedAt: new Date().toISOString(),
    };
    await SystemSettingsRepository.set('login_banner', updated);
    return updated;
  },
};

// ---------------- PRICING & OFFER REPOSITORY ----------------
export const PricingRepository = {
  getPricingInfo: async (): Promise<PricingInfo> => {
    const pg = await getPgClient();
    const res = await pg.query(
      "SELECT COUNT(*) as count FROM users WHERE (role = 'TEACHER' OR role = 'teacher') AND status = 'active'"
    );

    const activeCount = res.rows[0] ? Number(res.rows[0].count) : 0;
    const offerLimit = 5;
    const isOfferActive = activeCount < offerLimit;
    const remainingSeats = isOfferActive ? offerLimit - activeCount : 0;
    const offerPrice = 50;
    const originalPrice = 100;
    const currentPrice = isOfferActive ? offerPrice : originalPrice;

    return {
      activeCount,
      offerLimit,
      isOfferActive,
      remainingSeats,
      currentPrice,
      offerPrice,
      originalPrice,
    };
  },
};

// ---------------- ANNOUNCEMENT REPOSITORY ----------------
export const AnnouncementRepository = {
  getAll: async (filters?: { isPublished?: boolean; search?: string }): Promise<Announcement[]> => {
    const pg = await getPgClient();
    let query = `
      SELECT a.*, 
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id AND ar.is_read = 1) as reads_count
      FROM announcements a
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters?.isPublished !== undefined) {
      query += ' AND a.is_published = $' + idx++;
      params.push(filters.isPublished ? 1 : 0);
    }
    if (filters?.search) {
      query += ' AND (a.title ILIKE $' + idx + ' OR a.content ILIKE $' + idx + ')';
      params.push('%' + filters.search + '%');
      idx++;
    }
    query += ' ORDER BY a.created_at DESC';
    const res = await pg.query(query, params);
    return res.rows as Announcement[];
  },

  getAllForOwner: async (filters?: { isPublished?: boolean; search?: string }): Promise<Announcement[]> => {
    return AnnouncementRepository.getAll(filters);
  },

  getActiveForTeacher: async (userId: string): Promise<Announcement[]> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT a.*, 
        COALESCE(ar.is_read, 0) as is_read,
        COALESCE(ar.is_hidden, 0) as is_hidden
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = $1
      WHERE a.is_published = 1 
        AND (ar.is_hidden IS NULL OR ar.is_hidden = 0)
      ORDER BY a.created_at DESC
    `, [userId]);
    return res.rows as Announcement[];
  },

  getById: async (id: string): Promise<Announcement | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM announcements WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  create: async (data: { title: string; content: string; type: AnnouncementType; is_published?: boolean; expires_at?: string }): Promise<Announcement> => {
    const pg = await getPgClient();
    const id = generateId('ann');
    const now = new Date().toISOString();
    const isPublished = data.is_published !== false ? 1 : 0;

    await pg.query(`
      INSERT INTO announcements (id, title, content, type, is_published, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, data.title.trim(), data.content.trim(), data.type, isPublished, data.expires_at || null, now, now]);

    return (await AnnouncementRepository.getById(id))!;
  },

  update: async (id: string, data: { title?: string; content?: string; type?: AnnouncementType; is_published?: boolean; expires_at?: string }): Promise<Announcement | null> => {
    const pg = await getPgClient();
    const existing = await AnnouncementRepository.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = $1'];
    const params: any[] = [now];
    let idx = 2;

    if (data.title !== undefined) {
      updates.push('title = $' + idx++);
      params.push(data.title.trim());
    }
    if (data.content !== undefined) {
      updates.push('content = $' + idx++);
      params.push(data.content.trim());
    }
    if (data.type !== undefined) {
      updates.push('type = $' + idx++);
      params.push(data.type);
    }
    if (data.is_published !== undefined) {
      updates.push('is_published = $' + idx++);
      params.push(data.is_published ? 1 : 0);
    }
    if (data.expires_at !== undefined) {
      updates.push('expires_at = $' + idx++);
      params.push(data.expires_at || null);
    }

    params.push(id);
    await pg.query('UPDATE announcements SET ' + updates.join(', ') + ' WHERE id = $' + idx, params);
    return AnnouncementRepository.getById(id);
  },

  delete: async (id: string): Promise<boolean> => {
    const pg = await getPgClient();
    const res = await pg.query('DELETE FROM announcements WHERE id = $1', [id]);
    return res.rowCount > 0;
  },

  togglePublish: async (id: string): Promise<Announcement | null> => {
    const pg = await getPgClient();
    const ann = await AnnouncementRepository.getById(id);
    if (!ann) return null;
    const newStatus = ann.is_published === 1 ? 0 : 1;
    const now = new Date().toISOString();
    await pg.query('UPDATE announcements SET is_published = $1, updated_at = $2 WHERE id = $3', [newStatus, now, id]);
    return AnnouncementRepository.getById(id);
  },

  markAsRead: async (announcementId: string, userId: string): Promise<void> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query(`
      INSERT INTO announcement_reads (id, announcement_id, user_id, is_read, read_at, created_at)
      VALUES ($1, $2, $3, 1, $4, $5)
      ON CONFLICT(announcement_id, user_id) DO UPDATE SET
        is_read = 1,
        read_at = EXCLUDED.read_at
    `, [generateId('ar'), announcementId, userId, now, now]);
  },

  markAsHidden: async (announcementId: string, userId: string): Promise<void> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query(`
      INSERT INTO announcement_reads (id, announcement_id, user_id, is_hidden, hidden_at, created_at)
      VALUES ($1, $2, $3, 1, $4, $5)
      ON CONFLICT(announcement_id, user_id) DO UPDATE SET
        is_hidden = 1,
        hidden_at = EXCLUDED.hidden_at
    `, [generateId('ar'), announcementId, userId, now, now]);
  },
};

// ---------------- USER REPOSITORY ----------------
export const UserRepository = {
  findByEmail: async (email: string): Promise<(User & { password_hash: string }) | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    return res.rows[0] || null;
  },

  findById: async (id: string): Promise<User | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT id, name, email, role, status, must_change_password, onboarding_completed, onboarding_skipped, onboarding_version, onboarding_completed_at, last_login, created_at, updated_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  getOnboardingStatus: async (userId: string): Promise<{ completed: boolean; skipped: boolean; version: number; shouldShowTour: boolean }> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT onboarding_completed, onboarding_skipped, onboarding_version, role FROM users WHERE id = $1', [userId]);
    if (res.rows.length === 0) {
      return { completed: false, skipped: false, version: 1, shouldShowTour: false };
    }
    const row = res.rows[0];
    const completed = row.onboarding_completed === 1;
    const skipped = row.onboarding_skipped === 1;
    const version = Number(row.onboarding_version) || 1;
    const isTeacher = String(row.role).toUpperCase() === 'TEACHER';
    const shouldShowTour = isTeacher && !completed && !skipped;
    return { completed, skipped, version, shouldShowTour };
  },

  updateOnboardingStatus: async (userId: string, action: 'complete' | 'skip' | 'reset', version: number = 1): Promise<{ completed: boolean; skipped: boolean; version: number; shouldShowTour: boolean }> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();

    if (action === 'complete') {
      await pg.query(`
        UPDATE users
        SET onboarding_completed = 1, onboarding_skipped = 0, onboarding_version = $1, onboarding_completed_at = $2, updated_at = $2
        WHERE id = $3
      `, [version, now, userId]);
    } else if (action === 'skip') {
      await pg.query(`
        UPDATE users
        SET onboarding_skipped = 1, onboarding_version = $1, updated_at = $2
        WHERE id = $3
      `, [version, now, userId]);
    } else if (action === 'reset') {
      await pg.query(`
        UPDATE users
        SET onboarding_completed = 0, onboarding_skipped = 0, onboarding_version = $1, onboarding_completed_at = NULL, updated_at = $2
        WHERE id = $3
      `, [version, now, userId]);
    }

    return UserRepository.getOnboardingStatus(userId);
  },

  create: async (data: { name: string; email: string; password_hash: string; status?: UserStatus; must_change_password?: number; role?: string }): Promise<User> => {
    return UserRepository.createTeacher(data);
  },

  createTeacher: async (data: { name: string; email: string; password_hash: string; status?: UserStatus; must_change_password?: number }): Promise<User> => {
    const pg = await getPgClient();
    const id = generateId('user');
    const now = new Date().toISOString();
    const status = data.status || 'pending';
    const mustChangePassword = data.must_change_password ? 1 : 0;

    await pg.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, must_change_password, created_at, updated_at)
      VALUES ($1, $2, LOWER($3), $4, 'TEACHER', $5, $6, $7, $8)
    `, [id, data.name.trim(), data.email.trim(), data.password_hash, status, mustChangePassword, now, now]);

    return (await UserRepository.findById(id))!;
  },

  updateStatus: async (id: string, status: UserStatus): Promise<User | null> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query('UPDATE users SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);
    return UserRepository.findById(id);
  },

  resetPasswordByOwner: async (id: string, password_hash: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE users SET password_hash = $1, must_change_password = 1, updated_at = $2 WHERE id = $3', [password_hash, now, id]);
    return res.rowCount > 0;
  },

  changePassword: async (id: string, password_hash: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE users SET password_hash = $1, must_change_password = 0, updated_at = $2 WHERE id = $3', [password_hash, now, id]);
    return res.rowCount > 0;
  },

  updatePassword: async (id: string, password_hash: string, mustChangePassword: boolean = false): Promise<void> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query('UPDATE users SET password_hash = $1, must_change_password = $2, updated_at = $3 WHERE id = $4', [password_hash, mustChangePassword ? 1 : 0, now, id]);
  },

  deleteTeacherPermanent: async (teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const user = await UserRepository.findById(teacherId);
    if (!user) return false;

    // Execute safe cascaded transaction
    await pg.query('BEGIN');
    try {
      await pg.query('DELETE FROM follow_ups WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM class_notes WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM notes WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM students WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM classes WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM grades WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM support_tickets WHERE teacher_id = $1', [teacherId]);
      await pg.query('DELETE FROM announcement_reads WHERE user_id = $1', [teacherId]);
      await pg.query('DELETE FROM password_resets WHERE email = $1', [user.email]);
      await pg.query('DELETE FROM users WHERE id = $1', [teacherId]);
      await pg.query('COMMIT');
      return true;
    } catch (e) {
      await pg.query('ROLLBACK');
      throw e;
    }
  },

  updateTeacherProfile: async (teacherId: string, data: { name?: string; email?: string; status?: UserStatus }): Promise<User | null> => {
    const pg = await getPgClient();
    const existing = await UserRepository.findById(teacherId);
    if (!existing) return null;

    const updates: string[] = ['updated_at = $1'];
    const params: any[] = [new Date().toISOString()];
    let idx = 2;

    if (data.name !== undefined) {
      updates.push('name = $' + idx++);
      params.push(data.name.trim());
    }
    if (data.email !== undefined) {
      updates.push('email = LOWER($' + idx++ + ')');
      params.push(data.email.trim());
    }
    if (data.status !== undefined) {
      updates.push('status = $' + idx++);
      params.push(data.status);
    }

    params.push(teacherId);
    await pg.query('UPDATE users SET ' + updates.join(', ') + ' WHERE id = $' + idx, params);
    return UserRepository.findById(teacherId);
  },

  updateLastLogin: async (id: string): Promise<void> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query('UPDATE users SET last_login = $1, updated_at = $2 WHERE id = $3', [now, now, id]);
  },

  getAllTeachers: async (filters?: { status?: UserStatus; search?: string }): Promise<User[]> => {
    const pg = await getPgClient();
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.status, u.must_change_password, u.last_login, u.created_at, u.updated_at,
        (SELECT COUNT(*) FROM students s WHERE s.teacher_id = u.id AND s.archived = 0) as students_count,
        (SELECT COUNT(*) FROM notes n WHERE n.teacher_id = u.id AND n.archived = 0) as notes_count
      FROM users u
      WHERE (u.role = 'TEACHER' OR u.role = 'teacher')
    `;
    const params: any[] = [];
    let idx = 1;

    if (filters?.status) {
      query += ' AND u.status = $' + idx++;
      params.push(filters.status);
    }

    if (filters?.search) {
      query += ' AND (u.name ILIKE $' + idx + ' OR u.email ILIKE $' + idx + ')';
      params.push('%' + filters.search + '%');
      idx++;
    }

    query += ' ORDER BY u.created_at DESC';
    const res = await pg.query(query, params);
    return res.rows as unknown as User[];
  },

  getOwnerStats: async (): Promise<OwnerStats> => {
    const pg = await getPgClient();
    const totalTeachersRes = await pg.query("SELECT COUNT(*) as count FROM users WHERE role = 'TEACHER' OR role = 'teacher'");
    const activeTeachersRes = await pg.query("SELECT COUNT(*) as count FROM users WHERE (role = 'TEACHER' OR role = 'teacher') AND status = 'active'");
    const pendingTeachersRes = await pg.query("SELECT COUNT(*) as count FROM users WHERE (role = 'TEACHER' OR role = 'teacher') AND status = 'pending'");
    const disabledTeachersRes = await pg.query("SELECT COUNT(*) as count FROM users WHERE (role = 'TEACHER' OR role = 'teacher') AND status = 'disabled'");
    
    const totalStudentsRes = await pg.query("SELECT COUNT(*) as count FROM students WHERE archived = 0");
    const totalNotesRes = await pg.query("SELECT COUNT(*) as count FROM notes WHERE archived = 0");

    const activeTeachers = activeTeachersRes.rows[0] ? Number(activeTeachersRes.rows[0].count) : 0;
    const pricing = await PricingRepository.getPricingInfo();

    let totalRevenue = 0;
    if (activeTeachers <= 5) {
      totalRevenue = activeTeachers * 50;
    } else {
      totalRevenue = (5 * 50) + ((activeTeachers - 5) * 100);
    }

    const allTeachers = await UserRepository.getAllTeachers();
    const recentTeachers = allTeachers.slice(0, 5);

    return {
      totalTeachers: totalTeachersRes.rows[0] ? Number(totalTeachersRes.rows[0].count) : 0,
      activeTeachers,
      pendingTeachers: pendingTeachersRes.rows[0] ? Number(pendingTeachersRes.rows[0].count) : 0,
      disabledTeachers: disabledTeachersRes.rows[0] ? Number(disabledTeachersRes.rows[0].count) : 0,
      totalStudents: totalStudentsRes.rows[0] ? Number(totalStudentsRes.rows[0].count) : 0,
      totalNotes: totalNotesRes.rows[0] ? Number(totalNotesRes.rows[0].count) : 0,
      totalRevenue,
      pricing,
      recentTeachers,
    };
  },

  logActivity: async (userId: string | null, action: string, details: string): Promise<void> => {
    await UserRepository.logAudit(userId, action, details);
  },

  logAudit: async (userId: string | null, action: string, details: string): Promise<void> => {
    const pg = await getPgClient();
    const id = generateId('audit');
    const now = new Date().toISOString();
    await pg.query('INSERT INTO audit_logs (id, user_id, action, details, created_at) VALUES ($1, $2, $3, $4, $5)', [id, userId, action, details, now]);
  },
};

// ---------------- CLASS NOTE REPOSITORY ----------------
export const ClassNoteRepository = {
  getAll: async ({
    teacherId,
    classId,
    type,
    startDate,
    endDate,
    search,
    includeArchived = false,
    limit,
    offset,
  }: {
    teacherId: string;
    classId?: string;
    type?: ClassNoteType;
    startDate?: string;
    endDate?: string;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ClassNote[]> => {
    const pg = await getPgClient();
    let query = `
      SELECT cn.*, c.name as class_name, g.name as grade_name, g.id as grade_id
      FROM class_notes cn
      JOIN classes c ON cn.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE cn.teacher_id = $1
    `;
    const params: any[] = [teacherId];
    let idx = 2;

    if (!includeArchived) {
      query += ' AND cn.archived = 0';
    }
    if (classId) {
      query += ' AND cn.class_id = $' + idx++;
      params.push(classId);
    }
    if (type) {
      query += ' AND cn.type = $' + idx++;
      params.push(type);
    }
    if (startDate) {
      query += ' AND cn.note_date >= $' + idx++;
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND cn.note_date <= $' + idx++;
      params.push(endDate);
    }
    if (search) {
      query += ' AND (cn.content ILIKE $' + idx + ' OR cn.title ILIKE $' + idx + ')';
      params.push('%' + search + '%');
      idx++;
    }

    query += ' ORDER BY cn.note_date DESC, cn.created_at DESC';

    if (limit !== undefined) {
      query += ' LIMIT $' + idx++;
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET $' + idx++;
        params.push(offset);
      }
    }

    const res = await pg.query(query, params);
    return res.rows as unknown as ClassNote[];
  },

  getById: async (id: string, teacherId: string): Promise<ClassNote | null> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT cn.*, c.name as class_name, g.name as grade_name, g.id as grade_id
      FROM class_notes cn
      JOIN classes c ON cn.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE cn.id = $1 AND cn.teacher_id = $2
    `, [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (data: {
    teacherId: string;
    classId: string;
    title?: string;
    content: string;
    type?: ClassNoteType;
    noteDate?: string;
  }): Promise<ClassNote> => {
    const pg = await getPgClient();
    const id = generateId('cnote');
    const now = new Date().toISOString();
    const noteDate = data.noteDate || now.split('T')[0];
    const type = data.type || 'general';
    const title = data.title?.trim() || null;

    await pg.query(`
      INSERT INTO class_notes (id, teacher_id, class_id, title, content, type, note_date, archived, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9)
    `, [id, data.teacherId, data.classId, title, data.content.trim(), type, noteDate, now, now]);

    return (await ClassNoteRepository.getById(id, data.teacherId))!;
  },

  update: async (
    id: string,
    teacherId: string,
    data: {
      title?: string;
      content?: string;
      type?: ClassNoteType;
      noteDate?: string;
    }
  ): Promise<ClassNote | null> => {
    const pg = await getPgClient();
    const existing = await ClassNoteRepository.getById(id, teacherId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = $1'];
    const params: any[] = [now];
    let idx = 2;

    if (data.title !== undefined) {
      updates.push('title = $' + idx++);
      params.push(data.title.trim() || null);
    }
    if (data.content !== undefined) {
      updates.push('content = $' + idx++);
      params.push(data.content.trim());
    }
    if (data.type !== undefined) {
      updates.push('type = $' + idx++);
      params.push(data.type);
    }
    if (data.noteDate !== undefined) {
      updates.push('note_date = $' + idx++);
      params.push(data.noteDate);
    }

    params.push(id, teacherId);
    await pg.query('UPDATE class_notes SET ' + updates.join(', ') + ' WHERE id = $' + (idx++) + ' AND teacher_id = $' + idx, params);

    return ClassNoteRepository.getById(id, teacherId);
  },

  delete: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const res = await pg.query('DELETE FROM class_notes WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
    return res.rowCount > 0;
  },
};

// ---------------- GRADE REPOSITORY ----------------
export const GradeRepository = {
  findById: async (id: string, teacherId: string): Promise<Grade | null> => {
    return GradeRepository.getById(id, teacherId);
  },

  getAll: async (options?: { includeArchived?: boolean; teacherId: string }): Promise<Grade[]> => {
    const pg = await getPgClient();
    const includeArchived = options?.includeArchived ?? false;
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM classes c WHERE c.grade_id = g.id AND c.teacher_id = g.teacher_id AND c.archived = 0) as classes_count,
        (SELECT COUNT(*) FROM students s JOIN classes c ON s.class_id = c.id WHERE c.grade_id = g.id AND s.teacher_id = g.teacher_id AND s.archived = 0) as students_count
      FROM grades g
      WHERE g.teacher_id = $1
    `;
    if (!includeArchived) {
      query += ' AND g.archived = 0';
    }
    query += ' ORDER BY g.created_at ASC';
    const res = await pg.query(query, [teacherId]);
    return res.rows as unknown as Grade[];
  },

  getById: async (id: string, teacherId: string): Promise<Grade | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM grades WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (name: string, teacherId: string): Promise<Grade> => {
    const pg = await getPgClient();
    const id = generateId('grade');
    const now = new Date().toISOString();
    await pg.query('INSERT INTO grades (id, teacher_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)', [
      id,
      teacherId,
      name.trim(),
      now,
      now,
    ]);
    return (await GradeRepository.getById(id, teacherId))!;
  },

  update: async (id: string, name: string, teacherId: string): Promise<Grade | null> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query('UPDATE grades SET name = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [name.trim(), now, id, teacherId]);
    return GradeRepository.getById(id, teacherId);
  },

  archive: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE grades SET archived = 1, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  setArchived: async (id: string, archived: boolean, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE grades SET archived = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [archived ? 1 : 0, now, id, teacherId]);
    return res.rowCount > 0;
  },

  restore: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE grades SET archived = 0, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  delete: async (id: string, teacherId: string): Promise<void> => {
    const pg = await getPgClient();
    await pg.query('DELETE FROM grades WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
  },
};

// ---------------- CLASS REPOSITORY ----------------
export const ClassRepository = {
  findById: async (id: string, teacherId: string): Promise<ClassRoom | null> => {
    return ClassRepository.getById(id, teacherId);
  },

  getAll: async (options?: { gradeId?: string; includeArchived?: boolean; teacherId: string }): Promise<ClassRoom[]> => {
    const pg = await getPgClient();
    const includeArchived = options?.includeArchived ?? false;
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = `
      SELECT c.*, g.name as grade_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.teacher_id = c.teacher_id AND s.archived = 0) as students_count,
        (SELECT COUNT(*) FROM class_notes cn WHERE cn.class_id = c.id AND cn.teacher_id = c.teacher_id AND cn.archived = 0) as class_notes_count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      WHERE c.teacher_id = $1
    `;
    const params: any[] = [teacherId];
    let idx = 2;

    if (!includeArchived) {
      query += ' AND c.archived = 0 AND g.archived = 0';
    }
    if (options?.gradeId) {
      query += ' AND c.grade_id = $' + idx++;
      params.push(options.gradeId);
    }
    query += ' ORDER BY c.created_at ASC';
    const res = await pg.query(query, params);
    return res.rows as unknown as ClassRoom[];
  },

  getById: async (id: string, teacherId: string): Promise<ClassRoom | null> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT c.*, g.name as grade_name,
        (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.teacher_id = c.teacher_id AND s.archived = 0) as students_count,
        (SELECT COUNT(*) FROM class_notes cn WHERE cn.class_id = c.id AND cn.teacher_id = c.teacher_id AND cn.archived = 0) as class_notes_count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      WHERE c.id = $1 AND c.teacher_id = $2
    `, [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (
    dataOrGradeId: string | { grade_id?: string; gradeId?: string; name: string; teacher_id?: string; teacherId?: string },
    nameArg?: string,
    teacherIdArg?: string
  ): Promise<ClassRoom> => {
    const pg = await getPgClient();
    const id = generateId('class');
    const now = new Date().toISOString();

    let gradeId = '';
    let name = '';
    let teacherId = '';

    if (typeof dataOrGradeId === 'object') {
      gradeId = dataOrGradeId.grade_id || dataOrGradeId.gradeId || '';
      name = dataOrGradeId.name || '';
      teacherId = dataOrGradeId.teacher_id || dataOrGradeId.teacherId || '';
    } else {
      gradeId = dataOrGradeId;
      name = nameArg || '';
      teacherId = teacherIdArg || '';
    }

    await pg.query('INSERT INTO classes (id, teacher_id, grade_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)', [
      id,
      teacherId,
      gradeId,
      name.trim(),
      now,
      now,
    ]);
    return (await ClassRepository.getById(id, teacherId))!;
  },

  update: async (id: string, name: string, teacherId: string): Promise<ClassRoom | null> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    await pg.query('UPDATE classes SET name = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [name.trim(), now, id, teacherId]);
    return ClassRepository.getById(id, teacherId);
  },

  archive: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE classes SET archived = 1, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  setArchived: async (id: string, archived: boolean, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE classes SET archived = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [archived ? 1 : 0, now, id, teacherId]);
    return res.rowCount > 0;
  },

  restore: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE classes SET archived = 0, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  delete: async (id: string, teacherId: string): Promise<void> => {
    const pg = await getPgClient();
    await pg.query('DELETE FROM classes WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
  },
};

// ---------------- STUDENT REPOSITORY ----------------
export const StudentRepository = {
  findById: async (id: string, teacherId: string): Promise<Student | null> => {
    return StudentRepository.getById(id, teacherId);
  },

  getAll: async (options?: {
    gradeId?: string;
    classId?: string;
    status?: StudentStatus;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    teacherId: string;
  }): Promise<Student[]> => {
    const pg = await getPgClient();
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = `
      SELECT s.*, c.name as class_name, g.name as grade_name, g.id as grade_id,
        (SELECT COUNT(*) FROM notes n WHERE n.student_id = s.id AND n.teacher_id = s.teacher_id AND n.archived = 0) as notes_count,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.student_id = s.id AND f.teacher_id = s.teacher_id AND f.status = 'pending') as follow_ups_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE s.teacher_id = $1
    `;
    const params: any[] = [teacherId];
    let idx = 2;

    if (!options?.includeArchived) {
      query += ' AND s.archived = 0 AND c.archived = 0 AND g.archived = 0';
    }
    if (options?.classId) {
      query += ' AND s.class_id = $' + idx++;
      params.push(options.classId);
    }
    if (options?.gradeId) {
      query += ' AND c.grade_id = $' + idx++;
      params.push(options.gradeId);
    }
    if (options?.status) {
      query += ' AND s.status = $' + idx++;
      params.push(options.status);
    }
    if (options?.search) {
      query += ' AND (s.name ILIKE $' + idx + ' OR s.student_number ILIKE $' + idx + ')';
      params.push('%' + options.search + '%');
      idx++;
    }

    query += ' ORDER BY s.name ASC';

    if (options?.limit !== undefined) {
      query += ' LIMIT $' + idx++;
      params.push(options.limit);
      if (options?.offset !== undefined) {
        query += ' OFFSET $' + idx++;
        params.push(options.offset);
      }
    }

    const res = await pg.query(query, params);
    return res.rows as unknown as Student[];
  },

  getById: async (id: string, teacherId: string): Promise<Student | null> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT s.*, c.name as class_name, g.name as grade_name, g.id as grade_id,
        (SELECT COUNT(*) FROM notes n WHERE n.student_id = s.id AND n.teacher_id = s.teacher_id AND n.archived = 0) as notes_count,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.student_id = s.id AND f.teacher_id = s.teacher_id AND f.status = 'pending') as follow_ups_count
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      WHERE s.id = $1 AND s.teacher_id = $2
    `, [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (data: { class_id?: string; classId?: string; student_number?: string; studentNumber?: string; name: string; photo?: string; status?: StudentStatus; teacher_id?: string; teacherId?: string }): Promise<Student> => {
    const pg = await getPgClient();
    const id = generateId('student');
    const now = new Date().toISOString();
    const teacherId = data.teacherId || data.teacher_id || '';
    const classId = data.classId || data.class_id || '';
    const studentNumber = data.studentNumber || data.student_number || '';

    await pg.query(`
      INSERT INTO students (id, teacher_id, class_id, student_number, name, photo, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      id,
      teacherId,
      classId,
      studentNumber.trim(),
      data.name.trim(),
      data.photo || null,
      data.status || 'normal',
      now,
      now,
    ]);
    return (await StudentRepository.getById(id, teacherId))!;
  },

  bulkCreate: async (students: { classId: string; studentNumber: string; name: string; teacherId: string }[]): Promise<number> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    let count = 0;
    for (const s of students) {
      const id = generateId('student');
      await pg.query(`
        INSERT INTO students (id, teacher_id, class_id, student_number, name, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, 'normal', $6, $7)
      `, [id, s.teacherId, s.classId, s.studentNumber.trim(), s.name.trim(), now, now]);
      count++;
    }
    return count;
  },

  update: async (id: string, data: { name?: string; studentNumber?: string; classId?: string; photo?: string; status?: StudentStatus }, teacherId: string): Promise<Student | null> => {
    const pg = await getPgClient();
    const current = await StudentRepository.getById(id, teacherId);
    if (!current) return null;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name.trim() : current.name;
    const studentNumber = data.studentNumber !== undefined ? data.studentNumber.trim() : current.student_number;
    const classId = data.classId !== undefined ? data.classId : current.class_id;
    const photo = data.photo !== undefined ? data.photo : current.photo;
    const status = data.status !== undefined ? data.status : current.status;

    await pg.query(`
      UPDATE students 
      SET name = $1, student_number = $2, class_id = $3, photo = $4, status = $5, updated_at = $6
      WHERE id = $7 AND teacher_id = $8
    `, [name, studentNumber, classId, photo, status, now, id, teacherId]);

    return StudentRepository.getById(id, teacherId);
  },

  archive: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE students SET archived = 1, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  setArchived: async (id: string, archived: boolean, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE students SET archived = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [archived ? 1 : 0, now, id, teacherId]);
    return res.rowCount > 0;
  },

  restore: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE students SET archived = 0, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  delete: async (id: string, teacherId: string): Promise<void> => {
    const pg = await getPgClient();
    await pg.query('DELETE FROM students WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
  },
};

// ---------------- NOTE REPOSITORY ----------------
export const NoteRepository = {
  findById: async (id: string, teacherId: string): Promise<Note | null> => {
    return NoteRepository.getById(id, teacherId);
  },

  getAll: async (options?: {
    studentId?: string;
    classId?: string;
    gradeId?: string;
    type?: NoteType;
    priority?: NotePriority;
    requiresFollowUp?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
    teacherId: string;
  }): Promise<Note[]> => {
    const pg = await getPgClient();
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = `
      SELECT n.*, s.name as student_name, s.student_number, c.name as class_name, c.id as class_id, g.name as grade_name, g.id as grade_id, u.name as teacher_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON n.teacher_id = u.id
      WHERE n.teacher_id = $1
    `;
    const params: any[] = [teacherId];
    let idx = 2;

    if (!options?.includeArchived) {
      query += ' AND n.archived = 0';
    }
    if (options?.studentId) {
      query += ' AND n.student_id = $' + idx++;
      params.push(options.studentId);
    }
    if (options?.classId) {
      query += ' AND s.class_id = $' + idx++;
      params.push(options.classId);
    }
    if (options?.gradeId) {
      query += ' AND c.grade_id = $' + idx++;
      params.push(options.gradeId);
    }
    if (options?.type) {
      query += ' AND n.type = $' + idx++;
      params.push(options.type);
    }
    if (options?.priority) {
      query += ' AND n.priority = $' + idx++;
      params.push(options.priority);
    }
    if (options?.requiresFollowUp !== undefined) {
      query += ' AND n.requires_follow_up = $' + idx++;
      params.push(options.requiresFollowUp ? 1 : 0);
    }
    if (options?.startDate) {
      query += ' AND n.created_at >= $' + idx++;
      params.push(options.startDate);
    }
    if (options?.endDate) {
      query += ' AND n.created_at <= $' + idx++;
      params.push(options.endDate);
    }
    if (options?.search) {
      query += ' AND (n.content ILIKE $' + idx + ' OR s.name ILIKE $' + idx + ' OR s.student_number ILIKE $' + idx + ')';
      params.push('%' + options.search + '%');
      idx++;
    }

    query += ' ORDER BY n.created_at DESC';

    if (options?.limit !== undefined) {
      query += ' LIMIT $' + idx++;
      params.push(options.limit);
      if (options?.offset !== undefined) {
        query += ' OFFSET $' + idx++;
        params.push(options.offset);
      }
    }

    const res = await pg.query(query, params);
    return res.rows as unknown as Note[];
  },

  getById: async (id: string, teacherId: string): Promise<Note | null> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT n.*, s.name as student_name, s.student_number, c.name as class_name, c.id as class_id, g.name as grade_name, g.id as grade_id, u.name as teacher_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON n.teacher_id = u.id
      WHERE n.id = $1 AND n.teacher_id = $2
    `, [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (data: {
    student_id?: string;
    studentId?: string;
    type: NoteType;
    priority: NotePriority;
    content: string;
    action_taken?: string;
    actionTaken?: string;
    requires_follow_up?: boolean;
    requiresFollowUp?: boolean;
    follow_up_date?: string;
    teacher_id?: string;
    teacherId?: string;
  }): Promise<Note> => {
    const pg = await getPgClient();
    const id = generateId('note');
    const now = new Date().toISOString();
    const teacherId = data.teacherId || data.teacher_id || '';
    const studentId = data.studentId || data.student_id || '';
    const actionTaken = data.actionTaken || data.action_taken || null;
    const reqFollowUp = data.requiresFollowUp ?? data.requires_follow_up ?? false;
    const requiresFollowUp = reqFollowUp ? 1 : 0;

    await pg.query(`
      INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      id,
      teacherId,
      studentId,
      data.type,
      data.priority,
      data.content.trim(),
      actionTaken?.trim() || null,
      requiresFollowUp,
      now,
      now,
    ]);

    if (requiresFollowUp) {
      let followUpDate = data.follow_up_date;
      if (!followUpDate) {
        const d = new Date();
        d.setDate(d.getDate() + 3);
        followUpDate = d.toISOString();
      }
      await FollowUpRepository.create({
        noteId: id,
        studentId,
        followUpDate,
        teacherId,
      });
    }

    return (await NoteRepository.getById(id, teacherId))!;
  },

  update: async (
    id: string,
    data: {
      type?: NoteType;
      priority?: NotePriority;
      content?: string;
      actionTaken?: string;
      requiresFollowUp?: boolean;
    },
    teacherId: string
  ): Promise<Note | null> => {
    const pg = await getPgClient();
    const current = await NoteRepository.getById(id, teacherId);
    if (!current) return null;

    const now = new Date().toISOString();
    const type = data.type !== undefined ? data.type : current.type;
    const priority = data.priority !== undefined ? data.priority : current.priority;
    const content = data.content !== undefined ? data.content.trim() : current.content;
    const actionTaken = data.actionTaken !== undefined ? data.actionTaken?.trim() || null : current.action_taken;
    const requiresFollowUp = data.requiresFollowUp !== undefined ? (data.requiresFollowUp ? 1 : 0) : current.requires_follow_up;

    await pg.query(`
      UPDATE notes 
      SET type = $1, priority = $2, content = $3, action_taken = $4, requires_follow_up = $5, updated_at = $6
      WHERE id = $7 AND teacher_id = $8
    `, [type, priority, content, actionTaken, requiresFollowUp, now, id, teacherId]);

    return NoteRepository.getById(id, teacherId);
  },

  archive: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE notes SET archived = 1, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  setArchived: async (id: string, archived: boolean, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE notes SET archived = $1, updated_at = $2 WHERE id = $3 AND teacher_id = $4', [archived ? 1 : 0, now, id, teacherId]);
    return res.rowCount > 0;
  },

  restore: async (id: string, teacherId: string): Promise<boolean> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    const res = await pg.query('UPDATE notes SET archived = 0, updated_at = $1 WHERE id = $2 AND teacher_id = $3', [now, id, teacherId]);
    return res.rowCount > 0;
  },

  delete: async (id: string, teacherId: string): Promise<void> => {
    const pg = await getPgClient();
    await pg.query('DELETE FROM follow_ups WHERE note_id = $1 AND teacher_id = $2', [id, teacherId]);
    await pg.query('DELETE FROM notes WHERE id = $1 AND teacher_id = $2', [id, teacherId]);
  },
};

// ---------------- FOLLOW-UP REPOSITORY ----------------
export const FollowUpRepository = {
  getAll: async (options?: {
    studentId?: string;
    status?: FollowUpStatus;
    limit?: number;
    offset?: number;
    teacherId: string;
  }): Promise<FollowUp[]> => {
    const pg = await getPgClient();
    const teacherId = options?.teacherId;
    if (!teacherId) return [];

    let query = `
      SELECT f.*, s.name as student_name, s.student_number, c.name as class_name, g.name as grade_name,
        n.content as note_content, n.type as note_type, n.priority as note_priority, n.action_taken
      FROM follow_ups f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN notes n ON f.note_id = n.id
      WHERE f.teacher_id = $1
    `;
    const params: any[] = [teacherId];
    let idx = 2;

    if (options?.studentId) {
      query += ' AND f.student_id = $' + idx++;
      params.push(options.studentId);
    }
    if (options?.status) {
      query += ' AND f.status = $' + idx++;
      params.push(options.status);
    }

    query += ' ORDER BY f.follow_up_date ASC';

    if (options?.limit !== undefined) {
      query += ' LIMIT $' + idx++;
      params.push(options.limit);
      if (options?.offset !== undefined) {
        query += ' OFFSET $' + idx++;
        params.push(options.offset);
      }
    }

    const res = await pg.query(query, params);
    return res.rows as unknown as FollowUp[];
  },

  getById: async (id: string, teacherId: string): Promise<FollowUp | null> => {
    const pg = await getPgClient();
    const res = await pg.query(`
      SELECT f.*, s.name as student_name, s.student_number, c.name as class_name, g.name as grade_name,
        n.content as note_content, n.type as note_type, n.priority as note_priority, n.action_taken
      FROM follow_ups f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN notes n ON f.note_id = n.id
      WHERE f.id = $1 AND f.teacher_id = $2
    `, [id, teacherId]);
    return res.rows[0] || null;
  },

  create: async (data: { noteId: string; studentId: string; followUpDate: string; teacherId: string }): Promise<FollowUp> => {
    const pg = await getPgClient();
    const id = generateId('fup');
    const now = new Date().toISOString();
    await pg.query(`
      INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
    `, [id, data.teacherId, data.noteId, data.studentId, data.followUpDate, now, now]);
    return (await FollowUpRepository.getById(id, data.teacherId))!;
  },

  updateStatus: async (id: string, status: FollowUpStatus, result?: string, additionalNotes?: string, teacherId?: string): Promise<FollowUp | null> => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    let query = 'UPDATE follow_ups SET status = $1, result = $2, additional_notes = $3, updated_at = $4 WHERE id = $5';
    const params: any[] = [status, result?.trim() || null, additionalNotes?.trim() || null, now, id];

    if (teacherId) {
      query += ' AND teacher_id = $6';
      params.push(teacherId);
    }

    await pg.query(query, params);
    return teacherId ? FollowUpRepository.getById(id, teacherId) : null;
  },
};

// ---------------- DASHBOARD REPOSITORY ----------------
export const DashboardRepository = {
  getStats: async (teacherId: string): Promise<DashboardStats> => {
    const pg = await getPgClient();
    
    const totalGradesRes = await pg.query('SELECT COUNT(*) as count FROM grades WHERE teacher_id = $1 AND archived = 0', [teacherId]);
    const totalClassesRes = await pg.query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = $1 AND archived = 0', [teacherId]);
    const totalStudentsRes = await pg.query('SELECT COUNT(*) as count FROM students WHERE teacher_id = $1 AND archived = 0', [teacherId]);
    const totalNotesRes = await pg.query('SELECT COUNT(*) as count FROM notes WHERE teacher_id = $1 AND archived = 0', [teacherId]);
    const totalClassNotesRes = await pg.query('SELECT COUNT(*) as count FROM class_notes WHERE teacher_id = $1 AND archived = 0', [teacherId]);
    
    const studentsNeedingFollowUpRes = await pg.query(`
      SELECT COUNT(DISTINCT s.id) as count 
      FROM students s
      JOIN follow_ups f ON s.id = f.student_id
      WHERE f.teacher_id = $1 AND f.status = 'pending' AND s.archived = 0
    `, [teacherId]);

    const pendingFollowUpsRes = await pg.query("SELECT COUNT(*) as count FROM follow_ups WHERE teacher_id = $1 AND status = 'pending'", [teacherId]);

    const todayStr = new Date().toISOString().split('T')[0];
    const notesTodayRes = await pg.query("SELECT COUNT(*) as count FROM notes WHERE teacher_id = $1 AND created_at LIKE $2 AND archived = 0", [teacherId, todayStr + '%']);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const notesThisWeekRes = await pg.query("SELECT COUNT(*) as count FROM notes WHERE teacher_id = $1 AND created_at >= $2 AND archived = 0", [teacherId, oneWeekAgo]);

    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const notesThisMonthRes = await pg.query("SELECT COUNT(*) as count FROM notes WHERE teacher_id = $1 AND created_at >= $2 AND archived = 0", [teacherId, oneMonthAgo]);

    // Recent Notes with direct SQL LIMIT 5
    const recentNotesRes = await pg.query(`
      SELECT n.*, s.name as student_name, s.student_number, c.name as class_name, c.id as class_id, g.name as grade_name, g.id as grade_id, u.name as teacher_name
      FROM notes n
      JOIN students s ON n.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN users u ON n.teacher_id = u.id
      WHERE n.teacher_id = $1 AND n.archived = 0
      ORDER BY n.created_at DESC
      LIMIT 5
    `, [teacherId]);

    // Urgent Follow-ups with direct SQL LIMIT 5
    const urgentFollowUpsRes = await pg.query(`
      SELECT f.*, s.name as student_name, s.student_number, c.name as class_name, g.name as grade_name,
        n.content as note_content, n.type as note_type, n.priority as note_priority, n.action_taken
      FROM follow_ups f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN grades g ON c.grade_id = g.id
      JOIN notes n ON f.note_id = n.id
      WHERE f.teacher_id = $1 AND f.status = 'pending'
      ORDER BY f.follow_up_date ASC
      LIMIT 5
    `, [teacherId]);

    // Notes by Type
    const noteTypes: NoteType[] = ['academic', 'behavioral', 'participation', 'skill', 'positive', 'needs_followup', 'other'];
    const typeLabels: Record<NoteType, string> = {
      academic: 'أكاديمية',
      behavioral: 'سلوكية',
      participation: 'مشاركة',
      skill: 'مهارة',
      positive: 'إيجابية',
      needs_followup: 'تحتاج متابعة',
      other: 'أخرى',
    };
    const typeCountsRows = await pg.query(`
      SELECT type, COUNT(*) as count
      FROM notes
      WHERE teacher_id = $1 AND archived = 0
      GROUP BY type
    `, [teacherId]);
    const typeCountMap = new Map((typeCountsRows.rows || []).map((r) => [r.type, Number(r.count)]));
    const notesByType = noteTypes.map((type) => ({
      type,
      label: typeLabels[type],
      count: typeCountMap.get(type) || 0,
    }));

    // Notes by Class
    const classCountsRows = await pg.query(`
      SELECT c.id as class_id, c.name as class_name, g.name as grade_name, COUNT(n.id) as count
      FROM classes c
      JOIN grades g ON c.grade_id = g.id
      LEFT JOIN students s ON s.class_id = c.id AND s.archived = 0
      LEFT JOIN notes n ON n.student_id = s.id AND n.archived = 0 AND n.teacher_id = $1
      WHERE c.teacher_id = $2 AND c.archived = 0 AND g.archived = 0
      GROUP BY c.id, c.name, g.name, c.created_at
      ORDER BY c.created_at ASC
    `, [teacherId, teacherId]);
    const notesByClass = (classCountsRows.rows || []).map((r) => ({
      className: (r.grade_name || '') + ' - ' + r.class_name,
      count: Number(r.count),
    }));

    // Students by Status
    const statuses: StudentStatus[] = ['excellent', 'normal', 'needs_followup'];
    const statusLabels: Record<StudentStatus, string> = {
      excellent: 'ممتاز',
      normal: 'طبيعي',
      needs_followup: 'يحتاج متابعة',
    };
    const statusCountsRows = await pg.query(`
      SELECT status, COUNT(*) as count
      FROM students
      WHERE teacher_id = $1 AND archived = 0
      GROUP BY status
    `, [teacherId]);
    const statusCountMap = new Map((statusCountsRows.rows || []).map((r) => [r.status, Number(r.count)]));
    const studentsByStatus = statuses.map((status) => ({
      status,
      label: statusLabels[status],
      count: statusCountMap.get(status) || 0,
    }));

    return {
      totalGrades: totalGradesRes.rows[0] ? Number(totalGradesRes.rows[0].count) : 0,
      totalClasses: totalClassesRes.rows[0] ? Number(totalClassesRes.rows[0].count) : 0,
      totalStudents: totalStudentsRes.rows[0] ? Number(totalStudentsRes.rows[0].count) : 0,
      totalNotes: totalNotesRes.rows[0] ? Number(totalNotesRes.rows[0].count) : 0,
      totalClassNotes: totalClassNotesRes.rows[0] ? Number(totalClassNotesRes.rows[0].count) : 0,
      studentsNeedingFollowUp: studentsNeedingFollowUpRes.rows[0] ? Number(studentsNeedingFollowUpRes.rows[0].count) : 0,
      pendingFollowUps: pendingFollowUpsRes.rows[0] ? Number(pendingFollowUpsRes.rows[0].count) : 0,
      notesToday: notesTodayRes.rows[0] ? Number(notesTodayRes.rows[0].count) : 0,
      notesThisWeek: notesThisWeekRes.rows[0] ? Number(notesThisWeekRes.rows[0].count) : 0,
      notesThisMonth: notesThisMonthRes.rows[0] ? Number(notesThisMonthRes.rows[0].count) : 0,
      recentNotes: recentNotesRes.rows as unknown as Note[],
      urgentFollowUps: urgentFollowUpsRes.rows as unknown as FollowUp[],
      notesByType,
      notesByClass,
      studentsByStatus,
    };
  },
};

// ---------------- ARCHIVE REPOSITORY ----------------
export const ArchiveRepository = {
  getAll: async (teacherId: string) => {
    const grades = (await GradeRepository.getAll({ includeArchived: true, teacherId })).filter((g) => g.archived === 1);
    const classes = (await ClassRepository.getAll({ includeArchived: true, teacherId })).filter((c) => c.archived === 1);
    const students = (await StudentRepository.getAll({ includeArchived: true, teacherId })).filter((s) => s.archived === 1);
    const notes = (await NoteRepository.getAll({ includeArchived: true, teacherId })).filter((n) => n.archived === 1);

    return {
      grades,
      classes,
      students,
      notes,
    };
  },
};

// ---------------- SUPPORT TICKET REPOSITORY ----------------
export const SupportTicketRepository = {
  create: async (data: {
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    category: string;
    subject: string;
    description: string;
    attachmentUrl?: string | null;
  }): Promise<any> => {
    const pg = await getPgClient();
    const id = generateId('ticket');
    const ticketNumber = '#TK-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();

    await pg.query(`
      INSERT INTO support_tickets (
        id, ticket_number, teacher_id, teacher_name, teacher_email,
        category, subject, description, attachment_url, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, $11)
    `, [
      id,
      ticketNumber,
      data.teacherId,
      data.teacherName.trim(),
      data.teacherEmail.trim(),
      data.category,
      data.subject.trim(),
      data.description.trim(),
      data.attachmentUrl || null,
      now,
      now,
    ]);

    return SupportTicketRepository.getByIdForTeacher(id, data.teacherId);
  },

  getAllForTeacher: async (teacherId: string): Promise<any[]> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM support_tickets WHERE teacher_id = $1 ORDER BY created_at DESC', [teacherId]);
    return res.rows;
  },

  getByIdForTeacher: async (ticketId: string, teacherId: string): Promise<any | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM support_tickets WHERE id = $1 AND teacher_id = $2', [ticketId, teacherId]);
    return res.rows[0] || null;
  },

  getAllForOwner: async (options?: { status?: string; category?: string; search?: string }): Promise<any[]> => {
    const pg = await getPgClient();
    let query = 'SELECT * FROM support_tickets WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (options?.status && options.status !== 'all') {
      query += ' AND status = $' + idx++;
      params.push(options.status);
    }

    if (options?.category && options.category !== 'all') {
      query += ' AND category = $' + idx++;
      params.push(options.category);
    }

    if (options?.search) {
      const q = '%' + options.search.trim() + '%';
      query += ' AND (ticket_number ILIKE $' + idx + ' OR teacher_name ILIKE $' + idx + ' OR teacher_email ILIKE $' + idx + ' OR subject ILIKE $' + idx + ')';
      params.push(q);
      idx++;
    }

    query += ' ORDER BY created_at DESC';
    const res = await pg.query(query, params);
    return res.rows;
  },

  getByIdForOwner: async (ticketId: string): Promise<any | null> => {
    const pg = await getPgClient();
    const res = await pg.query('SELECT * FROM support_tickets WHERE id = $1', [ticketId]);
    return res.rows[0] || null;
  },

  updateByOwner: async (
    ticketId: string,
    data: { status?: string; adminReply?: string }
  ): Promise<any | null> => {
    const pg = await getPgClient();
    const existing = await SupportTicketRepository.getByIdForOwner(ticketId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const status = data.status || existing.status;
    const adminReply = data.adminReply !== undefined ? data.adminReply : existing.admin_reply;

    let adminRepliedAt = existing.admin_replied_at;
    if (data.adminReply && data.adminReply !== existing.admin_reply) {
      adminRepliedAt = now;
    }

    let resolvedAt = existing.resolved_at;
    if (status === 'resolved' && existing.status !== 'resolved') {
      resolvedAt = now;
    }

    let closedAt = existing.closed_at;
    if (status === 'closed' && existing.status !== 'closed') {
      closedAt = now;
    }

    await pg.query(`
      UPDATE support_tickets
      SET status = $1, admin_reply = $2, admin_replied_at = $3, resolved_at = $4, closed_at = $5, updated_at = $6
      WHERE id = $7
    `, [status, adminReply, adminRepliedAt, resolvedAt, closedAt, now, ticketId]);

    return SupportTicketRepository.getByIdForOwner(ticketId);
  },
};

// ---------------- BACKUP REPOSITORY ----------------
export const BackupRepository = {
  exportAll: async (teacherId?: string) => {
    const pg = await getPgClient();
    if (teacherId) {
      return {
        grades: await GradeRepository.getAll({ includeArchived: true, teacherId }),
        classes: await ClassRepository.getAll({ includeArchived: true, teacherId }),
        students: await StudentRepository.getAll({ includeArchived: true, teacherId }),
        notes: await NoteRepository.getAll({ includeArchived: true, teacherId }),
        classNotes: await ClassNoteRepository.getAll({ includeArchived: true, teacherId }),
        followUps: await FollowUpRepository.getAll({ teacherId }),
        exportedAt: new Date().toISOString(),
      };
    }
    return {
      grades: (await pg.query('SELECT * FROM grades')).rows,
      classes: (await pg.query('SELECT * FROM classes')).rows,
      students: (await pg.query('SELECT * FROM students')).rows,
      notes: (await pg.query('SELECT * FROM notes')).rows,
      classNotes: (await pg.query('SELECT * FROM class_notes')).rows,
      followUps: (await pg.query('SELECT * FROM follow_ups')).rows,
      exportedAt: new Date().toISOString(),
    };
  },

  importAll: async (data: any, teacherId?: string) => {
    const pg = await getPgClient();
    const now = new Date().toISOString();
    
    if (data.grades && Array.isArray(data.grades)) {
      for (const g of data.grades) {
        const tId = teacherId || g.teacher_id;
        await pg.query(`
          INSERT INTO grades (id, teacher_id, name, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, archived = EXCLUDED.archived, updated_at = EXCLUDED.updated_at
        `, [g.id, tId, g.name, g.archived || 0, g.created_at || now, now]);
      }
    }

    if (data.classes && Array.isArray(data.classes)) {
      for (const c of data.classes) {
        const tId = teacherId || c.teacher_id;
        await pg.query(`
          INSERT INTO classes (id, teacher_id, grade_id, name, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, grade_id = EXCLUDED.grade_id, archived = EXCLUDED.archived, updated_at = EXCLUDED.updated_at
        `, [c.id, tId, c.grade_id, c.name, c.archived || 0, c.created_at || now, now]);
      }
    }

    if (data.students && Array.isArray(data.students)) {
      for (const s of data.students) {
        const tId = teacherId || s.teacher_id;
        await pg.query(`
          INSERT INTO students (id, teacher_id, class_id, student_number, name, photo, status, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT(id) DO UPDATE SET name = EXCLUDED.name, student_number = EXCLUDED.student_number, class_id = EXCLUDED.class_id, photo = EXCLUDED.photo, status = EXCLUDED.status, archived = EXCLUDED.archived, updated_at = EXCLUDED.updated_at
        `, [s.id, tId, s.class_id, s.student_number, s.name, s.photo || null, s.status || 'normal', s.archived || 0, s.created_at || now, now]);
      }
    }

    if (data.notes && Array.isArray(data.notes)) {
      for (const n of data.notes) {
        const tId = teacherId || n.teacher_id;
        await pg.query(`
          INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT(id) DO UPDATE SET type = EXCLUDED.type, priority = EXCLUDED.priority, content = EXCLUDED.content, action_taken = EXCLUDED.action_taken, requires_follow_up = EXCLUDED.requires_follow_up, archived = EXCLUDED.archived, updated_at = EXCLUDED.updated_at
        `, [n.id, tId, n.student_id, n.type || 'academic', n.priority || 'medium', n.content, n.action_taken || null, n.requires_follow_up || 0, n.archived || 0, n.created_at || now, now]);
      }
    }

    if (data.classNotes && Array.isArray(data.classNotes)) {
      for (const cn of data.classNotes) {
        const tId = teacherId || cn.teacher_id;
        await pg.query(`
          INSERT INTO class_notes (id, teacher_id, class_id, title, content, type, note_date, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT(id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, type = EXCLUDED.type, note_date = EXCLUDED.note_date, archived = EXCLUDED.archived, updated_at = EXCLUDED.updated_at
        `, [cn.id, tId, cn.class_id, cn.title || null, cn.content, cn.type || 'general', cn.note_date || now.split('T')[0], cn.archived || 0, cn.created_at || now, now]);
      }
    }

    if (data.followUps && Array.isArray(data.followUps)) {
      for (const f of data.followUps) {
        const tId = teacherId || f.teacher_id;
        await pg.query(`
          INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, result, additional_notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT(id) DO UPDATE SET follow_up_date = EXCLUDED.follow_up_date, status = EXCLUDED.status, result = EXCLUDED.result, additional_notes = EXCLUDED.additional_notes, updated_at = EXCLUDED.updated_at
        `, [f.id, tId, f.note_id, f.student_id, f.follow_up_date, f.status || 'pending', f.result || null, f.additional_notes || null, f.created_at || now, now]);
      }
    }
  },
};
