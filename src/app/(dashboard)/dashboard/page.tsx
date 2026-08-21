'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  School,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Bot,
  Activity,
  Plus,
  Smartphone,
  Bell,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/UI/StatCard';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { NoteCard } from '@/components/Notes/NoteCard';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { ResolveFollowUpModal } from '@/components/FollowUps/ResolveFollowUpModal';
import { DashboardStats, Note, FollowUp, Student, ClassRoom } from '@/lib/types';
import { NOTE_TYPE_LABELS, formatDateArabic, formatDateTimeArabic, STUDENT_STATUS_LABELS } from '@/lib/utils';
import { requestNotificationPermission, checkAndNotifyUrgentFollowUps } from '@/lib/notifications';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [resolvingFollowUp, setResolvingFollowUp] = useState<FollowUp | null>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [quickNoteStudent, setQuickNoteStudent] = useState<Student | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dashRes, userRes, classRes, stuRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/auth/me'),
        fetch('/api/classes'),
        fetch('/api/students'),
      ]);
      const [dashData, userData, classData, stuData] = await Promise.all([
        dashRes.json(),
        userRes.json(),
        classRes.json(),
        stuRes.json(),
      ]);

      setStats(dashData.stats);
      setUser(userData.user);
      setClasses(classData.classes || []);
      setStudents(stuData.students || []);

      if (dashData.stats?.urgentFollowUps) {
        checkAndNotifyUrgentFollowUps(dashData.stats.urgentFollowUps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, [loadDashboardData]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('تم تفعيل التنبيهات والإشعارات بنجاح على هذا الجهاز 🔔');
      if (stats?.urgentFollowUps) {
        checkAndNotifyUrgentFollowUps(stats.urgentFollowUps);
      }
    } else {
      toast.error('تم رفض إذن الإشعارات من المتصفح');
    }
  };

  const handleQuickStatusChange = async (studentId: string, newStatus: any) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم تحديث حالة الطالب بنجاح');
      loadDashboardData();
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  if (loading) {
    return <LoadingSkeleton count={6} type="card" />;
  }

  if (!stats) return null;

  const matrixStudents = selectedClassId === 'all'
    ? students.slice(0, 12)
    : students.filter((s) => s.class_id === selectedClassId);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl shadow-indigo-950/20 border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/10 backdrop-blur-md text-xs font-bold text-indigo-200">
              <Bot className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>مساعدك الذكي: التقرير اليومي ومصفوفة الفصول التفاعلية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              أهلاً بك يا {user?.name || 'أستاذنا الفاضل'} 👋
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-medium">
              لديك اليوم <strong className="text-white font-bold">{stats.totalStudents} طالباً</strong> في{' '}
              <strong className="text-white font-bold">{stats.totalClasses} فصول</strong>. هناك{' '}
              <strong className="text-amber-300 font-bold">{stats.studentsNeedingFollowUp} طلاب</strong> يتطلب وضعهم متابعة قريبة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddNoteOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-indigo-50 text-indigo-950 rounded-2xl text-xs font-black shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>+ تسجيل ملاحظة سريعة</span>
            </button>

            <button
              onClick={handleEnableNotifications}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>تفعيل التنبيهات والإشعارات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الصفوف"
          value={stats.totalGrades}
          icon={GraduationCap}
          color="indigo"
          href="/grades"
        />
        <StatCard
          title="إجمالي الفصول"
          value={stats.totalClasses}
          icon={School}
          color="cyan"
          href="/grades"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={stats.totalStudents}
          icon={Users}
          color="purple"
          href="/students"
        />
        <StatCard
          title="إجمالي الملاحظات"
          value={stats.totalNotes}
          icon={FileText}
          color="emerald"
          href="/notes"
        />
        <StatCard
          title="يحتاجون متابعة"
          value={stats.studentsNeedingFollowUp}
          subtitle="حالات تتطلب تدخلاً"
          icon={AlertTriangle}
          color="rose"
          href="/follow-ups"
        />
        <StatCard
          title="ملاحظات اليوم"
          value={stats.notesToday}
          subtitle="خلال الـ 24 ساعة"
          icon={Clock}
          color="amber"
          href="/notes"
        />
        <StatCard
          title="ملاحظات هذا الأسبوع"
          value={stats.notesThisWeek}
          icon={Calendar}
          color="indigo"
          href="/notes"
        />
        <StatCard
          title="ملاحظات هذا الشهر"
          value={stats.notesThisMonth}
          icon={TrendingUp}
          color="emerald"
          href="/notes"
        />
      </div>

      {/* INTERACTIVE CLASS SELECTOR & STUDENT MATRIX */}
      <div className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>مصفوفة الطلاب التفاعلية للفصول</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              اختر الفصل للاطلاع الفوري على حالة طلابه وتغيير حالاتهم وإضافة ملاحظات بنقرة واحدة
            </p>
          </div>

          {/* Class Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedClassId === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              كافة الفصول ({students.length})
            </button>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedClassId === cls.id
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                فصل {cls.name} ({cls.students_count || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {matrixStudents.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-slate-800 transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/students/${s.id}`}
                    className="text-xs font-black text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    {s.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold mt-0.5">
                    رقم: {s.student_number} • {s.class_name}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    s.status === 'excellent'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : s.status === 'needs_followup'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  }`}
                >
                  {s.status === 'excellent' ? 'ممتاز' : s.status === 'needs_followup' ? 'يحتاج متابعة' : 'طبيعي'}
                </span>
              </div>

              {/* Quick Actions for this student */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <select
                  value={s.status}
                  onChange={(e) => handleQuickStatusChange(s.id, e.target.value)}
                  className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200"
                >
                  <option value="excellent">ممتاز</option>
                  <option value="normal">طبيعي</option>
                  <option value="needs_followup">يحتاج متابعة</option>
                </select>

                <button
                  onClick={() => {
                    setQuickNoteStudent(s);
                    setIsAddNoteOpen(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold transition"
                >
                  + ملاحظة
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes by Type Bar Breakdown */}
        <div className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">توزيع الملاحظات حسب النوع</h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">إجمالي {stats.totalNotes} ملاحظة</span>
          </div>

          <div className="space-y-3 pt-2">
            {stats.notesByType.map((item: any) => {
              const percentage = stats.totalNotes > 0 ? Math.round((item.count / stats.totalNotes) * 100) : 0;
              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.count} ملاحظة ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Health Breakdown */}
        <div className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">مؤشر أداء وسلامة الطلاب</h3>
            <Link href="/students" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              دليل الطلاب
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {stats.studentsByStatus && stats.studentsByStatus.map((item: any) => {
              const percentage = stats.totalStudents > 0 ? Math.round((item.count / stats.totalStudents) * 100) : 0;
              const color = item.status === 'excellent' ? 'bg-emerald-500' : item.status === 'needs_followup' ? 'bg-rose-500' : 'bg-indigo-500';
              return (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.count} طالب ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Urgent Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities Timeline */}
        <div className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">سجل النشاطات والأحداث الأخيرة</h3>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold">مباشر</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act: any) => (
                <div key={act.id} className="py-3.5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    {act.type === 'note' ? <FileText className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{act.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{act.desc}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{formatDateArabic(act.time)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                لا توجد نشاطات مسجلة مؤخراً.
              </div>
            )}
          </div>
        </div>

        {/* Urgent Follow-ups List */}
        <div className="p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">متابعات عاجلة تتطلب اتخاذ إجراء</h3>
            </div>
            <Link href="/follow-ups" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              <span>عرض الكل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.urgentFollowUps && stats.urgentFollowUps.length > 0 ? (
              stats.urgentFollowUps.map((fu: any) => (
                <div key={fu.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/students/${fu.student_id}`} className="text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                        {fu.student_name}
                      </Link>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">({fu.grade_name} - {fu.class_name})</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{fu.note_content}</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                      موعد المتابعة: {formatDateArabic(fu.follow_up_date)}
                    </p>
                  </div>

                  <button
                    onClick={() => setResolvingFollowUp(fu)}
                    className="shrink-0 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition"
                  >
                    إتمام الإجراء
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                رائع! لا توجد حالات متابعة متأخرة أو قيد الانتظار حالياً.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AddEditNoteModal
        isOpen={!!editingNote || isAddNoteOpen}
        onClose={() => {
          setEditingNote(null);
          setIsAddNoteOpen(false);
          setQuickNoteStudent(null);
        }}
        onSuccess={loadDashboardData}
        initialNote={editingNote}
        presetStudentId={quickNoteStudent?.id}
      />

      <ResolveFollowUpModal
        isOpen={!!resolvingFollowUp}
        onClose={() => setResolvingFollowUp(null)}
        onSuccess={loadDashboardData}
        followUp={resolvingFollowUp}
      />
    </div>
  );
}
