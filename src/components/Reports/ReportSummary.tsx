'use client';

import React from 'react';
import { Users, FileText, Clock, GraduationCap } from 'lucide-react';
import { StatCard } from '../UI/StatCard';

export interface ReportSummaryProps {
  studentsCount: number;
  notesCount: number;
  classNotesCount: number;
  followUpsCount: number;
}

export function ReportSummary({
  studentsCount,
  notesCount,
  classNotesCount,
  followUpsCount,
}: ReportSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="الطلاب المشمولون"
        value={studentsCount}
        description="إجمالي الطلاب في النطاق"
        icon={Users}
        color="indigo"
      />

      <StatCard
        title="ملاحظات الطلاب"
        value={notesCount}
        description="الملاحظات الفردية الموثقة"
        icon={FileText}
        color="emerald"
      />

      <StatCard
        title="ملاحظات الفصول"
        value={classNotesCount}
        description="الملاحظات العامة للصفوف"
        icon={GraduationCap}
        color="cyan"
      />

      <StatCard
        title="سجلات المتابعة"
        value={followUpsCount}
        description="الحالات التي تتطلب متابعة"
        icon={Clock}
        color="amber"
      />
    </div>
  );
}
