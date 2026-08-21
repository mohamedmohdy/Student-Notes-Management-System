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
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { useToast } from '@/components/UI/Toast';
import { NOTE_TYPE_LABELS, STUDENT_STATUS_LABELS } from '@/lib/utils';

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
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <h3 className="text-lg font-bold text-slate-800">لم يتم العثور على الطالب</h3>
        <p className="text-xs text-slate-500">قد يكون الطالب مؤرشفاً أو تم حذفه.</p>
        <Link href="/students" className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
          العودة لدليل الطلاب
        </Link>
      </div>
    );
  }

  const filteredNotes = notes.filter((n) => {
    if (selectedType === 'all') return true;
    return n.type === selectedType;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لقائمة الطلاب</span>
        </Link>
      </div>

      {/* Main Student Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-100 shrink-0">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{student.name}</h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="text-xs font-semibold text-slate-500">
                الرقم الأكاديمي: <span className="font-bold text-slate-800">{student.student_number}</span> •{' '}
                {student.grade_name} - فصل {student.class_name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddNoteOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-indigo-200 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ إضافة ملاحظة للطالب</span>
            </button>

            <button
              onClick={() => setIsEditStudentOpen(true)}
              className="p-3 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl border border-slate-200 transition"
              title="تعديل بيانات الطالب"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsArchiveConfirmOpen(true)}
              className="p-3 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-slate-200 transition"
              title="أرشفة الطالب"
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Banner & Status Changer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الملاحظات:</span>
            <span className="text-base font-black text-slate-800">{student.notes_count || 0} ملاحظة</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مرات المتابعة:</span>
            <span className="text-base font-black text-slate-800">{student.follow_ups_count || 0} متابعة</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">تغيير الحالة:</span>
            <select
              value={student.status}
              onChange={(e) => handleStatusChange(e.target.value as StudentStatus)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes Section & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>سجل الملاحظات والمتابعات التاريخي (Timeline)</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              الكل ({notes.length})
            </button>
            {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => {
              const count = notes.filter((n) => n.type === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedType === key
                      ? `${val.bg} ${val.text} border border-current`
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline List */}
        <NoteTimeline
          notes={filteredNotes}
          onEditNote={(note) => setEditingNote(note)}
          onArchiveSuccess={loadStudentProfile}
          onResolveFollowUp={(note) => {
            if (note.follow_up) setResolvingFollowUp(note.follow_up);
          }}
          onAddNewNote={() => setIsAddNoteOpen(true)}
        />
      </div>

      {/* Modals */}
      <AddEditNoteModal
        isOpen={isAddNoteOpen || !!editingNote}
        onClose={() => {
          setIsAddNoteOpen(false);
          setEditingNote(null);
        }}
        onSuccess={loadStudentProfile}
        initialNote={editingNote}
        presetStudentId={student.id}
        presetStudentName={student.name}
      />

      <AddEditStudentModal
        isOpen={isEditStudentOpen}
        onClose={() => setIsEditStudentOpen(false)}
        onSuccess={loadStudentProfile}
        initialStudent={student}
      />

      <ResolveFollowUpModal
        isOpen={!!resolvingFollowUp}
        onClose={() => setResolvingFollowUp(null)}
        onSuccess={loadStudentProfile}
        followUp={resolvingFollowUp}
      />

      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveStudent}
        title="أرشفة ملف الطالب"
        message={`هل أنت متأكد من رغبتك في أرشفة ملف الطالب (${student.name})؟ ستبقى كافة الملاحظات والمتابعات محفوظة في الأرشيف.`}
        confirmLabel="أرشفة الطالب"
      />
    </div>
  );
}
