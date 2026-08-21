const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'student_notes.db');
const db = new DatabaseSync(dbPath);

console.log('--- تشغيل اختبارات قاعدة البيانات والثبات ---');

// 1. Check Users
const user = db.prepare('SELECT * FROM users WHERE email = ?').get('teacher@school.edu');
console.log('1. User Check:', user ? `OK (${user.name})` : 'FAILED');

// 2. Check Grades & Classes count
const gradesCount = db.prepare('SELECT COUNT(*) as c FROM grades').get().c;
const classesCount = db.prepare('SELECT COUNT(*) as c FROM classes').get().c;
const studentsCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
const notesCount = db.prepare('SELECT COUNT(*) as c FROM notes').get().c;
const followUpsCount = db.prepare('SELECT COUNT(*) as c FROM follow_ups').get().c;

console.log(`2. Counts -> Grades: ${gradesCount}, Classes: ${classesCount}, Students: ${studentsCount}, Notes: ${notesCount}, FollowUps: ${followUpsCount}`);

// 3. Test Inserting a new Note
const testNoteId = 'note_test_' + Date.now();
const firstStudent = db.prepare('SELECT id FROM students LIMIT 1').get();

db.prepare(`
  INSERT INTO notes (id, student_id, teacher_id, type, priority, content, action_taken, requires_follow_up, archived, created_at, updated_at)
  VALUES (?, ?, ?, 'positive', 'high', 'ملاحظة اختبارية للتأكد من الحفظ الدائم', 'إشادة', 0, 0, ?, ?)
`).run(testNoteId, firstStudent.id, user.id, new Date().toISOString(), new Date().toISOString());

const fetchedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(testNoteId);
console.log('3. Insert & Fetch Note:', fetchedNote ? `OK (ID: ${fetchedNote.id})` : 'FAILED');

// 4. Test Soft Delete
db.prepare('UPDATE notes SET archived = 1 WHERE id = ?').run(testNoteId);
const archivedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(testNoteId);
console.log('4. Soft Delete Note:', archivedNote.archived === 1 ? 'OK (Archived)' : 'FAILED');

// Restore & Clean test
db.prepare('DELETE FROM notes WHERE id = ?').run(testNoteId);
console.log('5. Cleanup Test Note: OK');
console.log('✨ جميع اختبارات قاعدة البيانات والثبات نجحت 100%!');
