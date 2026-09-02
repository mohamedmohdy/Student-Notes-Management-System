'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Users, Plus, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  GradeBreadcrumb,
  ClassSummary,
} from '@/components/Grades';
import { StudentCard, AddEditStudentModal, ImportStudentsModal } from '@/components/Students';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { ClassNotesTab } from '@/components/ClassNotes/ClassNotesTab';
import { ClassAIAnalysisCard } from '@/components/AI/ClassAIAnalysisCard';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Button } from '@/components/UI/Button';
import { Student, StudentStatus } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';

export default function ClassStudentsPage() {
  const params = useParams();
  const gradeId = params.gradeId as string;
  const classId = params.classId as string;
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'classNotes'>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [classNotesCount, setClassNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [quickNoteStudent, setQuickNoteStudent] = useState<Student | null>(null);

  const [className, setClassName] = useState('');
  const [gradeName, setGradeName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [studentsRes, notesRes, classRes] = await Promise.all([
        fetch(`/api/students?classId=${classId}`),
        fetch(`/api/class-notes?classId=${classId}`),
        fetch(`/api/classes/${classId}`),
      ]);
      const [sData, nData, cData] = await Promise.all([
        studentsRes.json(),
        notesRes.json(),
        classRes.ok ? classRes.json() : Promise.resolve(null),
      ]);

      setStudents(sData.students || []);
      setClassNotesCount(Array.isArray(nData.classNotes) ? nData.classNotes.length : 0);

      if (cData && cData.classRoom) {
        setClassName(cData.classRoom.name || '');
        setGradeName(cData.classRoom.grade_name || '');
      } else if (cData && cData.class) {
        setClassName(cData.class.name || '');
        setGradeName(cData.class.grade_name || '');
      } else if (sData.students && sData.students.length > 0) {
        setClassName(sData.students[0].class_name || '');
        setGradeName(sData.students[0].grade_name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.student_number && s.student_number.includes(search));
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      {/* 1. Breadcrumb */}
      <GradeBreadcrumb
        items={[
          { label: gradeName || 'الصف الدراسي', href: `/grades/${gradeId}` },
          { label: `فصل ${className || ''}` },
        ]}
      />

      {/* 2. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              فصل: {className ? `${className} (${gradeName})` : 'الفصل'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {students.length} طالب
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            إدارة طلاب الفصل وتوثيق الملاحظات العامة وسجل المتابعة.
          </p>
        </div>

        {activeTab === 'students' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              size="md"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              className="border-slate-200 dark:border-slate-700"
            >
              استيراد Excel
            </Button>

            <Button
              onClick={() => setIsAddOpen(true)}
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              إضافة طالب للفصل
            </Button>
          </div>
        )}
      </div>

      {/* 3. Class Summary Metrics */}
      <ClassSummary
        className={className}
        gradeName={gradeName}
        studentsCount={students.length}
        classNotesCount={classNotesCount}
      />

      {/* 4. Embedded Class AI Analysis Card */}
      <ClassAIAnalysisCard classId={classId} />

      {/* 5. Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'students'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>طلاب الفصل ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('classNotes')}
          className={`flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all duration-150 ${
            activeTab === 'classNotes'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ملاحظات الفصل ({classNotesCount})</span>
        </button>
      </div>

      {/* 6. Active Tab Content */}
      {activeTab === 'students' ? (
        <div className="space-y-5">
          {/* Search & Filter Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الرقم الأكاديمي..."
                className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
              >
                <option value="all">كافة الحالات</option>
                {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Grid */}
          {loading ? (
            <LoadingSkeleton count={6} type="card" />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              title="لا يوجد طلاب مسجلون في هذا الفصل"
              description="ابدأ بإضافة أول طالب أو قم باستيراد قائمة الفصل من ملف Excel."
              actionLabel="+ إضافة طالب الآن"
              onAction={() => setIsAddOpen(true)}
              icon={<Users className="w-10 h-10" />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onQuickNote={(s) => setQuickNoteStudent(s)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <ClassNotesTab
          classId={classId}
          className={className}
          gradeName={gradeName}
        />
      )}

      {/* Quick Note Modal */}
      {quickNoteStudent && (
        <AddEditNoteModal
          isOpen={true}
          onClose={() => setQuickNoteStudent(null)}
          initialStudent={quickNoteStudent}
          onSuccess={() => {
            setQuickNoteStudent(null);
            loadData();
            toast.success('تمت إضافة الملاحظة بنجاح');
          }}
        />
      )}

      {/* Add Student Modal */}
      <AddEditStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadData}
        initialGradeId={gradeId}
        initialClassId={classId}
      />

      {/* Import Modal */}
      <ImportStudentsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadData}
        defaultGradeId={gradeId}
        defaultClassId={classId}
      />
    </PageContainer>
  );
}
