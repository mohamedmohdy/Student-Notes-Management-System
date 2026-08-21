'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { BarChart3, Download, Printer, FileSpreadsheet, FileText, Filter, Calendar } from 'lucide-react';
import { Grade, ClassRoom, Student, Note, FollowUp } from '@/lib/types';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS, formatDateArabic, formatDateTimeArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';

export default function ReportsPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [reportData, setReportData] = useState<{
    notes: Note[];
    students: Student[];
    grades: Grade[];
    classes: ClassRoom[];
    followUps: FollowUp[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
      setReportData(data);
      if (data.grades) setGrades(data.grades);
      if (data.classes) setClasses(data.classes);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء تحميل بيانات التقرير');
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedClass, startDate, endDate, toast]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Export to Excel
  const exportToExcel = () => {
    if (!reportData || reportData.notes.length === 0) {
      toast.warning('لا توجد بيانات ملاحظات للتصدير');
      return;
    }

    const rows = reportData.notes.map((n, idx) => ({
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
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الملاحظات');
    XLSX.writeFile(workbook, `تقرير_الملاحظات_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('تم تصدير ملف Excel بنجاح');
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData || reportData.notes.length === 0) {
      toast.warning('لا توجد بيانات للتصدير');
      return;
    }

    const headers = ['م', 'اسم الطالب', 'رقم الطالب', 'الصف', 'الفصل', 'نوع الملاحظة', 'الأولوية', 'نص الملاحظة', 'الإجراء', 'تاريخ التسجيل'];
    const rows = reportData.notes.map((n, idx) => [
      idx + 1,
      `"${n.student_name}"`,
      `"${n.student_number}"`,
      `"${n.grade_name}"`,
      `"${n.class_name}"`,
      `"${NOTE_TYPE_LABELS[n.type]?.label || n.type}"`,
      `"${NOTE_PRIORITY_LABELS[n.priority]?.label || n.priority}"`,
      `"${n.content.replace(/"/g, '""')}"`,
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">مركز التقارير والتصدير</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            توليد تقارير شاملة عن الصفوف والفصول والملاحظات وتصديرها بصيغ متعددة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / PDF</span>
          </button>
        </div>
      </div>

      {/* Filters (Hidden on print) */}
      <div className="no-print p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الصف</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClass('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الصفوف</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الفصل</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الفصول</option>
              {classes
                .filter((c) => !selectedGrade || c.grade_id === selectedGrade)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.grade_name} - {c.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Report View */}
      <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">سجل الطالب الإلكتروني — تقرير الملاحظات</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              تاريخ إصدار التقرير: {formatDateArabic(new Date().toISOString())}
            </p>
          </div>
          <div className="text-left text-xs font-bold text-slate-600">
            <p>المملكة العربية السعودية</p>
            <p>وزارة التعليم</p>
          </div>
        </div>

        {/* Report Stats Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الملاحظات</p>
            <p className="text-xl font-black text-slate-900">{reportData?.notes.length || 0}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">الطلاب المشمولون</p>
            <p className="text-xl font-black text-slate-900">{reportData?.students.length || 0}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">ملاحظات إيجابية</p>
            <p className="text-xl font-black text-emerald-700">
              {reportData?.notes.filter((n) => n.type === 'positive').length || 0}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">تتطلب متابعة</p>
            <p className="text-xl font-black text-rose-700">
              {reportData?.notes.filter((n) => n.requires_follow_up === 1).length || 0}
            </p>
          </div>
        </div>

        {/* Report Table */}
        {loading ? (
          <LoadingSkeleton count={5} type="table" />
        ) : !reportData || reportData.notes.length === 0 ? (
          <EmptyState
            title="لا توجد بيانات مطابقة لمعايير التقرير"
            description="جرب توسيع نطاق التاريخ أو اختيار صفوف أخرى."
            icon={<FileText className="w-10 h-10" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                  <th className="p-3.5">م</th>
                  <th className="p-3.5">اسم الطالب</th>
                  <th className="p-3.5">الرقم</th>
                  <th className="p-3.5">الصف / الفصل</th>
                  <th className="p-3.5">نوع الملاحظة</th>
                  <th className="p-3.5">الأولوية</th>
                  <th className="p-3.5">نص الملاحظة</th>
                  <th className="p-3.5">الإجراء المتخذ</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.notes.map((note, idx) => {
                  const typeStyle = NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.other;
                  const prioStyle = NOTE_PRIORITY_LABELS[note.priority] || NOTE_PRIORITY_LABELS.medium;
                  return (
                    <tr key={note.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">{note.student_name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{note.student_number}</td>
                      <td className="p-3.5 text-slate-600">{note.grade_name} - {note.class_name}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${prioStyle.bg} ${prioStyle.text}`}>
                          {prioStyle.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-800 max-w-xs leading-normal">{note.content}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs">{note.action_taken || '—'}</td>
                      <td className="p-3.5 text-slate-500 font-semibold">{formatDateArabic(note.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
