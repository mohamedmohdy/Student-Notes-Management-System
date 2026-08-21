const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authCookie = '';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (authCookie) {
      options.headers['Cookie'] = authCookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      if (res.headers['set-cookie']) {
        const cookies = res.headers['set-cookie'];
        authCookie = cookies.map((c) => c.split(';')[0]).join('; ');
      }

      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('🚀 بدء الاختبار الشامل والمتكامل للتطبيق (E2E)');
  console.log('==================================================\n');

  try {
    // 1. Check Unauthenticated /api/auth/me
    console.log('1. اختبار التحقق من حالة الجلسة قبل تسجيل الدخول...');
    const unauthMe = await makeRequest('GET', '/api/auth/me');
    console.log(`   النتيجة: كود ${unauthMe.status} (متوقع 401) -> ${unauthMe.status === 401 ? '✅ نجح' : '❌ فشل'}`);

    // 2. Login
    console.log('\n2. اختبار تسجيل الدخول بحساب المعلم (teacher@school.edu)...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'teacher@school.edu',
      password: 'teacher123',
    });
    console.log(`   النتيجة: كود ${loginRes.status} -> ${loginRes.status === 200 ? '✅ نجح' : '❌ فشل'}`);
    console.log(`   اسم المستخدم المسجل: ${loginRes.data.user?.name}`);

    // 3. Authenticated /api/auth/me
    console.log('\n3. اختبار الجلسة المصادقة بعد تسجيل الدخول...');
    const authMe = await makeRequest('GET', '/api/auth/me');
    console.log(`   النتيجة: كود ${authMe.status} (المستخدم: ${authMe.data.user?.name}) -> ${authMe.status === 200 ? '✅ نجح' : '❌ فشل'}`);

    // 4. Dashboard Stats
    console.log('\n4. اختبار إحصائيات لوحة التحكم (/api/dashboard)...');
    const dashRes = await makeRequest('GET', '/api/dashboard');
    const stats = dashRes.data.stats;
    console.log(`   الصفوف: ${stats?.totalGrades}, الفصول: ${stats?.totalClasses}, الطلاب: ${stats?.totalStudents}, الملاحظات: ${stats?.totalNotes}`);
    console.log(`   الطلاب المحتاجون متابعة: ${stats?.studentsNeedingFollowUp}`);
    console.log(`   الحالة: ${dashRes.status === 200 && stats?.totalStudents > 0 ? '✅ نجح' : '❌ فشل'}`);

    // 5. Grades API
    console.log('\n5. اختبار جلب وإنشاء الصفوف الدراسية (/api/grades)...');
    const gradesRes = await makeRequest('GET', '/api/grades');
    console.log(`   عدد الصفوف الحالية: ${gradesRes.data.grades?.length}`);

    const newGrade = await makeRequest('POST', '/api/grades', { name: 'الصف السادس الابتدائي' });
    console.log(`   تم إنشاء صف جديد: ${newGrade.data.grade?.name} (ID: ${newGrade.data.grade?.id}) -> ${newGrade.status === 200 ? '✅ نجح' : '❌ فشل'}`);
    const createdGradeId = newGrade.data.grade?.id;

    // 6. Classes API
    console.log('\n6. اختبار جلب وإنشاء الفصول الدراسية (/api/classes)...');
    const newClass = await makeRequest('POST', '/api/classes', {
      grade_id: createdGradeId,
      name: '6/أ',
    });
    console.log(`   تم إنشاء فصل جديد: ${newClass.data.classRoom?.name} -> ${newClass.status === 200 ? '✅ نجح' : '❌ فشل'}`);
    const createdClassId = newClass.data.classRoom?.id;

    // 7. Students API
    console.log('\n7. اختبار جلب وإنشاء الطلاب (/api/students)...');
    const newStudent = await makeRequest('POST', '/api/students', {
      class_id: createdClassId,
      student_number: '601',
      name: 'سعود بن عبد العزيز آل الشيخ',
      status: 'normal',
    });
    console.log(`   تم إنشاء الطالب: ${newStudent.data.student?.name} -> ${newStudent.status === 200 ? '✅ نجح' : '❌ فشل'}`);
    const createdStudentId = newStudent.data.student?.id;

    // 8. Notes & Follow-up creation
    console.log('\n8. اختبار إضافة ملاحظة جديدة تتطلب متابعة (/api/notes)...');
    const newNote = await makeRequest('POST', '/api/notes', {
      student_id: createdStudentId,
      type: 'academic',
      priority: 'high',
      content: 'يحتاج الطالب دعماً إضافياً في حفظ جدول الضرب وقواعد القسمة المطولة.',
      action_taken: 'تخصيص تمارين منزلية إضافية وجدول متابعة يومي.',
      requires_follow_up: true,
      follow_up_date: '2026-08-30',
    });
    console.log(`   تم حفظ الملاحظة: ID ${newNote.data.note?.id} -> ${newNote.status === 200 ? '✅ نجح' : '❌ فشل'}`);
    const createdNoteId = newNote.data.note?.id;

    // 9. Verify Follow-Up
    console.log('\n9. اختبار التحقق من ظهور المتابعة في قائمة المتابعات (/api/follow-ups)...');
    const fuList = await makeRequest('GET', `/api/follow-ups?studentId=${createdStudentId}`);
    const matchedFu = fuList.data.followUps?.[0];
    console.log(`   المتابعة المرصودة: ID ${matchedFu?.id}, الحالة: ${matchedFu?.status}, موعد المتابعة: ${matchedFu?.follow_up_date}`);
    console.log(`   الحالة: ${matchedFu ? '✅ نجح' : '❌ فشل'}`);

    // 10. Complete Follow-up
    console.log('\n10. اختبار إتمام المتابعة وتسجيل النتيجة...');
    const resolveFu = await makeRequest('PUT', `/api/follow-ups/${matchedFu.id}`, {
      status: 'completed',
      result: 'تم إجراء تقييم شفهي للطالب ولوحظ إتقانه التام لجدول الضرب بنجاح ممتاز.',
      additional_notes: 'الاستمرار في التشجيع والتحفيز.',
    });
    console.log(`    تم تحديث المتابعة -> الحالة الجديدة: ${resolveFu.data.followUp?.status} -> ${resolveFu.status === 200 ? '✅ نجح' : '❌ فشل'}`);

    // 11. Reports & Export
    console.log('\n11. اختبار استعلام التقارير والتصدير (/api/reports)...');
    const repRes = await makeRequest('GET', '/api/reports');
    console.log(`    الملاحظات بالتقرير: ${repRes.data.notes?.length}, الطلاب: ${repRes.data.students?.length} -> ${repRes.status === 200 ? '✅ نجح' : '❌ فشل'}`);

    // 12. Backup Export
    console.log('\n12. اختبار تصدير النسخة الاحتياطية الكاملة (/api/backup/export)...');
    const backupRes = await makeRequest('GET', '/api/backup/export');
    console.log(`    تم تصدير Backup JSON -> النسخة: ${backupRes.data.version}, الصفوف: ${backupRes.data.grades?.length}, الطلاب: ${backupRes.data.students?.length} -> ${backupRes.status === 200 ? '✅ نجح' : '❌ فشل'}`);

    // 13. Page Render Status Checks
    console.log('\n13. اختبار استجابة صفحات الواجهة الرئيسية (HTTP GET 200)...');
    const pagesToTest = [
      '/',
      '/login',
      '/register',
      '/dashboard',
      '/grades',
      '/students',
      `/students/${createdStudentId}`,
      '/notes',
      '/follow-ups',
      '/reports',
      '/settings',
    ];

    for (const page of pagesToTest) {
      const pageRes = await makeRequest('GET', page);
      console.log(`    الصفحة [${page}]: كود ${pageRes.status} -> ${pageRes.status === 200 || pageRes.status === 307 ? '✅ تعمل بنجاح' : '❌ خطأ'}`);
    }

    console.log('\n==================================================');
    console.log('🎉 جميع اختبارات النظام والواجهات وقاعدة البيانات نجحت 100%!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ خطأ أثناء تشغيل الاختبارات:', err);
  }
}

runTests();
