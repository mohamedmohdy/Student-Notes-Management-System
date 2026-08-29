'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, Plus, Search, Filter, ArrowRight, FileSpreadsheet, FileText } from 'lucide-react';
import { Student, StudentStatus, ClassNote } from '@/lib/types';
import { StudentCard } from '@/components/Students/StudentCard';
import { AddEditStudentModal } from '@/components/Students/AddEditStudentModal';
import { ImportStudentsModal } from '@/components/Students/ImportStudentsModal';
import { ClassNotesTab } from '@/components/ClassNotes/ClassNotesTab';
import { ClassAIAnalysisCard } from '@/components/AI/ClassAIAnalysisCard';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';
import { heroTheme } from '@/lib/heroui-theme';

export default function ClassStudentsPage() {
  const params = useParams();
  const gradeId = params.gradeId as string;
  const classId = params.classId as string;

  const [activeTab, setActiveTab] = useState<'students' | 'classNotes'>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [classNotesCount, setClassNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.student_number.includes(search);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/grades/${gradeId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لفصول الصف</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            فصل: {className ? `${className} (${gradeName})` : 'الفصل'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            إدارة طلاب الفصل وتوثيق الملاحظات العامة وسجل المتابعة
          </p>
        </div>

        {activeTab === 'students' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsImportOpen(true)}
              className={heroTheme.button.success}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>استيراد طلاب من Excel</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className={heroTheme.button.primary}
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طالب للفصل</span>
            </button>
          </div>
        )}
      </div>

      {/* Embedded Class AI Analysis Card */}
      <ClassAIAnalysisCard classId={classId} />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl self-start w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
            activeTab === 'students'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>طلاب الفصل ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classNotes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
            activeTab === 'classNotes'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ملاحظات الفصل ({classNotesCount})</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'students' ? (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الرقم الأكاديمي..."
                className={heroTheme.input}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <StudentCard key={student.id} student={student} />
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
    </div>
  );
}
