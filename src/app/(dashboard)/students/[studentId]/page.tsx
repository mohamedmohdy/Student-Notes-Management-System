'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  GraduationCap,
  School,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Edit2,
  Archive,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Student, Note, NoteType, StudentStatus, FollowUp } from '@/lib/types';
import { NoteTimeline } from '@/components/Notes/NoteTimeline';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { AddEditStudentModal } from '@/components/Students/AddEditStudentModal';
import { ResolveFollowUpModal } from '@/components/FollowUps/ResolveFollowUpModal';
import { StudentStatusBadge } from '@/components/Students/StudentStatusBadge';
import { StudentAIAnalysisCard } from '@/components/AI/StudentAIAnalysisCard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { useToast } from '@/components/UI/Toast';
import { NOTE_TYPE_LABELS, STUDENT_STATUS_LABELS } from '@/lib/utils';
import { heroTheme } from '@/lib/heroui-theme';

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const router = useRouter();
  const toast = useToast();

  const [student, setStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for notes
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modals state
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [resolvingFollowUp, setResolvingFollowUp] = useState<FollowUp | null>(null);

  const loadStudentProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/students/${studentId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStudent(data.student);
      setNotes(data.notes || []);
    } catch {
      toast.error('تعذر جلب ملف الطالب');
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    loadStudentProfile();
  }, [loadStudentProfile]);

  const handleStatusChange = async (newStatus: StudentStatus) => {
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم تحديث حالة الطالب');
      loadStudentProfile();
    } catch {
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleArchiveStudent = async () => {
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم أرشفة الطالب بنجاح');
      router.push('/students');
    } catch {
      toast.error('حدث خطأ أثناء أرشفة الطالب');
    }
  };

  if (loading) {
    return <LoadingSkeleton type="profile" />;
  }

  if (!student) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">الطالب غير موجود</h2>
        <Link href="/students" className={heroTheme.button.primary}>
          العودة لقائمة الطلاب
        </Link>
      </div>
    );
  }

  const filteredNotes = notes.filter((n) => selectedType === 'all' || n.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لدليل الطلاب</span>
        </Link>
      </div>

      {/* Student Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{student.name}</h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                الرقم الأكاديمي: <span className="font-bold text-slate-800 dark:text-slate-200">{student.student_number}</span> •{' '}
                {student.grade_name} - فصل {student.class_name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddNoteOpen(true)}
              className={heroTheme.button.primary}
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة ملاحظة للطالب</span>
            </button>

            <button
              onClick={() => setIsEditStudentOpen(true)}
              className="p-3 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 transition"
              title="تعديل بيانات الطالب"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsArchiveConfirmOpen(true)}
              className="p-3 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl border border-slate-200 dark:border-slate-700 transition"
              title="أرشفة الطالب"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Banner & Status Changer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الملاحظات:</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{student.notes_count || notes.length} ملاحظة</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مرات المتابعة:</span>
            <span className="text-base font-black text-slate-800 dark:text-white">{student.follow_ups_count || 0} متابعة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تغيير الحالة:</span>
            <select
              value={student.status}
              onChange={(e) => handleStatusChange(e.target.value as StudentStatus)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Embedded AI Student Analysis Card */}
      <StudentAIAnalysisCard studentId={studentId} />

      {/* Notes Section with Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>السجل التاريخي لملاحظات الطالب ({filteredNotes.length})</span>
          </h3>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كافة أنواع الملاحظات</option>
              {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes Timeline */}
        <NoteTimeline
          notes={filteredNotes}
          onEdit={(n) => {
            setEditingNote(n);
            setIsAddNoteOpen(true);
          }}
          onRefresh={loadStudentProfile}
        />
      </div>

      {/* Modals */}
      <AddEditNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEditingNote(null);
        }}
        onSuccess={loadStudentProfile}
        initialStudentId={studentId}
        initialNote={editingNote}
      />

      <AddEditStudentModal
        isOpen={isEditStudentOpen}
        onClose={() => setIsEditStudentOpen(false)}
        onSuccess={loadStudentProfile}
        initialStudent={student}
      />

      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveStudent}
        title="أرشفة الطالب"
        message="هل أنت متأكد من رغبتك في أرشفة هذا الطالب؟ يمكنك استعادته لاحقاً من سجل الأرشيف في الإعدادات."
        confirmText="نعم، أرشف الطالب"
        isDangerous={true}
      />
    </div>
  );
}
