import React from 'react';
import Link from 'next/link';
import { Student } from '@/lib/types';
import { StudentStatusBadge } from './StudentStatusBadge';
import { FileText, Clock, ChevronLeft } from 'lucide-react';

export function StudentCard({ student }: { student: Student }) {
  return (
    <Link
      href={`/students/${student.id}`}
      className="group block p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-200/60 shadow-xs shrink-0 group-hover:scale-105 transition">
            {student.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition text-sm sm:text-base leading-snug">
              {student.name}
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              رقم الطالب: <span className="font-bold text-slate-600">{student.student_number}</span>
            </p>
          </div>
        </div>

        <StudentStatusBadge status={student.status} />
      </div>

      {/* Class & Grade Tag */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
        <span>{student.grade_name || 'الصف'} • فصل {student.class_name}</span>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-slate-700">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            {student.notes_count || 0} ملاحظة
          </span>
          <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:-translate-x-1 transition" />
        </div>
      </div>
    </Link>
  );
}
