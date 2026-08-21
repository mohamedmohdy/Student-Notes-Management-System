const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'student_notes.db');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables if needed
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
`);

function seedDatabase() {
  console.log('--- بدء زراعة البيانات التجريبية ---');
  const now = new Date().toISOString();

  // Clear existing
  db.exec('DELETE FROM follow_ups;');
  db.exec('DELETE FROM notes;');
  db.exec('DELETE FROM students;');
  db.exec('DELETE FROM classes;');
  db.exec('DELETE FROM grades;');

  // 1. Create Default Teacher
  const existingTeacher = db.prepare('SELECT * FROM users WHERE email = ?').get('teacher@school.edu');
  let teacherId = 'user_teacher_1';
  if (!existingTeacher) {
    const passwordHash = bcrypt.hashSync('teacher123', 10);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'teacher', ?, ?)
    `).run(teacherId, 'أ. محمد بن عبد الله الشمري', 'teacher@school.edu', passwordHash, now, now);
    console.log('✅ تم إنشاء حساب المعلم: teacher@school.edu (كلمة المرور: teacher123)');
  } else {
    teacherId = existingTeacher.id;
  }

  // 2. Create Grades
  const grades = [
    { id: 'grade_4', name: 'الصف الرابع الابتدائي' },
    { id: 'grade_5', name: 'الصف الخامس الابتدائي' },
  ];

  const gradeStmt = db.prepare('INSERT INTO grades (id, name, archived, created_at, updated_at) VALUES (?, ?, 0, ?, ?)');
  grades.forEach(g => gradeStmt.run(g.id, g.name, now, now));
  console.log('✅ تم إنشاء الصفوف: الصف الرابع والخامس');

  // 3. Create Classes
  const classes = [
    { id: 'class_4a', grade_id: 'grade_4', name: '4/أ' },
    { id: 'class_4b', grade_id: 'grade_4', name: '4/ب' },
    { id: 'class_5a', grade_id: 'grade_5', name: '5/أ' },
    { id: 'class_5b', grade_id: 'grade_5', name: '5/ب' },
  ];

  const classStmt = db.prepare('INSERT INTO classes (id, grade_id, name, archived, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)');
  classes.forEach(c => classStmt.run(c.id, c.grade_id, c.name, now, now));
  console.log('✅ تم إنشاء الفصول: 4/أ، 4/ب، 5/أ، 5/ب');

  // 4. Create Students (10+ per class)
  const studentsList = [
    // Class 4/أ
    { classId: 'class_4a', num: '401', name: 'عبد الرحمن بن خالد العتيبي', status: 'excellent' },
    { classId: 'class_4a', num: '402', name: 'سعود بن فهد الدوسري', status: 'normal' },
    { classId: 'class_4a', num: '403', name: 'عمر بن إبراهيم السليمان', status: 'needs_followup' },
    { classId: 'class_4a', num: '404', name: 'فيصل بن عبدالعزيز القرني', status: 'normal' },
    { classId: 'class_4a', num: '405', name: 'ريان بن صالح الزهراني', status: 'excellent' },
    { classId: 'class_4a', num: '406', name: 'يوسف بن أحمد الغامدي', status: 'normal' },
    { classId: 'class_4a', num: '407', name: 'تركي بن ماجد العنزي', status: 'needs_followup' },
    { classId: 'class_4a', num: '408', name: 'سلطان بن فهد المطيري', status: 'normal' },
    { classId: 'class_4a', num: '409', name: 'خالد بن ناصر القحطاني', status: 'excellent' },
    { classId: 'class_4a', num: '410', name: 'بدر بن هشام التميمي', status: 'normal' },
    { classId: 'class_4a', num: '411', name: 'حمد بن طارق الشهري', status: 'normal' },

    // Class 4/ب
    { classId: 'class_4b', num: '421', name: 'عبد الله بن سعد العمري', status: 'normal' },
    { classId: 'class_4b', num: '422', name: 'سلمان بن حمد الحربي', status: 'excellent' },
    { classId: 'class_4b', num: '423', name: 'محمد بن يحيى المالكي', status: 'needs_followup' },
    { classId: 'class_4b', num: '424', name: 'نواف بن راشد الخالدي', status: 'normal' },
    { classId: 'class_4b', num: '425', name: 'علي بن حسن الشهري', status: 'normal' },
    { classId: 'class_4b', num: '426', name: 'مشاري بن منصور الرشيدي', status: 'excellent' },
    { classId: 'class_4b', num: '427', name: 'معاذ بن عبدالمحسن السبيعي', status: 'normal' },
    { classId: 'class_4b', num: '428', name: 'حاتم بن عيسى العسيري', status: 'needs_followup' },
    { classId: 'class_4b', num: '429', name: 'فهد بن سلطان الحازمي', status: 'normal' },
    { classId: 'class_4b', num: '430', name: 'إياد بن وليد الرويلي', status: 'normal' },

    // Class 5/أ
    { classId: 'class_5a', num: '501', name: 'حمزة بن عادل الصالح', status: 'excellent' },
    { classId: 'class_5a', num: '502', name: 'أنس بن عبدالرحمن الشريف', status: 'normal' },
    { classId: 'class_5a', num: '503', name: 'يزيد بن متعب الهذلي', status: 'needs_followup' },
    { classId: 'class_5a', num: '504', name: 'زياد بن نايف البقمي', status: 'normal' },
    { classId: 'class_5a', num: '505', name: 'طارق بن زياد الجاسر', status: 'excellent' },
    { classId: 'class_5a', num: '506', name: 'ماجد بن كمال النجار', status: 'normal' },
    { classId: 'class_5a', num: '507', name: 'باسم بن محمود البارقي', status: 'normal' },
    { classId: 'class_5a', num: '508', name: 'مساعد بن فهد الفهيد', status: 'needs_followup' },
    { classId: 'class_5a', num: '509', name: 'عصام بن سعيد باوزير', status: 'normal' },
    { classId: 'class_5a', num: '510', name: 'وليد بن عبدالله العواد', status: 'excellent' },

    // Class 5/ب
    { classId: 'class_5b', num: '521', name: 'مروان بن صالح الزامل', status: 'normal' },
    { classId: 'class_5b', num: '522', name: 'هشام بن ناصر المنصور', status: 'excellent' },
    { classId: 'class_5b', num: '523', name: 'فراس بن عصام الغامدي', status: 'normal' },
    { classId: 'class_5b', num: '524', name: 'باسل بن شريف الفيفي', status: 'needs_followup' },
    { classId: 'class_5b', num: '525', name: 'كريم بن مصطفى العيد', status: 'normal' },
    { classId: 'class_5b', num: '526', name: 'عمار بن سامي الجهني', status: 'excellent' },
    { classId: 'class_5b', num: '527', name: 'قصي بن فيصل الشمري', status: 'normal' },
    { classId: 'class_5b', num: '528', name: 'مؤيد بن عثمان الدخيل', status: 'normal' },
    { classId: 'class_5b', num: '529', name: 'غسان بن بدر العوفي', status: 'needs_followup' },
    { classId: 'class_5b', num: '530', name: 'أسامة بن عادل الراجحي', status: 'normal' },
  ];

  const studentStmt = db.prepare('INSERT INTO students (id, class_id, student_number, name, photo, status, archived, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, 0, ?, ?)');
  
  const createdStudents = [];
  studentsList.forEach((s, idx) => {
    const studentId = `stu_${s.num}`;
    studentStmt.run(studentId, s.classId, s.num, s.name, s.status, now, now);
    createdStudents.push({ id: studentId, ...s });
  });
  console.log(`✅ تم إنشاء ${createdStudents.length} طالباً في 4 فصول`);

  // 5. Create Notes & Follow-ups
  const noteStmt = db.prepare(`
    INSERT INTO notes (id, student_id, teacher_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const fuStmt = db.prepare(`
    INSERT INTO follow_ups (id, note_id, student_id, teacher_id, follow_up_date, status, result, additional_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleNotes = [
    {
      studentNum: '401',
      type: 'positive',
      priority: 'high',
      content: 'تميز لافت في حل مسائل الرياضيات والقدرة على شرح الخطوات لزملائه في الفصل بتعاون وأسلوب راقٍ.',
      action: 'منح الطالب وسام التميز وشهادة تقدير وإشادة أمام زملائه.',
      requiresFu: false,
    },
    {
      studentNum: '403',
      type: 'academic',
      priority: 'high',
      content: 'تراجع ملحوظ في درجات الإملاء وعدم إحضار دفتر الواجبات لثلاث حصص متتالية.',
      action: 'توجيه الطالب وإعطاؤه خطة تدريب إملائي قصيرة وإشعار المرشد الطلابي.',
      requiresFu: true,
      fuDate: '2026-08-25',
      fuStatus: 'pending',
    },
    {
      studentNum: '405',
      type: 'skill',
      priority: 'medium',
      content: 'إتقان رائع لمهارة الإلقاء والخطابة أثناء تقديم الإذاعة الصباحية باسم الصف الرابع.',
      action: 'ترشيحه للمسابقة المدرسية للمهارات اللغوية.',
      requiresFu: false,
    },
    {
      studentNum: '407',
      type: 'behavioral',
      priority: 'high',
      content: 'كثرة الحركة أثناء الحصة وتشتيت انتباه الطلاب المجاورين له بشكل متكرر.',
      action: 'تغيير مكان الجلوس في المقاعد الأمامية وعقد جلسة حوار فردية لمعرفة الأسباب.',
      requiresFu: true,
      fuDate: '2026-08-22',
      fuStatus: 'pending',
    },
    {
      studentNum: '423',
      type: 'needs_followup',
      priority: 'medium',
      content: 'يشتكي الطالب من صعوبة رؤية السبورة من المقاعد الخلفية ويفرك عينيه باستمرار.',
      action: 'تم نقله للصف الأول ومخاطبة ولي الأمر لإجراء فحص نظر طبي.',
      requiresFu: true,
      fuDate: '2026-08-20',
      fuStatus: 'still_needs_followup',
      fuResult: 'تم التواصل مع ولي الأمر وأفاد بأنه حجز موعداً الأسبوع القادم.',
    },
    {
      studentNum: '422',
      type: 'participation',
      priority: 'medium',
      content: 'تفاعل ممتاز ومشاركة فعالة في النشاط الجماعي لمادة العلوم وتجربة الدوائر الكهربائية.',
      action: 'تعزيز إيجابي وتكليفه بقيادة المجموعة في الدرس القادم.',
      requiresFu: false,
    },
    {
      studentNum: '501',
      type: 'positive',
      priority: 'high',
      content: 'حصل على الدرجة الكاملة في الاختبار الفتري الأول مع تنظيم فائق لورقة الإجابة.',
      action: 'تسجيل اسمه في لوحة الشرف المدرسية.',
      requiresFu: false,
    },
    {
      studentNum: '503',
      type: 'academic',
      priority: 'high',
      content: 'صعوبة في استيعاب درس الكسور المتكافئة والتردد في حل التمارين الفردية.',
      action: 'إعطاء حصة إرشاد فردية وتخصيص زميل مساند (Peer Tutoring).',
      requiresFu: true,
      fuDate: '2026-08-15',
      fuStatus: 'completed',
      fuResult: 'تحسن الطالب بشكل كبير بعد حصص المساندة واجتاز التقييم بنجاح.',
      fuNotes: 'يُظهر ثقة أعلى بنفسه الآن.',
    },
    {
      studentNum: '508',
      type: 'behavioral',
      priority: 'medium',
      content: 'التأخر عن دخول الحصة بعد الفسحة المدرسية مرتين هذا الأسبوع.',
      action: 'تنبيه الطالب شفهياً وتذكيره بأهمية الالتزام بالوقت.',
      requiresFu: true,
      fuDate: '2026-08-24',
      fuStatus: 'pending',
    },
    {
      studentNum: '524',
      type: 'academic',
      priority: 'high',
      content: 'ضعف القراءة الجهرية في مادة لغتي الجميلة والتهجي البطيء للنصوص.',
      action: 'تزويده بكتيب قراءة إثرائي يومي والتنسيق مع الأسرة لتخصيص 10 دقائق قراءة منزلية.',
      requiresFu: true,
      fuDate: '2026-08-26',
      fuStatus: 'pending',
    },
  ];

  sampleNotes.forEach((n, idx) => {
    const student = createdStudents.find(s => s.num === n.studentNum);
    if (!student) return;

    const noteId = `note_seed_${idx + 1}`;
    const createdAt = new Date(Date.now() - (idx * 2) * 24 * 60 * 60 * 1000).toISOString();

    noteStmt.run(
      noteId,
      student.id,
      teacherId,
      n.type,
      n.priority,
      n.content,
      n.action,
      n.requiresFu ? 1 : 0,
      createdAt,
      createdAt
    );

    if (n.requiresFu && n.fuDate) {
      const fuId = `fu_seed_${idx + 1}`;
      fuStmt.run(
        fuId,
        noteId,
        student.id,
        teacherId,
        n.fuDate,
        n.fuStatus || 'pending',
        n.fuResult || null,
        n.fuNotes || null,
        createdAt,
        createdAt
      );
    }
  });

  console.log('✅ تم تسجيل الملاحظات والمتابعات التجريبية بنجاح.');
  console.log('🎉 اكتملت زراعة البيانات التجريبية 100%!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
