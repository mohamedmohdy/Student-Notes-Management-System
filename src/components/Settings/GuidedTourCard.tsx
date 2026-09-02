'use client';

import React from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '../UI/Button';

export interface GuidedTourCardProps {
  onLaunchTour: () => void;
}

export function GuidedTourCard({ onLaunchTour }: GuidedTourCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0 border border-amber-100 dark:border-amber-900/60">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            الجولة التعريفية التفاعلية
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            شرح تفاعلي خطوة بخطوة لجميع أدوات وأقسام المنصة لتسهيل الاستخدام.
          </p>
        </div>
      </div>

      <Button
        onClick={onLaunchTour}
        variant="primary"
        size="md"
        leftIcon={<Sparkles className="w-4 h-4" />}
        className="shrink-0"
      >
        بدء الجولة التعريفية
      </Button>
    </div>
  );
}
