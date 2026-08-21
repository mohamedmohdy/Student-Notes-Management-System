'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Users, Plus, Search, Filter, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Student, StudentStatus } from '@/lib/types';
import { StudentCard } from '@/components/Students/StudentCard';
import { AddEditStudentModal } from '@/components/Students/AddEditStudentModal';
import { ImportStudentsModal } from '@/components/Students/ImportStudentsModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

export default function ClassStudentsPage() {
  const params = useParams();
  const gradeId = params.gradeId as string;
  const classId = params.classId as string;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [className, setClassName] = useState('');
  const [gradeName, setGradeName] = useState('');

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch(`/api/students?classId=${classId}`);
      const data = await res.json();
      setStudents(data.students || []);
      if (data.students && data.students.length > 0) {
        setClassName(data.students[0].class_name || '');
        setGradeName(data.students[0].grade_name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لفصول الصف</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            طلاب فصل: {className ? `${className} (${gradeName})` : 'الفصل'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            قائمة الطلاب المسجلين وحالاتهم وسجل ملاحظاتهم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>استيراد طلاب من Excel</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب للفصل</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم الأكاديمي..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
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
          title="لا يوجد طلاب يطابقون البحث"
          description="يمكنك استيراد طلاب الفصل من ملف Excel أو إضافة طالب يدوياً."
          actionLabel="📥 استيراد من Excel"
          onAction={() => setIsImportOpen(true)}
          icon={<Users className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddEditStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadStudents}
        presetClassId={classId}
      />

      <ImportStudentsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadStudents}
        presetClassId={classId}
      />
    </div>
  );
}
