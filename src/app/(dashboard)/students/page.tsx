'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, Filter, FileSpreadsheet } from 'lucide-react';
import { Student, Grade, ClassRoom, StudentStatus } from '@/lib/types';
import { StudentCard } from '@/components/Students/StudentCard';
import { AddEditStudentModal } from '@/components/Students/AddEditStudentModal';
import { ImportStudentsModal } from '@/components/Students/ImportStudentsModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      const [gradesRes, classesRes] = await Promise.all([
        fetch('/api/grades'),
        fetch('/api/classes'),
      ]);
      const [gData, cData] = await Promise.all([gradesRes.json(), classesRes.json()]);
      setGrades(gData.grades || []);
      setClasses(cData.classes || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedGrade) params.set('gradeId', selectedGrade);
      if (selectedClass) params.set('classId', selectedClass);
      if (selectedStatus) params.set('status', selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedClass, selectedStatus]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">دليل الطلاب الشامل</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            البحث في كافة الصفوف، استيراد الطلاب من Excel، والوصول المباشر للملاحظات
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
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم الطالب أو رقمه الأكاديمي..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Grade filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClass('');
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الصفوف الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الفصول</option>
              {classes
                .filter((c) => !selectedGrade || c.grade_id === selectedGrade)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.grade_name} - {c.name}</option>
                ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الحالات</option>
              {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : students.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أي طلاب"
          description="يمكنك استيراد قائمة طلابك من ملف Excel أو إضافة طالب يدوياً."
          actionLabel="📥 استيراد من Excel"
          onAction={() => setIsImportOpen(true)}
          icon={<Users className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddEditStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadStudents}
      />

      <ImportStudentsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadStudents}
      />
    </div>
  );
}
