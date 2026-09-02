'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, UserPlus, Users } from 'lucide-react';
import { Button } from '../UI/Button';

export interface OwnerDashboardHeaderProps {
  onOpenAddTeacher: () => void;
}

export function OwnerDashboardHeader({ onOpenAddTeacher }: OwnerDashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            لوحة تحكم إدارة المنصة
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          متابعة المعلمين المسجلين، تفعيل الحسابات، إدارة الإعلانات، ومراجعة طلبات الدعم الفني.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link href="/owner/teachers">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            className="border-slate-200 dark:border-slate-700"
          >
            قائمة المعلمين
          </Button>
        </Link>

        <Button
          onClick={onOpenAddTeacher}
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          إضافة معلم جديد
        </Button>
      </div>
    </div>
  );
}
