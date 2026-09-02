'use client';

import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Grade, ClassRoom } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

export interface StudentFiltersProps {
  grades: Grade[];
  classes: ClassRoom[];
  selectedGrade: string;
  onSelectGrade: (id: string) => void;
  selectedClass: string;
  onSelectClass: (id: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onResetFilters: () => void;
}

export function StudentFilters({
  grades = [],
  classes = [],
  selectedGrade,
  onSelectGrade,
  selectedClass,
  onSelectClass,
  selectedStatus,
  onSelectStatus,
  onResetFilters,
}: StudentFiltersProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount =
    (selectedGrade ? 1 : 0) + (selectedClass ? 1 : 0) + (selectedStatus ? 1 : 0);

  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Grade Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:hidden">
          الصف الدراسي
        </label>
        <select
          value={selectedGrade}
          onChange={(e) => {
            onSelectGrade(e.target.value);
            onSelectClass('');
          }}
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Class Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:hidden">
          الفصل
        </label>
        <select
          value={selectedClass}
          onChange={(e) => onSelectClass(e.target.value)}
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الفصول</option>
          {classes
            .filter((c) => !selectedGrade || c.grade_id === selectedGrade)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade_name ? `${c.grade_name} - ` : ''}{c.name}
              </option>
            ))}
        </select>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:hidden">
          الحالة
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => onSelectStatus(e.target.value)}
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الحالات</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="sm:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold border transition shrink-0 ${
            activeFiltersCount > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>تصفية</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl flex items-center justify-center"
            title="إعادة تعيين الفلاتر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop Filter Toolbar */}
      <div className="hidden sm:block flex-1">{filterContent}</div>

      {/* Mobile Filter Bottom Sheet Modal */}
      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="تصفية قائمة الطلاب"
        maxWidth="md"
      >
        <div className="space-y-4">
          {filterContent}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  onResetFilters();
                  setIsMobileFilterOpen(false);
                }}
              >
                إعادة تعيين
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
