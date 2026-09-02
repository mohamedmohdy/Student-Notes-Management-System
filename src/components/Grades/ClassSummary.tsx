'use client';

import React from 'react';
import { Users, FileText, School } from 'lucide-react';
import { StatCard } from '../UI/StatCard';

export interface ClassSummaryProps {
  className: string;
  gradeName: string;
  studentsCount: number;
  classNotesCount: number;
}

export function ClassSummary({
  className,
  gradeName,
  studentsCount,
  classNotesCount,
}: ClassSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <StatCard
        title="الفصل والمرحلة"
        value={`فصل ${className || '-'}`}
        description={gradeName ? `تابع لـ ${gradeName}` : 'الصف الدراسي'}
        icon={School}
        color="indigo"
      />

      <StatCard
        title="طلاب الفصل"
        value={studentsCount}
        description="إجمالي الطلاب المسجلين"
        icon={Users}
        color="emerald"
      />

      <StatCard
        title="ملاحظات الفصل"
        value={classNotesCount}
        description="الملاحظات الجماعية الموثقة"
        icon={FileText}
        color="amber"
      />
    </div>
  );
}
