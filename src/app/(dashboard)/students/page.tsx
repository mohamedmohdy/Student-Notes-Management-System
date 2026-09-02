'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  StudentDirectoryHeader,
  StudentSearch,
  StudentFilters,
  StudentCard,
  AddEditStudentModal,
  ImportStudentsModal,
} from '@/components/Students';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Student, Grade, ClassRoom } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';
import { Users } from 'lucide-react';

export default function StudentsDirectoryPage() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [quickNoteStudent, setQuickNoteStudent] = useState<Student | null>(null);

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
    <PageContainer>
      {/* 1. Header with Title and Primary Actions */}
      <StudentDirectoryHeader
        totalCount={students.length}
        onOpenAddStudent={() => setIsAddOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* 2. Search and Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <StudentSearch value={search} onChange={setSearch} />
        <StudentFilters
          grades={grades}
          classes={classes}
          selectedGrade={selectedGrade}
          onSelectGrade={setSelectedGrade}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          onResetFilters={() => {
            setSelectedGrade('');
            setSelectedClass('');
            setSelectedStatus('');
            setSearch('');
          }}
        />
      </div>

      {/* 3. Students Grid / List View */}
      {loading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : students.length === 0 ? (
        <EmptyState
          title={search || selectedGrade || selectedClass || selectedStatus ? 'لم يتم العثور على أي طلاب مطابقين' : 'لا يوجد طلاب مسجلين حتى الآن'}
          description={search || selectedGrade || selectedClass || selectedStatus ? 'جرّب تعديل عبارة البحث أو إعادة تعيين الفلاتر لعرض نتائج أخرى.' : 'ابدأ بإضافة أول طالب أو استيراد كشف الفصول من ملف Excel.'}
          actionLabel="📥 استيراد من Excel"
          onAction={() => setIsImportOpen(true)}
          icon={<Users className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onQuickNote={(s) => setQuickNoteStudent(s)}
            />
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

      {/* Quick Note Modal */}
      {quickNoteStudent && (
        <AddEditNoteModal
          isOpen={true}
          onClose={() => setQuickNoteStudent(null)}
          initialStudent={quickNoteStudent}
          onSuccess={() => {
            setQuickNoteStudent(null);
            loadStudents();
            toast.success('تمت إضافة الملاحظة بنجاح');
          }}
        />
      )}
    </PageContainer>
  );
}
