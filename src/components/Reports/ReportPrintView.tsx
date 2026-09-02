'use client';

import React from 'react';
import { Note, ClassNote, Grade, ClassRoom } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS, CLASS_NOTE_TYPE_LABELS, formatDateArabic } from '@/lib/utils';

export interface ReportPrintViewProps {
  notes: Note[];
  classNotes: ClassNote[];
  grades: Grade[];
  classes: ClassRoom[];
  selectedGrade: string;
  selectedClass: string;
  startDate: string;
  endDate: string;
  teacherName?: string;
  studentsCount: number;
  notesCount: number;
  classNotesCount: number;
  followUpsCount: number;
}

export function ReportPrintView({
  notes = [],
  classNotes = [],
  grades = [],
  classes = [],
  selectedGrade,
  selectedClass,
  startDate,
  endDate,
  teacherName = 'المعلم المسؤول',
  studentsCount = 0,
  notesCount = 0,
  classNotesCount = 0,
  followUpsCount = 0,
}: ReportPrintViewProps) {
  const selectedGradeObj = grades.find((g) => g.id === selectedGrade);
  const selectedClassObj = classes.find((c) => c.id === selectedClass);

  const gradeLabel = selectedGradeObj ? selectedGradeObj.name : 'جميع الصفوف الدراسية';
  const classLabel = selectedClassObj ? selectedClassObj.name : 'جميع الفصول والشعب';
  const dateRangeLabel = startDate && endDate
    ? `من ${startDate} إلى ${endDate}`
    : startDate
    ? `من تاريخ ${startDate}`
    : endDate
    ? `حتى تاريخ ${endDate}`
    : 'كامل السجل الزمني المتاح';

  const todayArabic = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="hidden print:block print-only text-slate-900 bg-white p-2 font-cairo">
      {/* 1. Formal Institutional Print Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5 print-avoid-break">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-600">المملكة العربية السعودية — سجل الطالب الإلكتروني</p>
            <h1 className="text-xl font-black text-slate-900">تقرير متابعة وسجل ملاحظات الطلاب</h1>
            <p className="text-xs font-semibold text-slate-700">تقرير إداري وتربوي شامل معتمد</p>
          </div>

          <div className="text-left space-y-1 text-xs">
            <p><span className="font-bold">تاريخ الاستخراج:</span> {todayArabic}</p>
            <p><span className="font-bold">المعلم المشرف:</span> {teacherName}</p>
          </div>
        </div>

        {/* Filter Summary Metadata Bar */}
        <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300 grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700">الصف الدراسي:</span>{' '}
            <span className="font-semibold text-slate-900">{gradeLabel}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">الفصل / الشعبة:</span>{' '}
            <span className="font-semibold text-slate-900">{classLabel}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">النطاق الزمني:</span>{' '}
            <span className="font-semibold text-slate-900">{dateRangeLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Bar for Print */}
      <div className="grid grid-cols-4 gap-3 mb-6 print-avoid-break">
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[11px] font-bold text-slate-600">الطلاب المشمولون</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{studentsCount}</p>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[11px] font-bold text-slate-600">ملاحظات الطلاب</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{notesCount}</p>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[11px] font-bold text-slate-600">ملاحظات الفصول</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{classNotesCount}</p>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[11px] font-bold text-slate-600">المتابعات المطلوبة</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{followUpsCount}</p>
        </div>
      </div>

      {/* 3. Primary Notes Print Table */}
      <div className="mb-6">
        <h2 className="text-sm font-black text-slate-900 mb-2 pb-1 border-b border-slate-300 flex items-center justify-between">
          <span>سجل ملاحظات الطلاب الموثقة ({notes.length})</span>
          <span className="text-xs font-normal text-slate-600">مرتبة بحسب الأحدث</span>
        </h2>

        {notes.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-600">
            لا توجد ملاحظات فردية مسجلة للطلاب في النطاق المحدد.
          </div>
        ) : (
          <table className="print-table w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-400">
                <th className="p-2 w-8 text-center border border-slate-300 font-black">#</th>
                <th className="p-2 w-32 border border-slate-300 font-black">اسم الطالب</th>
                <th className="p-2 w-24 border border-slate-300 font-black">الصف / الفصل</th>
                <th className="p-2 w-20 border border-slate-300 font-black">النوع</th>
                <th className="p-2 w-16 border border-slate-300 font-black">الأولوية</th>
                <th className="p-2 border border-slate-300 font-black">نص الملاحظة</th>
                <th className="p-2 w-28 border border-slate-300 font-black">الإجراء المتخذ</th>
                <th className="p-2 w-24 border border-slate-300 font-black">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n, idx) => {
                const typeLabel = NOTE_TYPE_LABELS[n.type]?.label || n.type;
                const priorityLabel = NOTE_PRIORITY_LABELS[n.priority]?.label || n.priority;
                return (
                  <tr key={n.id} className="border-b border-slate-300 hover:bg-slate-50/50 print-avoid-break">
                    <td className="p-2 text-center border border-slate-300 font-bold text-slate-600">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-black text-slate-900">
                      <div>{n.student_name || 'طالب'}</div>
                      {n.student_number && (
                        <div className="text-[10px] text-slate-500 font-normal">#{n.student_number}</div>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-700 font-semibold">
                      {n.grade_name || ''} - {n.class_name || ''}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-800 font-semibold">{typeLabel}</td>
                    <td className="p-2 border border-slate-300 font-bold">
                      <span className={n.priority === 'high' ? 'text-rose-700 font-black' : 'text-slate-800'}>
                        {priorityLabel}
                      </span>
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-800 whitespace-pre-line leading-relaxed">
                      {n.content}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-700">
                      {n.action_taken || '—'}
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-600 font-medium whitespace-nowrap">
                      {formatDateArabic(n.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Class Notes Print Table (if any) */}
      {classNotes.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-sm font-black text-slate-900 mb-2 pb-1 border-b border-slate-300">
            سجل الملاحظات العامة للفصول ({classNotes.length})
          </h2>
          <table className="print-table w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-400">
                <th className="p-2 w-8 text-center border border-slate-300 font-black">#</th>
                <th className="p-2 w-28 border border-slate-300 font-black">الصف / الفصل</th>
                <th className="p-2 w-24 border border-slate-300 font-black">تاريخ الملاحظة</th>
                <th className="p-2 w-24 border border-slate-300 font-black">نوع الملاحظة</th>
                <th className="p-2 w-32 border border-slate-300 font-black">العنوان</th>
                <th className="p-2 border border-slate-300 font-black">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {classNotes.map((cn, idx) => (
                <tr key={cn.id} className="border-b border-slate-300 print-avoid-break">
                  <td className="p-2 text-center border border-slate-300 font-bold text-slate-600">{idx + 1}</td>
                  <td className="p-2 border border-slate-300 font-black text-slate-900">
                    {cn.grade_name || ''} - {cn.class_name || ''}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-700 font-semibold">
                    {formatDateArabic(cn.note_date)}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-800 font-semibold">
                    {CLASS_NOTE_TYPE_LABELS[cn.type]?.label || cn.type}
                  </td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-900">
                    {cn.title || '—'}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-800 whitespace-pre-line leading-relaxed">
                    {cn.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Signatures and Endorsement Footer */}
      <div className="mt-8 pt-6 border-t-2 border-slate-300 print-avoid-break">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-8">
            <p className="font-bold text-slate-800">توقيع المعلم المشرف:</p>
            <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto" />
            <p className="text-slate-600 font-semibold">{teacherName}</p>
          </div>
          <div className="space-y-8">
            <p className="font-bold text-slate-800">اعتماد إدارة المدرسة:</p>
            <div className="border-b border-dotted border-slate-400 w-3/4 mx-auto" />
            <p className="text-slate-600 font-semibold">الختم والتوقيع الرسمي</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-slate-500 font-medium">
          تم استخراج هذا التقرير آلياً عبر منصة سجل الطالب الإلكتروني — جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
