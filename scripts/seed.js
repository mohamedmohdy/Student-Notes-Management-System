const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5433/student_notes';

async function seedDatabase() {
  console.log('--- بدء زراعة البيانات التجريبية المعزولة على PostgreSQL (Multi-Tenant) ---');
  const now = new Date().toISOString();

  const databaseUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  const pool = new Pool({ connectionString: databaseUrl });

  const schemaSql = `
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
  await pool.query(schemaSql);

  // Clear tables with TRUNCATE CASCADE for instant sub-second resets
  await pool.query('TRUNCATE TABLE announcement_reads, announcements, class_notes, follow_ups, notes, students, classes, grades, support_tickets, system_settings CASCADE');
  await pool.query("DELETE FROM users WHERE role != 'OWNER' AND role != 'owner'");

  // Seed Announcement
  await pool.query(`
    INSERT INTO announcements (id, title, content, type, is_published, created_at, updated_at)
    VALUES ('ann_welcome_1', '🎉 أهلاً بكم في منصة سجل الطالب الإلكتروني!', 'نرحب بجميع المعلمين الأفاضل. تم تفعيل حسابك بنجاح للوصول غير المحدود مدى الحياة مع دعم كامل للذكاء الاصطناعي واستيراد ملفات الإكسيل.', 'event', 1, $1, $2)
  `, [now, now]);

  // Seed Default Dynamic Login Banner
  const defaultBanner = JSON.stringify({
    title: '🎉 عرض الإطلاق الحصري للمعلمين',
    content: 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
    priceText: '50 ريال سعودي',
    badgeText: 'عرض خاص',
    isActive: true,
  });
  await pool.query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('login_banner', $1, $2)
    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = $2
  `, [defaultBanner, now]);

  const ownerHash = bcrypt.hashSync('owner123', 10);
  const teacherHash = bcrypt.hashSync('teacher123', 10);

  // 1. Owner
  const existingOwner = await pool.query('SELECT * FROM users WHERE email = $1', ['owner@school.edu']);
  if (existingOwner.rows.length === 0) {
    await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
      VALUES ('user_owner_root', 'المهندس / مالك المنصة', 'owner@school.edu', $1, 'OWNER', 'active', $2, $3)
    `, [ownerHash, now, now]);
    console.log('✅ تم إنشاء حساب المالك: owner@school.edu');
  }

  // 2. Teacher 1
  const teacher1Id = 'user_teacher_1';
  await pool.query('DELETE FROM users WHERE id = $1 OR email = $2', [teacher1Id, 'teacher@school.edu']);
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES ($1, 'أ. محمد بن عبد الله الشمري', 'teacher@school.edu', $2, 'TEACHER', 'active', $3, $4)
  `, [teacher1Id, teacherHash, now, now]);
  console.log('✅ تم إعداد المعلم 1: teacher@school.edu (كلمة المرور: teacher123)');

  // 3. Teacher 2
  const teacher2Id = 'user_teacher_2';
  await pool.query('DELETE FROM users WHERE id = $1 OR email = $2', [teacher2Id, 'teacher2@school.edu']);
  await pool.query(`
    INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES ($1, 'أ. عبد العزيز بن سعود الحربي', 'teacher2@school.edu', $2, 'TEACHER', 'active', $3, $4)
  `, [teacher2Id, teacherHash, now, now]);
  console.log('✅ تم إعداد المعلم 2: teacher2@school.edu (كلمة المرور: teacher123)');

  // Teacher 1 Data
  await pool.query('INSERT INTO grades (id, teacher_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)', ['t1_grade_4', teacher1Id, 'الصف الرابع الابتدائي', now, now]);
  await pool.query('INSERT INTO grades (id, teacher_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)', ['t1_grade_5', teacher1Id, 'الصف الخامس الابتدائي', now, now]);

  await pool.query('INSERT INTO classes (id, teacher_id, grade_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, $5, $6)', ['t1_class_4a', teacher1Id, 't1_grade_4', '4/أ', now, now]);
  await pool.query('INSERT INTO classes (id, teacher_id, grade_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, $5, $6)', ['t1_class_4b', teacher1Id, 't1_grade_4', '4/ب', now, now]);

  const t1Students = [
    { id: 't1_s_401', classId: 't1_class_4a', num: '401', name: 'عبد الرحمن بن خالد العتيبي', status: 'excellent' },
    { id: 't1_s_402', classId: 't1_class_4a', num: '402', name: 'سعود بن فهد الدوسري', status: 'normal' },
    { id: 't1_s_403', classId: 't1_class_4a', num: '403', name: 'عمر بن إبراهيم السليمان', status: 'needs_followup' },
    { id: 't1_s_404', classId: 't1_class_4a', num: '404', name: 'فيصل بن عبدالعزيز القرني', status: 'normal' },
    { id: 't1_s_405', classId: 't1_class_4a', num: '405', name: 'ريان بن صالح الزهراني', status: 'excellent' },
    { id: 't1_s_406', classId: 't1_class_4a', num: '406', name: 'يوسف بن أحمد الغامدي', status: 'normal' },
    { id: 't1_s_407', classId: 't1_class_4a', num: '407', name: 'تركي بن ماجد العنزي', status: 'needs_followup' },
    { id: 't1_s_408', classId: 't1_class_4a', num: '408', name: 'سلطان بن فهد المطيري', status: 'normal' },
    { id: 't1_s_409', classId: 't1_class_4a', num: '409', name: 'خالد بن ناصر القحطاني', status: 'excellent' },
    { id: 't1_s_410', classId: 't1_class_4a', num: '410', name: 'بدر بن هشام التميمي', status: 'normal' },
    { id: 't1_s_421', classId: 't1_class_4b', num: '421', name: 'عبد الله بن سعد العمري', status: 'normal' },
    { id: 't1_s_422', classId: 't1_class_4b', num: '422', name: 'سلمان بن حمد الحربي', status: 'excellent' },
    { id: 't1_s_423', classId: 't1_class_4b', num: '423', name: 'محمد بن يحيى المالكي', status: 'needs_followup' },
    { id: 't1_s_424', classId: 't1_class_4b', num: '424', name: 'نواف بن راشد الخالدي', status: 'normal' },
    { id: 't1_s_425', classId: 't1_class_4b', num: '425', name: 'علي بن حسن الشهري', status: 'normal' },
    { id: 't1_s_426', classId: 't1_class_4b', num: '426', name: 'مشاري بن منصور الرشيدي', status: 'excellent' },
    { id: 't1_s_427', classId: 't1_class_4b', num: '427', name: 'معاذ بن عبدالمحسن السبيعي', status: 'normal' },
    { id: 't1_s_428', classId: 't1_class_4b', num: '428', name: 'حاتم بن عيسى العسيري', status: 'needs_followup' },
    { id: 't1_s_429', classId: 't1_class_4b', num: '429', name: 'فهد بن سلطان الحازمي', status: 'normal' },
    { id: 't1_s_430', classId: 't1_class_4b', num: '430', name: 'إياد بن وليد الرويلي', status: 'normal' },
  ];

  for (const s of t1Students) {
    await pool.query(`
      INSERT INTO students (id, teacher_id, class_id, student_number, name, status, archived, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
    `, [s.id, teacher1Id, s.classId, s.num, s.name, s.status, now, now]);
  }

  // Teacher 1 Notes
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)', ['t1_note_1', teacher1Id, 't1_s_401', 'positive', 'high', 'تميز لافت في مادة الرياضيات وإتقان المسائل.', 'تكريم الطالب', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9)', ['t1_note_2', teacher1Id, 't1_s_403', 'academic', 'high', 'تراجع في الإملاء ويحتاج لتدريب إضافي.', 'خطة إملائية', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9)', ['t1_note_3', teacher1Id, 't1_s_407', 'behavioral', 'medium', 'تشتت وانشغال جانبي أثناء الشرح.', 'تغيير المقعد', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)', ['t1_note_4', teacher1Id, 't1_s_422', 'participation', 'medium', 'تفاعل ممتاز ومشاركة فعالة في النشاط الجماعي.', 'تعزيز إيجابي', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9)', ['t1_note_5', teacher1Id, 't1_s_423', 'needs_followup', 'high', 'صعوبة في القراءة من المقاعد الخلفية.', 'مخاطبة ولي الأمر', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)', ['t1_note_6', teacher1Id, 't1_s_426', 'skill', 'high', 'إلقاء رائع في الإذاعة المدرسية.', 'ترشيح للمسابقة', now, now]);

  // Teacher 1 Follow-ups
  await pool.query('INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, result, additional_notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', ['t1_fu_1', teacher1Id, 't1_note_2', 't1_s_403', '2026-08-30', 'pending', null, null, now, now]);
  await pool.query('INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, result, additional_notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', ['t1_fu_2', teacher1Id, 't1_note_3', 't1_s_407', '2026-08-28', 'pending', null, null, now, now]);
  await pool.query('INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, result, additional_notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', ['t1_fu_3', teacher1Id, 't1_note_5', 't1_s_423', '2026-08-25', 'completed', 'تم إجراء فحص النظر وحجز موعد طبي.', null, now, now]);

  // Teacher 1 Class Notes
  await pool.query(`
    INSERT INTO class_notes (id, teacher_id, class_id, title, content, type, note_date, archived, created_at, updated_at)
    VALUES 
      ('cnote_1', $1, 't1_class_4a', 'متابعة تفاعل الحصة', 'الفصل متفاعل جدًا أثناء الشرح وهناك تحسن كبير في المشاركة والأنشطة الجماعية.', 'engagement', '2026-08-28', 0, $2, $3),
      ('cnote_2', $4, 't1_class_4a', 'تنبيه انضباط', 'يوجد بعض التشتت أثناء الأنشطة الجماعية ويحتاج إلى إعادة تنظيم وتوزيع المجموعات.', 'discipline', '2026-08-25', 0, $5, $6)
  `, [teacher1Id, now, now, teacher1Id, now, now]);

  console.log('✅ تم إدخال بيانات المعلم 1 (محمد): 2 صفوف، 2 فصول، 20 طالباً، 6 ملاحظات، 2 ملاحظات فصل، 3 متابعات.');

  // Teacher 2 Data
  await pool.query('INSERT INTO grades (id, teacher_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, 0, $4, $5)', ['t2_grade_6', teacher2Id, 'الصف السادس الابتدائي', now, now]);
  await pool.query('INSERT INTO classes (id, teacher_id, grade_id, name, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, $5, $6)', ['t2_class_6a', teacher2Id, 't2_grade_6', '6/أ', now, now]);

  const t2Students = [
    { id: 't2_s_601', classId: 't2_class_6a', num: '601', name: 'أحمد بن إبراهيم الحازمي', status: 'excellent' },
    { id: 't2_s_602', classId: 't2_class_6a', num: '602', name: 'باسم بن صالح العمري', status: 'normal' },
    { id: 't2_s_603', classId: 't2_class_6a', num: '603', name: 'عادل بن طارق الزهراني', status: 'needs_followup' },
    { id: 't2_s_604', classId: 't2_class_6a', num: '604', name: 'مازن بن ناصر الشهري', status: 'normal' },
    { id: 't2_s_605', classId: 't2_class_6a', num: '605', name: 'وليد بن خالد القحطاني', status: 'excellent' },
  ];

  for (const s of t2Students) {
    await pool.query(`
      INSERT INTO students (id, teacher_id, class_id, student_number, name, status, archived, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)
    `, [s.id, teacher2Id, s.classId, s.num, s.name, s.status, now, now]);
  }

  // Teacher 2 Notes
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)', ['t2_note_1', teacher2Id, 't2_s_601', 'positive', 'high', 'مستوى استثنائي في مسابقة العلوم الوطنية.', 'وسام التفوق', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, 0, $8, $9)', ['t2_note_2', teacher2Id, 't2_s_603', 'academic', 'high', 'يحتاج لمساندة في مادة لغتي الجميلة.', 'حصة دعم', now, now]);
  await pool.query('INSERT INTO notes (id, teacher_id, student_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9)', ['t2_note_3', teacher2Id, 't2_s_605', 'skill', 'medium', 'مهارة فائقة في التصميم والرسم.', 'معرض المدرسة', now, now]);

  // Teacher 2 Follow-ups
  await pool.query('INSERT INTO follow_ups (id, teacher_id, note_id, student_id, follow_up_date, status, result, additional_notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', ['t2_fu_1', teacher2Id, 't2_note_2', 't2_s_603', '2026-08-31', 'pending', null, null, now, now]);

  // Teacher 2 Class Notes
  await pool.query(`
    INSERT INTO class_notes (id, teacher_id, class_id, title, content, type, note_date, archived, created_at, updated_at)
    VALUES ('cnote_3', $1, 't2_class_6a', 'سلوك الحصة الأولى', 'الطلاب ملتزمون بالهدوء والتعليمات بشكل ممتاز وروح التعاون عالية.', 'behavior', '2026-08-27', 0, $2, $3)
  `, [teacher2Id, now, now]);

  console.log('✅ تم إدخال بيانات المعلم 2 (عبدالعزيز): 1 صف، 1 فصل، 5 طلاب، 3 ملاحظات، 1 ملاحظة فصل، 1 متابعة.');
  console.log('🎉 اكتملت زراعة بيانات PostgreSQL بنجاح 100%!');
  await pool.end();
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
