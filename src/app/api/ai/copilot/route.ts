import { NextRequest, NextResponse } from 'next/server';
import {
  StudentRepository,
  NoteRepository,
  FollowUpRepository,
  GradeRepository,
  ClassRepository,
  DashboardRepository,
} from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { NoteType, NotePriority, StudentStatus } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });

    const teacherId = authCheck.user.userId;
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
      thoughtProcess = 'تحليل الحالة السلوكية والتربوية وتقديم استراتيجيات تدريس مخصصة لفصول المعلم الحالية...';

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

    // --- Intent 2: Action - Add Note with Entity Recognition strictly within Teacher's students ---
    if (
      (lower.includes('اضف ملاحظة') || lower.includes('أضف ملاحظة') || lower.includes('سجل ملاحظة') || lower.includes('ملاحظة للطالب') || lower.includes('اكتب ملاحظة')) &&
      (lower.includes('للطالب') || lower.includes('على الطالب') || lower.includes('لـ'))
    ) {
      thoughtProcess = 'البحث عن الطالب داخل فصول المعلم الحالي حصرياً واستخراج محتوى الملاحظة...';

      const students = await StudentRepository.getAll({ teacherId, includeArchived: false });
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
        else if (lower.includes('متميز') || lower.includes('ممتاز') || lower.includes('أحسنت') || lower.includes('شكرا')) noteType = 'positive';
        else if (lower.includes('متابع') || lower.includes('اهتمام') || lower.includes('واجب')) noteType = 'needs_followup';

        let priority: NotePriority = 'medium';
        if (lower.includes('عاجل') || lower.includes('مهم') || lower.includes('خطير') || lower.includes('مرتفع')) priority = 'high';
        else if (lower.includes('بسيط') || lower.includes('عادي') || lower.includes('منخفض')) priority = 'low';

        let content = message
          .replace(/^(اضف ملاحظة|أضف ملاحظة|سجل ملاحظة|اكتب ملاحظة|ملاحظة)/gi, '')
          .replace(/(للطالب|على الطالب|لـ)/gi, '')
          .replace(matchedStudent.name, '')
          .trim();

        if (!content || content.length < 5) {
          content = `تم تسجيل الملاحظة بواسطة المساعد الذكي بناءً على طلب المعلم.`;
        }

        const newNote = await NoteRepository.create({
          student_id: matchedStudent.id,
          teacher_id: teacherId,
          type: noteType,
          priority: priority,
          content: content,
          action_taken: 'تم التسجيل الفوري عبر المساعد الذكي AI',
          requires_follow_up: noteType === 'behavioral' || noteType === 'needs_followup' || priority === 'high',
          follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });

        actionExecuted = true;
        actionType = 'add_note';
        actionPayload = newNote;
        responseText = `تم بنجاح تسجيل الملاحظة في سجل الطالب **${matchedStudent.name}** (فصل ${matchedStudent.class_name || ''}) بنوع (${noteType}) وأولوية (${priority}).`;
      } else {
        responseText = 'عذراً يا أستاذنا، لم أجد طالباً مسجلاً في فصولك يطابق هذا الاسم. يرجى التأكد من اسم الطالب المسجل في فصولك.';
      }

      return NextResponse.json({
        message: responseText,
        thoughtProcess,
        actionExecuted,
        actionType,
        actionPayload,
      });
    }

    // --- Intent 3: Change Student Status within Teacher's students ---
    if (
      lower.includes('غير حالة') ||
      lower.includes('عدل حالة') ||
      lower.includes('حول حالة') ||
      lower.includes('اجعل حالة')
    ) {
      thoughtProcess = 'البحث عن الطالب في فصول المعلم الحالي وتعديل حالته...';
      const students = await StudentRepository.getAll({ teacherId, includeArchived: false });
      let matchedStudent = students.find((s) => lower.includes(s.name.toLowerCase()));

      if (matchedStudent) {
        let newStatus: StudentStatus = 'normal';
        let statusLabel = 'طبيعي';

        if (lower.includes('ممتاز') || lower.includes('متميز')) {
          newStatus = 'excellent';
          statusLabel = 'ممتاز 🟢';
        } else if (lower.includes('متابع') || lower.includes('ضعيف') || lower.includes('يحتاج')) {
          newStatus = 'needs_followup';
          statusLabel = 'يحتاج متابعة 🟡';
        }

        await StudentRepository.update(matchedStudent.id, { status: newStatus }, teacherId);

        actionExecuted = true;
        actionType = 'update_student_status';
        actionPayload = { studentId: matchedStudent.id, newStatus };
        responseText = `تم بنجاح تحديث حالة الطالب **${matchedStudent.name}** إلى (${statusLabel}).`;
      } else {
        responseText = 'لم أتمكن من العثور على هذا الطالب في فصولك لتعديل حالته.';
      }

      return NextResponse.json({
        message: responseText,
        thoughtProcess,
        actionExecuted,
        actionType,
        actionPayload,
      });
    }

    // --- Intent 4: Query Follow-ups & Reminders within Teacher's dataset ---
    if (
      lower.includes('عندي متابعات') ||
      lower.includes('متابعات معلقة') ||
      lower.includes('ايه اللي ورايا') ||
      lower.includes('المهام المطلوبة') ||
      lower.includes('ملاحظات اليوم')
    ) {
      thoughtProcess = 'جلب المتابعات المعلقة الخاصة بفصول المعلم فقط...';
      const pendingFollowUps = await FollowUpRepository.getAll({ teacherId, status: 'pending' });

      if (pendingFollowUps.length > 0) {
        responseText = `لديك **${pendingFollowUps.length}** متابعات معلقة تتطلب اهتمامك في فصولك:

` +
          pendingFollowUps.slice(0, 5).map((f, i) => `${i + 1}. الطالب **${f.student_name}** (${f.class_name}) - موعد: ${f.follow_up_date}`).join('\n') +
          (pendingFollowUps.length > 5 ? `\n\nوغيرها ${pendingFollowUps.length - 5} حالات أخرى.` : '');
      } else {
        responseText = 'رائع جداً يا أستاذنا! لا توجد لديك أي متابعات معلقة حالياً في فصولك. كافة أمور طلابك منجزة ومحدثة 👏';
      }

      return NextResponse.json({
        message: responseText,
        thoughtProcess,
        actionExecuted: false,
        actionType: 'query_followups',
      });
    }

    // Default friendly assistant response scoped to teacher
    const stats = await DashboardRepository.getStats(teacherId);
    return NextResponse.json({
      message: `أهلاً بك يا ${authCheck.user.name || 'أستاذنا'}! 🤖 أنا مساعدك الذكي الخاص بفصولك وطلابك (${stats.totalStudents} طالباً في ${stats.totalClasses} فصول). يمكنك أن تطلب مني كتابة ملاحظة لأي طالب، الاستفسار عن حالات المتابعة، أو تقديم استراتيجيات تربوية لصفك.`,
      thoughtProcess: 'تقديم نظرة عامة مخصصة لبيانات فصول المعلم الحالية...',
      actionExecuted: false,
    });
  } catch (error: any) {
    console.error('AI Copilot error:', error);
    return NextResponse.json({ error: 'حدث خطأ في المساعد الذكي' }, { status: 500 });
  }
}
