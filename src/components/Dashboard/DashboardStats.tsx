'use client';

import React from 'react';
import { Users, FileText, Calendar, AlertTriangle, GraduationCap } from 'lucide-react';
import { StatCard } from '../UI/StatCard';

export interface DashboardStatsProps {
  totalStudents?: number;
  totalNotes?: number;
  notesToday?: number;
  pendingFollowUps?: number;
}

export function DashboardStats({
  totalStudents = 0,
  totalNotes = 0,
  notesToday = 0,
  pendingFollowUps = 0,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        title="إجمالي الطلاب"
        value={totalStudents}
        icon={Users}
        description="في فصولك الخاصة"
        color="indigo"
        href="/students"
      />
      <StatCard
        title="الملاحظات المسجلة"
        value={totalNotes}
        icon={FileText}
        description="إجمالي السجلات"
        color="purple"
        href="/notes"
      />
      <StatCard
        title="ملاحظات اليوم"
        value={notesToday}
        icon={Calendar}
        description="المدونة اليوم"
        color="cyan"
        href="/notes"
      />
      <StatCard
        title="متابعات معلقة"
        value={pendingFollowUps}
        icon={AlertTriangle}
        description="تتطلب متابعة"
        color={pendingFollowUps > 0 ? 'rose' : 'emerald'}
        badge={pendingFollowUps > 0 ? 'نشط' : undefined}
        href="/follow-ups"
      />
    </div>
  );
}
