'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  ReportsWorkspaceHeader,
  ReportFilters,
  ReportSummary,
  ReportPrintView,
} from '@/components/Reports';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Note, Grade, ClassRoom, Student, FollowUp, ClassNote } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS, CLASS_NOTE_TYPE_LABELS, formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { BarChart3, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [reportData, setReportData] = useState<{
    notes: Note[];
    students: Student[];
    grades: Grade[];
    classes: ClassRoom[];
    followUps: FollowUp[];
    classNotes: ClassNote[];
  }>({
    notes: [],
    students: [],
    grades: [],
    classes: [],
    followUps: [],
    classNotes: [],
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toast = useToast();

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGrade) params.set('gradeId', selectedGrade);
      if (selectedClass) params.set('classId', selectedClass);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data) {
        setReportData({
          notes: [],
          students: [],
          grades: [],
          classes: [],
          followUps: [],
          classNotes: [],
        });
        return;
      }

      setReportData({
        notes: Array.isArray(data.notes) ? data.notes : [],
        students: Array.isArray(data.students) ? data.students : [],
        grades: Array.isArray(data.grades) ? data.grades : [],
        classes: Array.isArray(data.classes) ? data.classes : [],
        followUps: Array.isArray(data.followUps) ? data.followUps : [],
        classNotes: Array.isArray(data.classNotes) ? data.classNotes : [],
      });

      if (Array.isArray(data.grades)) setGrades(data.grades);
      if (Array.isArray(data.classes)) setClasses(data.classes);
    } catch (e) {
      console.error(e);
      setReportData({
        notes: [],
        students: [],
        grades: [],
        classes: [],
        followUps: [],
        classNotes: [],
      });
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedClass, startDate, endDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const notes = reportData?.notes || [];
  const students = reportData?.students || [];
  const classNotes = reportData?.classNotes || [];
  const followUps = reportData?.followUps || [];

  // Export to Excel
  const exportToExcel = async () => {
    if (notes.length === 0 && classNotes.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }

    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Student Notes
      if (notes.length > 0) {
        const rows = notes.map((n, idx) => ({
          'م': idx + 1,
          'اسم الطالب': n.student_name || '',
          'رقم الطالب': n.student_number || '',
          'الصف الدراسي': n.grade_name || '',
          'الفصل': n.class_name || '',
          'نوع الملاحظة': NOTE_TYPE_LABELS[n.type]?.label || n.type,
          'الأولوية': NOTE_PRIORITY_LABELS[n.priority]?.label || n.priority,
          'نص الملاحظة': n.content,
          'الإجراء المتخذ': n.action_taken || '—',
          'تحتاج متابعة؟': n.requires_follow_up === 1 ? 'نعم' : 'لا',
          'تاريخ التسجيل': formatDateArabic(n.created_at),
          'المعلم': n.teacher_name || '',
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'ملاحظات الطلاب');
      }

      // Sheet 2: Class Notes
      if (classNotes.length > 0) {
        const classRows = classNotes.map((cn, idx) => ({
          'م': idx + 1,
          'الصف الدراسي': cn.grade_name || '',
          'الفصل': cn.class_name || '',
          'تاريخ الملاحظة': formatDateArabic(cn.note_date),
          'نوع الملاحظة': CLASS_NOTE_TYPE_LABELS[cn.type]?.label || cn.type,
          'العنوان': cn.title || '—',
          'نص الملاحظة': cn.content,
          'تاريخ التسجيل': formatDateArabic(cn.created_at),
        }));
        const classSheet = XLSX.utils.json_to_sheet(classRows);
        XLSX.utils.book_append_sheet(workbook, classSheet, 'ملاحظات الفصل');
      }

      XLSX.writeFile(workbook, `تقرير_الملاحظات_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('تم تصدير ملف Excel بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء تصدير Excel');
    } finally {
      setExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (notes.length === 0 && classNotes.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }

    const headers = ['م', 'اسم الطالب', 'رقم الطالب', 'الصف', 'الفصل', 'نوع الملاحظة', 'الأولوية', 'نص الملاحظة', 'الإجراء', 'تاريخ التسجيل'];
    const rows = notes.map((n, idx) => [
      idx + 1,
      `"${n.student_name || ''}"`,
      `"${n.student_number || ''}"`,
      `"${n.grade_name || ''}"`,
      `"${n.class_name || ''}"`,
      `"${NOTE_TYPE_LABELS[n.type]?.label || n.type}"`,
      `"${NOTE_PRIORITY_LABELS[n.priority]?.label || n.priority}"`,
      `"${(n.content || '').replace(/"/g, '""')}"`,
      `"${(n.action_taken || '').replace(/"/g, '""')}"`,
      `"${formatDateArabic(n.created_at)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الملاحظات_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير ملف CSV بنجاح');
  };

  // Print Report as PDF
  const handlePrintPDF = () => {
    if (loading) {
      toast.info('جاري تحميل وتجهيز بيانات التقرير...');
      return;
    }
    if (notes.length === 0 && classNotes.length === 0) {
      toast.warning('لا توجد بيانات مطابقة للطباعة');
      return;
    }
    // Ensure DOM is fully painted before initiating modal print dialog
    requestAnimationFrame(() => {
      window.print();
    });
  };

  return (
    <PageContainer>
      {/* Printable Report View (Visible only during window.print()) */}
      <ReportPrintView
        notes={notes}
        classNotes={classNotes}
        grades={grades}
        classes={classes}
        selectedGrade={selectedGrade}
        selectedClass={selectedClass}
        startDate={startDate}
        endDate={endDate}
        teacherName={notes[0]?.teacher_name || 'المعلم المشرف'}
        studentsCount={students.length}
        notesCount={notes.length}
        classNotesCount={classNotes.length}
        followUpsCount={followUps.length}
      />

      {/* 1. Header with Export Actions */}
      <div className="screen-only">
        <ReportsWorkspaceHeader
          onExportExcel={exportToExcel}
          onExportCSV={exportToCSV}
          onPrintPDF={handlePrintPDF}
          exporting={exporting}
          loading={loading}
        />
      </div>

      {/* 2. Filters Box */}
      <div className="screen-only p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <ReportFilters
          grades={grades}
          classes={classes}
          selectedGrade={selectedGrade}
          onSelectGrade={setSelectedGrade}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          startDate={startDate}
          onSelectStartDate={setStartDate}
          endDate={endDate}
          onSelectEndDate={setEndDate}
          onResetFilters={() => {
            setSelectedGrade('');
            setSelectedClass('');
            setStartDate('');
            setEndDate('');
          }}
        />
      </div>

      {/* 3. Summary KPIs */}
      <div className="screen-only">
        <ReportSummary
          studentsCount={students.length}
          notesCount={notes.length}
          classNotesCount={classNotes.length}
          followUpsCount={followUps.length}
        />
      </div>

      {/* 4. Results List */}
      <div className="screen-only">
        {loading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : notes.length === 0 && classNotes.length === 0 ? (
          <EmptyState
            title="لا توجد بيانات مطابقة للفلاتر الحالية"
            description="جرب تعديل الصف أو الفصل أو نطاق التاريخ لعرض نتائج أخرى."
            icon={<BarChart3 className="w-10 h-10" />}
          />
        ) : (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                نتائج كشف الملاحظات الموثقة ({notes.length})
              </h3>
              <span className="text-xs font-bold text-slate-400">جاهزة للتصدير المباشر</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notes.map((n) => (
                <div key={n.id} className="py-3.5 space-y-1.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-slate-100">{n.student_name}</span>
                      <span className="text-slate-400">({n.grade_name || ''} - {n.class_name || ''})</span>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{formatDateArabic(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">
                    {n.content}
                  </p>
                  {n.action_taken && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      الإجراء المتخذ: <strong className="text-slate-800 dark:text-slate-200">{n.action_taken}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
