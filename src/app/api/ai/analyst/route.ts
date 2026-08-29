import { NextRequest, NextResponse } from 'next/server';
import {
  StudentRepository,
  NoteRepository,
  FollowUpRepository,
  GradeRepository,
  ClassRepository,
  ClassNoteRepository,
  DashboardRepository,
} from '@/lib/db';
import { requireActiveTeacher } from '@/lib/auth';
import { NoteType, NotePriority, StudentStatus } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS, CLASS_NOTE_TYPE_LABELS } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireActiveTeacher();
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const teacherId = authCheck.user.userId;
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'general'; // 'general' | 'student' | 'class' | 'weekly'
    const studentId = body.studentId;
    const classId = body.classId;

    // -------------------------------------------------------------
    // MODE 1: Targeted Student Analysis (تحليل الطالب المستهدف فقط)
    // -------------------------------------------------------------
    if (mode === 'student') {
      if (!studentId) {
        return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });
      }

      const student = await StudentRepository.findById(studentId, teacherId);
      if (!student) {
        return NextResponse.json({ error: 'الطالب غير موجود أو غير تابع لحسابك' }, { status: 404 });
      }

      // Query ONLY this student's notes and follow-ups directly from DB
      const studentNotes = await NoteRepository.getAll({ studentId, teacherId, includeArchived: false });
      const studentFollowUps = await FollowUpRepository.getAll({ studentId, teacherId });

      if (studentNotes.length === 0 && studentFollowUps.length === 0) {
        return NextResponse.json({
          insufficientData: true,
          studentName: student.name,
          message: 'لا توجد بيانات كافية لإجراء هذا التحليل حالياً.',
        });
      }

      // Compute statistics for student
      const positiveCount = studentNotes.filter((n) => n.type === 'positive').length;
      const academicCount = studentNotes.filter((n) => n.type === 'academic').length;
      const behavioralCount = studentNotes.filter((n) => n.type === 'behavioral').length;
      const pendingFollowUps = studentFollowUps.filter((f) => f.status === 'pending').length;

      // Recurrent behavior tag detection
      const typeCounts: Record<string, number> = {};
      studentNotes.forEach((n) => {
        const label = NOTE_TYPE_LABELS[n.type]?.label || n.type;
        typeCounts[label] = (typeCounts[label] || 0) + 1;
      });

      const topBehavior = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'غير محدد';

      // Improvement level calculation
      let improvement = 'مستقر ومستمر';
      if (positiveCount > behavioralCount + academicCount) {
        improvement = 'تحسن إيجابي ملحوظ 📈';
      } else if (pendingFollowUps > 0) {
        improvement = 'يحتاج إلى متابعة وتدخل مستمر ⚠️';
      }

      // Recommendations
      const recommendations: string[] = [];
      if (behavioralCount > 0) {
        recommendations.push('تحديد محفزات السلوك وتكليف الطالب بمسؤوليات قيادية ومهمات صفية.');
      }
      if (academicCount > 0) {
        recommendations.push('إشراك الطالب في خطط علاجية مبسطة أو مجموعات التعلم بالأقران.');
      }
      if (positiveCount > 0) {
        recommendations.push('مواصلة التعزيز الإيجابي وتوثيق التميز المستمر في سجل الإنجاز.');
      }
      if (recommendations.length === 0) {
        recommendations.push('الاستمرار في المتابعة الدورية وتوثيق الملاحظات الصفية بانتظام.');
      }

      return NextResponse.json({
        insufficientData: false,
        student: {
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          className: student.class_name,
          gradeName: student.grade_name,
          status: student.status,
        },
        metrics: {
          totalNotes: studentNotes.length,
          positiveNotes: positiveCount,
          academicNotes: academicCount,
          behavioralNotes: behavioralCount,
          pendingFollowUps,
          totalFollowUps: studentFollowUps.length,
          topBehavior,
          improvement,
        },
        summary: `تم تسجيل ${studentNotes.length} ملاحظة للطالب (${positiveCount} إيجابية و ${behavioralCount + academicCount} ملاحظة تتطلب تركيزاً) مع ${pendingFollowUps} متابعة معلقة.`,
        recommendations,
      });
    }

    // -------------------------------------------------------------
    // MODE 2: Targeted Class Analysis (تحليل الفصل المستهدف فقط)
    // -------------------------------------------------------------
    if (mode === 'class') {
      if (!classId) {
        return NextResponse.json({ error: 'معرف الفصل مطلوب' }, { status: 400 });
      }

      const classItem = await ClassRepository.findById(classId, teacherId);
      if (!classItem) {
        return NextResponse.json({ error: 'الفصل غير موجود أو غير تابع لحسابك' }, { status: 404 });
      }

      // Query ONLY this class's students, notes, and class notes from DB
      const classStudents = await StudentRepository.getAll({ classId, teacherId, includeArchived: false });
      const classStudentNotes = await NoteRepository.getAll({ classId, teacherId, includeArchived: false });
      const classSpecificNotes = await ClassNoteRepository.getAll({ classId, teacherId, includeArchived: false });

      if (classStudents.length === 0 && classSpecificNotes.length === 0) {
        return NextResponse.json({
          insufficientData: true,
          className: classItem.name,
          message: 'لا توجد بيانات كافية لإجراء هذا التحليل حالياً.',
        });
      }

      const positiveCount = classStudentNotes.filter((n) => n.type === 'positive').length;
      const needsFollowUpStudents = classStudents.filter((s) => s.status === 'needs_followup');

      // Engagement & Discipline Index
      let disciplineLevel = 'منضبط ومستقر 🟢';
      if (classSpecificNotes.some((cn) => cn.type === 'discipline') || classStudentNotes.filter((n) => n.type === 'behavioral').length >= 3) {
        disciplineLevel = 'يحتاج إلى تعزيز الانضباط وتقليل التشتت 🟡';
      }

      let engagementLevel = 'تفاعل جيد';
      if (classSpecificNotes.some((cn) => cn.type === 'engagement') || positiveCount >= 4) {
        engagementLevel = 'تفاعل نشط ومشاركة عالية 🌟';
      }

      const recommendations: string[] = [
        'تنظيم وتوزيع المجموعات الصفية لتقليل الأحاديث الجانبية أثناء الشرح.',
        `التركيز على متابعة الطلاب (${needsFollowUpStudents.length} طلاب) الذين يحتاجون خطط دعم فردية.`,
        'مواصلة توثيق الملاحظات العامة لتقييم تطور الفصل على مدار الأسابيع القادمة.',
      ];

      return NextResponse.json({
        insufficientData: false,
        classItem: {
          id: classItem.id,
          name: classItem.name,
          gradeName: classItem.grade_name,
        },
        metrics: {
          totalStudents: classStudents.length,
          totalStudentNotes: classStudentNotes.length,
          totalClassNotes: classSpecificNotes.length,
          positiveNotes: positiveCount,
          studentsNeedingFollowUp: needsFollowUpStudents.length,
          disciplineLevel,
          engagementLevel,
        },
        recommendations,
      });
    }

    // -------------------------------------------------------------
    // MODE 3 & 4: General Overview & Weekly Analysis (تحليل عام وأسبوعي)
    // -------------------------------------------------------------
    const allStudents = await StudentRepository.getAll({ teacherId, includeArchived: false });
    const allNotes = await NoteRepository.getAll({ teacherId, includeArchived: false });
    const allFollowUps = await FollowUpRepository.getAll({ teacherId });
    const allClasses = await ClassRepository.getAll({ teacherId, includeArchived: false });
    const allClassNotes = await ClassNoteRepository.getAll({ teacherId, includeArchived: false });

    if (allStudents.length === 0 && allNotes.length === 0) {
      return NextResponse.json({
        insufficientData: true,
        message: 'لا توجد بيانات كافية لإجراء هذا التحليل حالياً.',
      });
    }

    // Calculate Weekly Window
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekNotes = allNotes.filter((n) => new Date(n.created_at) >= oneWeekAgo);
    const thisWeekClassNotes = allClassNotes.filter((cn) => new Date(cn.created_at) >= oneWeekAgo);
    const thisWeekFollowUps = allFollowUps.filter((f) => new Date(f.created_at) >= oneWeekAgo);

    // Student Status Distribution
    const studentStatusCounts = {
      normal: allStudents.filter((s) => s.status === 'normal').length,
      excellent: allStudents.filter((s) => s.status === 'excellent').length,
      needs_followup: allStudents.filter((s) => s.status === 'needs_followup').length,
      weak: allStudents.filter((s) => s.status === 'weak').length,
    };

    // Note Type Distribution
    const noteTypeCounts: Record<string, number> = {};
    allNotes.forEach((n) => {
      noteTypeCounts[n.type] = (noteTypeCounts[n.type] || 0) + 1;
    });

    const positiveTotal = noteTypeCounts['positive'] || 0;
    const behavioralTotal = noteTypeCounts['behavioral'] || 0;
    const academicTotal = noteTypeCounts['academic'] || 0;
    const totalNotesCount = allNotes.length;

    // Top recurrent behavior
    const sortedTypes = Object.entries(noteTypeCounts).sort((a, b) => b[1] - a[1]);
    const topBehaviorKey = sortedTypes[0]?.[0] || 'academic';
    const topBehaviorLabel = NOTE_TYPE_LABELS[topBehaviorKey as NoteType]?.label || topBehaviorKey;

    // General Trend
    let generalTrend = 'أداء مستقر ومتوازن 📊';
    if (positiveTotal > (behavioralTotal + academicTotal)) {
      generalTrend = 'تحسن إيجابي ملحوظ في تفاعل الطلاب 📈';
    } else if (behavioralTotal > positiveTotal) {
      generalTrend = 'تحديات سلوكية تحتاج لضبط وتنظيم أكبر ⚠️';
    }

    // Pending Follow-ups
    const pendingFollowUps = allFollowUps.filter((f) => f.status === 'pending');

    // Smart Recommendations based on real metrics
    const smartRecommendations: string[] = [];
    if (pendingFollowUps.length > 0) {
      smartRecommendations.push(`لديك ${pendingFollowUps.length} متابعة معلقة تتطلب التحديث والتواصل مع أولياء الأمور.`);
    }
    if (studentStatusCounts.excellent > 0) {
      smartRecommendations.push(`استثمر تميز ${studentStatusCounts.excellent} طالباً متميزاً في قيادة الأنشطة ومساعدة زملائهم.`);
    }
    if (behavioralTotal > 0) {
      smartRecommendations.push('يفضل تعزيز الأنشطة التفاعلية والتحفيز الفوري لتقليل الملاحظات السلوكية.');
    }
    if (allClassNotes.length === 0) {
      smartRecommendations.push('جرب توثيق ملاحظات عامة عن الفصول لمراقبة تطور البيئة الصفية بشكل جماعي.');
    }
    if (smartRecommendations.length === 0) {
      smartRecommendations.push('المنظومة تسير بكفاءة عالية، واصل توثيق الملاحظات الدورية.');
    }

    return NextResponse.json({
      insufficientData: false,
      overview: {
        totalStudents: allStudents.length,
        totalClasses: allClasses.length,
        totalNotes: totalNotesCount,
        totalClassNotes: allClassNotes.length,
        totalFollowUps: allFollowUps.length,
        pendingFollowUps: pendingFollowUps.length,
      },
      studentDistribution: studentStatusCounts,
      noteDistribution: noteTypeCounts,
      insights: {
        topBehavior: topBehaviorLabel,
        generalTrend,
        positiveRatio: totalNotesCount > 0 ? Math.round((positiveTotal / totalNotesCount) * 100) : 0,
      },
      weekly: {
        notesThisWeek: thisWeekNotes.length,
        classNotesThisWeek: thisWeekClassNotes.length,
        followUpsThisWeek: thisWeekFollowUps.length,
        summary: `تم تسجيل ${thisWeekNotes.length} ملاحظة طالب و ${thisWeekClassNotes.length} ملاحظة فصل خلال هذا الأسبوع.`,
      },
      recommendations: smartRecommendations,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI Data Analyst API error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة تحليل البيانات الذكي' }, { status: 500 });
  }
}
