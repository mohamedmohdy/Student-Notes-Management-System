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
import { AnnouncementBanner } from '@/components/Dashboard/AnnouncementBanner';

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

  if (loading) {
    return <LoadingSkeleton count={6} />;
  }

  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((s) => s.class_id === selectedClassId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Platform-wide Announcements Banner */}
      <AnnouncementBanner />

      {/* Top Welcome Card with Quick Note Button */}
      <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-tr from-indigo-900 via-indigo-800 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 rounded-3xl text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>مساحة العمل الخاصة بك 🔒</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              أهلاً بك يا {user?.name || 'أستاذنا الفاضل'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 font-medium max-w-xl">
              لوحة التحكم التفاعلية لمتابعة فصولك وطلابك ({stats?.totalStudents || 0} طالباً) وتسجيل الملاحظات اليومية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setQuickNoteStudent(null);
                setIsAddNoteOpen(true);
              }}
              className="px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl text-xs font-black shadow-lg shadow-black/10 transition active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>تدوين ملاحظة سريعة</span>
            </button>

            <Link
              href="/reports"
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>التقارير الشاملة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.totalStudents || 0}
          icon={Users}
          description="في فصولك الخاصة"
          variant="indigo"
          href="/students"
        />
        <StatCard
          title="الملاحظات المسجلة"
          value={stats?.totalNotes || 0}
          icon={FileText}
          description="ملاحظات فصولك"
          variant="purple"
          href="/notes"
        />
        <StatCard
          title="ملاحظات اليوم"
          value={stats?.notesToday || 0}
          icon={Calendar}
          description="تم تدوينها اليوم"
          variant="cyan"
          href="/notes"
        />
        <StatCard
          title="متابعات معلقة"
          value={stats?.pendingFollowUps || 0}
          icon={AlertTriangle}
          description="تتطلب متابعة"
          variant={stats?.pendingFollowUps > 0 ? 'rose' : 'emerald'}
          href="/follow-ups"
        />
      </div>

      {/* Interactive Class Filter & Students Quick Grid */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">فصولي والوصول السريع للطلاب</h2>
          </div>

          {/* Class Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedClassId === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              جميع الفصول ({students.length})
            </button>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedClassId === c.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Students Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
          {filteredStudents.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="truncate">
                  <Link href={`/students/${s.id}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block">
                    {s.name}
                  </Link>
                  <span className="text-[10px] text-slate-400 font-semibold">{s.class_name} • #{s.student_number}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setQuickNoteStudent(s);
                  setIsAddNoteOpen(true);
                }}
                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 rounded-lg text-[10px] font-bold shrink-0 transition"
                title="إضافة ملاحظة سريعة للطالب"
              >
                + ملاحظة
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notes & Urgent Followups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Follow-ups */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">متابعات عاجلة مطلوبة</h2>
            </div>
            <Link href="/follow-ups" className="text-xs font-bold text-indigo-600 hover:underline">
              عرض الكل
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.urgentFollowUps && stats.urgentFollowUps.length > 0 ? (
              stats.urgentFollowUps.map((f: FollowUp) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 overflow-hidden">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">{f.student_name}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{f.note_content}</p>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">موعد المتابعة: {f.follow_up_date}</span>
                  </div>

                  <button
                    onClick={() => setResolvingFollowUp(f)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    معالجة
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                👏 لا توجد متابعات عاجلة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">أحدث الملاحظات المدونة</h2>
            </div>
            <Link href="/notes" className="text-xs font-bold text-indigo-600 hover:underline">
              عرض السجل الكامل
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentNotes && stats.recentNotes.length > 0 ? (
              stats.recentNotes.map((n: Note) => (
                <div
                  key={n.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{n.student_name}</span>
                    <span className="text-[10px] text-slate-400">{formatDateArabic(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{n.content}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                لم يتم تسجيل ملاحظات مؤخراً.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <AddEditNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        initialStudent={quickNoteStudent}
        onSuccess={() => {
          setIsAddNoteOpen(false);
          loadDashboardData();
          toast.success('تم تدوين الملاحظة بنجاح');
        }}
      />

      {/* Resolve Follow Up Modal */}
      {resolvingFollowUp && (
        <ResolveFollowUpModal
          isOpen={true}
          followUp={resolvingFollowUp}
          onClose={() => setResolvingFollowUp(null)}
          onSuccess={() => {
            setResolvingFollowUp(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
