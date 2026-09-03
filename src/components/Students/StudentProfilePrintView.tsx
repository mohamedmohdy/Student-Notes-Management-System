'use client';

import React from 'react';
import { Student, Note } from '@/lib/types';
import {
  NOTE_TYPE_LABELS,
  NOTE_PRIORITY_LABELS,
  STUDENT_STATUS_LABELS,
  formatDateTimeArabic,
} from '@/lib/utils';

export interface StudentProfilePrintViewProps {
  student: Student;
  notes: Note[];
}

export function StudentProfilePrintView({ student, notes = [] }: StudentProfilePrintViewProps) {
  const todayArabic = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const statusInfo = STUDENT_STATUS_LABELS[student.status] || { label: 'طبيعي' };

  // Calculate high-level summary KPIs
  const totalNotes = notes.length;
  const academicNotes = notes.filter((n) => n.type === 'academic').length;
  const behavioralNotes = notes.filter((n) => n.type === 'behavioral').length;
  const positiveNotes = notes.filter((n) => n.type === 'positive' || n.type === 'participation' || n.type === 'skill').length;
  const followUpNotes = notes.filter((n) => n.requires_follow_up === 1 || n.type === 'needs_followup').length;

  return (
    <div className="hidden print:block print-only text-slate-900 bg-white p-2 font-cairo">
      {/* 1. Formal Institutional Print Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 print-avoid-break">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-600">منظومة بسيطة (Basita) — سجل الطالب الإلكتروني</p>
            <h1 className="text-xl font-black text-slate-900">سجل المتابعة والتقرير الفردي للطالب</h1>
            <p className="text-xs font-semibold text-slate-700">تقرير إداري وتربوي شامل وموثق</p>
          </div>

          <div className="text-left space-y-1 text-xs">
            <p><span className="font-bold">تاريخ الاستخراج:</span> {todayArabic}</p>
            <p><span className="font-bold">حالة الطالب الحالية:</span> {statusInfo.label}</p>
          </div>
        </div>

        {/* Student Demographic Summary Card */}
        <div className="mt-3 p-3 bg-slate-100 rounded-lg border border-slate-300 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-700">اسم الطالب:</span>{' '}
            <span className="font-black text-slate-900">{student.name}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">الرقم الأكاديمي:</span>{' '}
            <span className="font-semibold text-slate-900">#{student.student_number || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">الصف والمرحلة:</span>{' '}
            <span className="font-semibold text-slate-900">{student.grade_name || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700">الفصل / الشعبة:</span>{' '}
            <span className="font-semibold text-slate-900">{student.class_name || '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. Statistical KPI Summary Bar */}
      <div className="grid grid-cols-5 gap-2.5 mb-4 print-avoid-break">
        <div className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-600">إجمالي الملاحظات</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{totalNotes}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-600">الملاحظات الأكاديمية</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{academicNotes}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-600">الملاحظات السلوكية</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{behavioralNotes}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-600">المشاركات والتميز</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{positiveNotes}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-center">
          <p className="text-[10px] font-bold text-slate-600">حالات المتابعة</p>
          <p className="text-base font-black text-slate-900 mt-0.5">{followUpNotes}</p>
        </div>
      </div>

      {/* 3. Detailed Notes Table */}
      <div className="mb-6">
        <h3 className="text-xs font-black text-slate-900 border-b border-slate-300 pb-1.5 mb-2">
          تفاصيل السجل التاريخي للملاحظات والأنشطة ({notes.length})
        </h3>

        {notes.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-500">
            لا توجد أي ملاحظات مسجلة لهذا الطالب في السجل حتى تاريخ إصدار التقرير.
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th className="w-8 text-center">#</th>
                <th className="w-32">التاريخ والتوقيت</th>
                <th className="w-24">النوع والأولوية</th>
                <th>تفاصيل ومحتوى الملاحظة</th>
                <th className="w-44">الإجراء المتخذ / التوجيه</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note, index) => {
                const { date, time } = formatDateTimeArabic(note.created_at);
                const typeInfo = NOTE_TYPE_LABELS[note.type] || NOTE_TYPE_LABELS.other;
                const priorityInfo = NOTE_PRIORITY_LABELS[note.priority] || NOTE_PRIORITY_LABELS.medium;

                return (
                  <tr key={note.id || index}>
                    <td className="text-center font-bold text-slate-700">{index + 1}</td>
                    <td>
                      <span className="font-bold text-slate-900 block">{date}</span>
                      {time && <span className="text-[10px] text-slate-500 font-semibold">{time}</span>}
                    </td>
                    <td>
                      <span className="font-bold text-slate-900 block">{typeInfo.label}</span>
                      <span className="text-[10px] text-slate-600 font-medium">أولوية {priorityInfo.label}</span>
                    </td>
                    <td>
                      <p className="whitespace-pre-line text-slate-800 font-normal leading-relaxed">
                        {note.content}
                      </p>
                      {note.requires_follow_up === 1 && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          يتطلب متابعة مستمرة
                        </span>
                      )}
                    </td>
                    <td>
                      {note.action_taken ? (
                        <p className="text-slate-800 font-medium">{note.action_taken}</p>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">لم يسجل إجراء إضافي</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Formal Certification & Endorsement Signatures */}
      <div className="pt-6 border-t-2 border-slate-300 print-avoid-break">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-6">
            <p className="font-bold text-slate-800">المعلم المشرف على السجل</p>
            <p className="text-slate-400 font-medium">الاسم والتوقيع: ............................</p>
          </div>
          <div className="space-y-6">
            <p className="font-bold text-slate-800">الموجه الطلابي / المرشد</p>
            <p className="text-slate-400 font-medium">الاسم والتوقيع: ............................</p>
          </div>
          <div className="space-y-6">
            <p className="font-bold text-slate-800">مدير المدرسة / الاعتماد الرسمي</p>
            <p className="text-slate-400 font-medium">الختم والتوقيع: ............................</p>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
          تم استخراج هذا التقرير آلياً عبر منظومة بسيطة (Basita) لإدارة ملاحظات ومتابعات الطلاب الإلكترونية
        </div>
      </div>
    </div>
  );
}
