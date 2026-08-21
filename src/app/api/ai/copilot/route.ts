import { NextRequest, NextResponse } from 'next/server';
import {
  StudentRepository,
  NoteRepository,
  FollowUpRepository,
  GradeRepository,
  ClassRepository,
  DashboardRepository,
  UserRepository,
  BackupRepository,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NoteType, NotePriority, StudentStatus } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'يرجى كتابة رسالتك' }, { status: 400 });
    }

    const lower = message.toLowerCase();
    let actionExecuted = false;
    let actionType: string | null = null;
    let responseText = '';
    let actionPayload: any = null;
    let thoughtProcess = '';

    // --- Intent 1: Pedagogical & Educational Problem Solving ---
    // (e.g. "عندي طالب درجاته متراجعة أعمل إيه؟", "طالب كثير الحركة في الحصة إزاي أتعامل معاه؟")
    if (
      lower.includes('اعمل ايه') ||
      lower.includes('أعمل إيه') ||
      lower.includes('ازاي اتعامل') ||
      lower.includes('كيف اتعامل') ||
      lower.includes('نصيحة') ||
      lower.includes('توجيه') ||
      lower.includes('متراجع') ||
      lower.includes('كثير الحركة') ||
      lower.includes('مشاغب') ||
      lower.includes('ضعيف في')
    ) {
      thoughtProcess = 'تحليل الحالة السلوكية والتربوية وتقديم استراتيجيات تدريس حديثة...';

      let advice = '';
      if (lower.includes('كثير الحركة') || lower.includes('مشاغب') || lower.includes('تشتت')) {
        advice = `أهلاً بك يا أستاذنا! 💡 بعد تحليل الموقف التربوي، إليك أفضل خطة للتعامل مع فرط الحركة وتشتت الانتباه داخل الحصة:

1. **إشراك الطالب بمهام قيادية:** كلفه بتوزيع الأوراق أو مسح السبورة لتفريغ طاقته الحركية إيجابياً.
2. **الجلوس في الصف الأول:** قريباً من المعلم وبعيداً عن النوافذ والمشتتات.
3. **تجزئة المهام التعليمية:** إعطاؤه تدريبات قصيرة ومحددة مع تعزيز فوري عند الإنجاز.
4. **التواصل البصري الهادئ:** دون إحراج الطالب أمام زملائه.

✨ **اقتراح المساعد الذكي:** هل ترغب في أن أسجل للطالب الآن ملاحظة سلوكية مع جدولة متابعة بعد أسبوع لمراقبة تطوره؟ فقط قل لي: "نعم، سجل ملاحظة للطالب [الاسم]".`;
      } else {
        advice = `أهلاً بك يا أستاذنا! 💡 بخصوص معالجة التراجع الأكاديمي وصعوبات التعلم:

1. **التشخيص الفردي:** تحديد المهارة الأساسية المفقودة (مثال: جدول الضرب، القراءة الجهرية، أو الإملاء).
2. **التعلم بالأقران:** إشراك الطالب مع زميل متميز لمساعدته بأسلوب تفاعلي محبب.
3. **التعزيز الإيجابي للتقدم البسيط:** تحفيزه ورفع ثقته بنفسه أمام الصف.
4. **التواصل التكاملي مع ولي الأمر:** إرسال تقرير الملاحظات الدوري من المنصة.

✨ هل تريد مني البحث في سجل الطالب أو إضافة خطة دعم فردية له الآن؟`;
      }

      return NextResponse.json({
        message: advice,
        thoughtProcess,
        actionExecuted: false,
        actionType: 'pedagogical_advice',
      });
    }

    // --- Intent 2: Action - Add Note with Deep Entity Recognition ---
    if (
      (lower.includes('اضف ملاحظة') || lower.includes('أضف ملاحظة') || lower.includes('سجل ملاحظة') || lower.includes('ملاحظة للطالب') || lower.includes('اكتب ملاحظة')) &&
      (lower.includes('للطالب') || lower.includes('على الطالب') || lower.includes('لـ'))
    ) {
      thoughtProcess = 'استخراج اسم الطالب، نوع الملاحظة، درجة الأولوية، وحفظها فورياً في قاعدة البيانات...';

      const students = StudentRepository.getAll({ includeArchived: false });
      let matchedStudent = students.find((s) => lower.includes(s.name.toLowerCase()));

      if (!matchedStudent) {
        matchedStudent = students.find((s) => {
          const parts = s.name.split(' ');
          return parts.length >= 2 && lower.includes(parts[0].toLowerCase()) && lower.includes(parts[1].toLowerCase());
        });
      }

      if (matchedStudent) {
        let noteType: NoteType = 'academic';
        if (lower.includes('سلوك') || lower.includes('مشاغب') || lower.includes('هدوء') || lower.includes('أدب')) noteType = 'behavioral';
        else if (lower.includes('مشارك') || lower.includes('تفاعل')) noteType = 'participation';
        else if (lower.includes('مهار') || lower.includes('رسم') || lower.includes('قراءة')) noteType = 'skill';
        else if (lower.includes('ممتاز') || lower.includes('رائع') || lower.includes('شكر') || lower.includes('إيجاب') || lower.includes('تفوق')) noteType = 'positive';
        else if (lower.includes('متابع') || lower.includes('ضعيف') || lower.includes('تراجع') || lower.includes('يحتاج')) noteType = 'needs_followup';

        let priority: NotePriority = 'medium';
        if (lower.includes('عالية') || lower.includes('مهم') || lower.includes('ضروري') || lower.includes('عاجل')) priority = 'high';
        else if (lower.includes('منخفض')) priority = 'low';

        let content = message;
        if (message.includes(':')) {
          content = message.split(':')[1].trim();
        } else {
          content = message;
        }

        const requiresFollowUp = noteType === 'needs_followup' || priority === 'high' || lower.includes('متابعة');
        const followUpDate = requiresFollowUp ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null;

        const newNote = NoteRepository.create({
          student_id: matchedStudent.id,
          teacher_id: session.userId,
          type: noteType,
          priority,
          content: content || 'تم تسجيل الملاحظة بنجاح بناءً على طلب المعلم',
          action_taken: 'تم الرصد والمتابعة الفورية',
          requires_follow_up: requiresFollowUp,
          follow_up_date: followUpDate,
        });

        actionExecuted = true;
        actionType = 'note_created';
        actionPayload = newNote;
        responseText = `أبشر يا أستاذي! 🫡 قمت بتحليل طلبك وتسجيل الملاحظة فوراً في الملف الإلكتروني للطالب (${matchedStudent.name}) في (${matchedStudent.class_name}):\n\n📝 "${newNote.content}"\n🏷️ التصنيف: ${noteType} • الأولوية: ${priority}${requiresFollowUp ? ' • ⏰ تم جدولة موعد متابعة تلقائي بعد أسبوع' : ''}`;
      } else {
        responseText = 'سمعتك يا أستاذي! تريد إضافة ملاحظة، لكن لم أتمكن من التعرف على اسم الطالب بدقة في قاعدة البيانات. يرجى كتابة اسم الطالب المسجل (مثال: أضف ملاحظة للطالب أحمد بن طارق: ممتاز ومشارك).';
      }
    }

    // --- Intent 3: Inquire about students needing follow-up ---
    else if (
      lower.includes('محتاج متابعة') ||
      lower.includes('محتاجين متابعة') ||
      lower.includes('طلاب المتابعة') ||
      lower.includes('المتابعات المعلقة') ||
      lower.includes('مين اتابع')
    ) {
      thoughtProcess = 'فحص جدول المتابعات والبحث عن الحالات التي لم يتم إتمامها بعد...';
      const followUps = FollowUpRepository.getAll({ status: 'pending' });
      if (followUps.length === 0) {
        responseText = 'ما شاء الله يا أستاذنا! 🎉 راجعت كافة سجلات الفصول، ولا يوجد أي طالب يحتاج متابعة معلقة حالياً، جميع الطلاب في حالة ممتازة ومستقرة.';
      } else {
        const listText = followUps.slice(0, 6).map((f, i) => `${i + 1}. ${f.student_name} (${f.class_name}) - السبب: "${f.note_content}"`).join('\n');
        actionExecuted = true;
        actionType = 'followups_listed';
        responseText = `إليك الحالات العاجلة التي تتطلب متابعتك اليوم (${followUps.length} طلاب):\n\n${listText}\n\n💡 يمكنك أن تطلب مني مباشرة: "تمت متابعة الطالب [الاسم]" وسأقوم بإغلاق المتابعة فوراً.`;
      }
    }

    // --- Intent 4: Change student status ---
    else if (
      (lower.includes('غير حالة') || lower.includes('عدل حالة') || lower.includes('خلي حالة') || lower.includes('اجعل حالة')) &&
      (lower.includes('طالب') || lower.includes('الطالب'))
    ) {
      thoughtProcess = 'البحث عن الطالب وتعديل حالته في قاعدة البيانات...';
      const students = StudentRepository.getAll({ includeArchived: false });
      let matchedStudent = students.find((s) => lower.includes(s.name.toLowerCase()));
      if (!matchedStudent) {
        matchedStudent = students.find((s) => {
          const parts = s.name.split(' ');
          return parts.length >= 2 && lower.includes(parts[0].toLowerCase()) && lower.includes(parts[1].toLowerCase());
        });
      }

      if (matchedStudent) {
        let newStatus: StudentStatus = 'normal';
        if (lower.includes('ممتاز') || lower.includes('متفوق')) newStatus = 'excellent';
        else if (lower.includes('متابع') || lower.includes('ضعيف') || lower.includes('تراجع')) newStatus = 'needs_followup';
        else newStatus = 'normal';

        StudentRepository.update(matchedStudent.id, { status: newStatus });
        actionExecuted = true;
        actionType = 'status_updated';
        responseText = `تم يا فندم! 🌟 قمت بتحديث حالة الطالب (${matchedStudent.name}) إلى (${newStatus === 'excellent' ? 'ممتاز 🏅' : newStatus === 'needs_followup' ? 'يحتاج متابعة ⚠️' : 'طبيعي ✅'}).`;
      } else {
        responseText = 'يرجى تحديد اسم الطالب بدقة لتغيير حالته (مثال: غير حالة الطالب أحمد بن طارق لممتاز).';
      }
    }

    // --- Intent 5: Add new student ---
    else if (
      (lower.includes('اضف طالب') || lower.includes('أضف طالب') || lower.includes('طالب جديد')) &&
      (lower.includes('فصل') || lower.includes('صف'))
    ) {
      thoughtProcess = 'التعرف على الفصل الدراسي وإضافة الطالب الجديد...';
      const classes = ClassRepository.getAll();
      let matchedClass = classes.find((c) => lower.includes(c.name.toLowerCase()));

      if (matchedClass) {
        let nameMatch = message.replace(/.*(اسمه|الطالب|طالب)\s+/i, '').replace(/\s+(في فصل|برقم|فصل).*/i, '').trim();
        if (nameMatch.length > 2) {
          const num = Math.floor(100 + Math.random() * 900).toString();
          const newStudent = StudentRepository.create({
            class_id: matchedClass.id,
            student_number: num,
            name: nameMatch,
            status: 'normal',
          });

          actionExecuted = true;
          actionType = 'student_created';
          actionPayload = newStudent;
          responseText = `تمت الإضافة بنجاح! 👨‍🎓 أضفت الطالب (${newStudent.name}) برقم أكاديمي (${num}) في فصل (${matchedClass.grade_name} - فصل ${matchedClass.name}).`;
        } else {
          responseText = 'يرجى كتابة اسم الطالب والفصل بوضوح (مثال: أضف طالب اسمه فيصل القحطاني في فصل 4/أ).';
        }
      } else {
        responseText = `لم أجد الفصل المحدد. الفصول المتاحة حالياً هي: ${classes.map((c) => c.name).join(', ')}.`;
      }
    }

    // --- Intent 6: Resolve Follow-up ---
    else if (
      lower.includes('تمت متابعة') ||
      lower.includes('أنهيت متابعة') ||
      lower.includes('أنجزت متابعة') ||
      lower.includes('انهيت متابعة')
    ) {
      thoughtProcess = 'إغلاق المتابعة وتحديث سجل الطالب...';
      const followUps = FollowUpRepository.getAll({ status: 'pending' });
      let matchedFu = followUps.find((f) => lower.includes(f.student_name.toLowerCase()));

      if (matchedFu) {
        FollowUpRepository.resolve(matchedFu.id, {
          status: 'completed',
          result: 'تمت المتابعة بنجاح وتحسن أداء الطالب',
          additional_notes: 'تم الإنجاز عبر المساعد الذكي',
        });

        actionExecuted = true;
        actionType = 'followup_resolved';
        responseText = `ألف مبروك! 🎉 تم إغلاق المتابعة للطالب (${matchedFu.student_name}) وتحديث سجله بالكامل بنجاح.`;
      } else {
        responseText = 'لم أجد متابعة معلقة بهذا الاسم. يمكنك تفقد صفحة المتابعات المستمرة.';
      }
    }

    // --- Intent 7: Full System Stats Analysis ---
    else if (
      lower.includes('احصائيات') ||
      lower.includes('إحصائيات') ||
      lower.includes('تقرير سريع') ||
      lower.includes('كم طالب') ||
      lower.includes('كم عدد')
    ) {
      thoughtProcess = 'استخراج ومقارنة إحصائيات المنظومة الحية...';
      const stats = DashboardRepository.getStats();
      actionExecuted = true;
      actionType = 'stats_summary';
      responseText = `موجز سريع لمنظومتك يا أستاذنا: 📊\n\n• إجمالي الصفوف: ${stats.totalGrades}\n• إجمالي الفصول: ${stats.totalClasses}\n• إجمالي الطلاب: ${stats.totalStudents} طالباً\n• إجمالي الملاحظات: ${stats.totalNotes} ملاحظة\n• المتابعات العاجلة: ${stats.pendingFollowUps} متابعة\n• ملاحظات اليوم: ${stats.notesToday}`;
    }

    // --- Intent 8: Natural Conversational Colleague Fallback ---
    else {
      thoughtProcess = 'فهم رسالة المعلم وتقديم الدعم المباشر كزميل عمل...';
      responseText = `أهلاً بك يا أستاذنا الفاضل! 🤖 أنا زميلك ومساعدك الذكي (AI Copilot)، ويمكنني التفكير معك وتنفيذ أي أمر تطلبه فورياً باللغة العربية!\n\nجرب أن تطلب مني مثلاً:\n👉 "أضف ملاحظة للطالب أحمد بن طارق: شارك بتفوق في الرياضيات"\n👉 "مين الطلاب اللي محتاجين متابعة حالياً؟"\n👉 "طالب كثير الحركة في الحصة إزاي أتعامل معاه؟"\n👉 "غير حالة الطالب سعود لممتاز"\n👉 "أضف طالب جديد اسمه يوسف في فصل 4/أ"\n\nأنا تحت أمرك، ماذا تريد أن ننجز الآن؟`;
    }

    return NextResponse.json({
      message: responseText,
      thoughtProcess,
      actionExecuted,
      actionType,
      actionPayload,
    });
  } catch (error: any) {
    console.error('Copilot API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب' }, { status: 500 });
  }
}
