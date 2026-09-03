'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Filter, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  StudentProfileHeader,
  StudentOverview,
  AddEditStudentModal,
  StudentProfilePrintView,
} from '@/components/Students';
import { NoteTimeline } from '@/components/Notes/NoteTimeline';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { StudentAIAnalysisCard } from '@/components/AI/StudentAIAnalysisCard';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { Student, Note, StudentStatus } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';
import { NOTE_TYPE_LABELS } from '@/lib/utils';
import { Button } from '@/components/UI/Button';

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
    return (
      <PageContainer>
        <LoadingSkeleton type="profile" />
      </PageContainer>
    );
  }

  if (!student) {
    return (
      <PageContainer>
        <div className="text-center py-16 space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">الطالب غير موجود</h2>
          <Link href="/students">
            <Button variant="primary">العودة لقائمة الطلاب</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const handlePrintPDF = () => {
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const filteredNotes = notes.filter((n) => selectedType === 'all' || n.type === selectedType);

  return (
    <PageContainer>
      {/* Printable View (Visible only during window.print()) */}
      <StudentProfilePrintView student={student} notes={notes} />

      <div className="screen-only space-y-6">
        {/* 1. Header with back link, avatar, name, and actions */}
        <StudentProfileHeader
          student={student}
          onOpenAddNote={() => {
            setEditingNote(null);
            setIsAddNoteOpen(true);
          }}
          onOpenEditStudent={() => setIsEditStudentOpen(true)}
          onOpenArchiveConfirm={() => setIsArchiveConfirmOpen(true)}
          onPrintReport={handlePrintPDF}
        />

        {/* 2. Overview metrics & status selector */}
        <StudentOverview
          student={student}
          notesCount={notes.length}
          onStatusChange={handleStatusChange}
        />

        {/* 3. AI Student Analysis */}
        <StudentAIAnalysisCard studentId={studentId} />

        {/* 4. Notes Section with Type Filter */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  السجل التاريخي لملاحظات الطالب ({filteredNotes.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  كافة الملاحظات والمتابعات المسجلة للطالب
                </p>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="min-h-[36px] px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              >
                <option value="all">كافة أنواع الملاحظات</option>
                {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
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
    </PageContainer>
  );
}
