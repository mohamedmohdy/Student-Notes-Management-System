'use client';

import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Grade, ClassRoom } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS } from '@/lib/utils';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

export interface NotesFiltersProps {
  grades: Grade[];
  classes: ClassRoom[];
  selectedGrade: string;
  onSelectGrade: (id: string) => void;
  selectedClass: string;
  onSelectClass: (id: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
  requiresFollowUp: string;
  onSelectRequiresFollowUp: (val: string) => void;
  onResetFilters: () => void;
}

export function NotesFilters({
  grades = [],
  classes = [],
  selectedGrade,
  onSelectGrade,
  selectedClass,
  onSelectClass,
  selectedType,
  onSelectType,
  selectedPriority,
  onSelectPriority,
  requiresFollowUp,
  onSelectRequiresFollowUp,
  onResetFilters,
}: NotesFiltersProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount =
    (selectedGrade ? 1 : 0) +
    (selectedClass ? 1 : 0) +
    (selectedType ? 1 : 0) +
    (selectedPriority ? 1 : 0) +
    (requiresFollowUp !== '' ? 1 : 0);

  const filterContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {/* Grade */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 sm:hidden">
          الصف الدراسي
        </label>
        <select
          value={selectedGrade}
          onChange={(e) => {
            onSelectGrade(e.target.value);
            onSelectClass('');
          }}
          className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الصفوف</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Class */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 sm:hidden">
          الفصل
        </label>
        <select
          value={selectedClass}
          onChange={(e) => onSelectClass(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
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

      {/* Note Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 sm:hidden">
          نوع الملاحظة
        </label>
        <select
          value={selectedType}
          onChange={(e) => onSelectType(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الأنواع</option>
          {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 sm:hidden">
          الأولوية
        </label>
        <select
          value={selectedPriority}
          onChange={(e) => onSelectPriority(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">كافة الأولويات</option>
          {Object.entries(NOTE_PRIORITY_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Follow up requirement */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 sm:hidden">
          حالة المتابعة
        </label>
        <select
          value={requiresFollowUp}
          onChange={(e) => onSelectRequiresFollowUp(e.target.value)}
          className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition"
        >
          <option value="">حالة المتابعة (الكل)</option>
          <option value="true">تحتاج متابعة</option>
          <option value="false">بدون متابعة</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Trigger Button */}
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

      {/* Desktop Toolbar */}
      <div className="hidden sm:block flex-1">{filterContent}</div>

      {/* Mobile Filter Modal */}
      <Modal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="تصفية سجل الملاحظات"
        maxWidth="md"
      >
        <div className="space-y-4">
          {filterContent}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="md"
                className="w-full sm:w-auto min-h-[44px] justify-center"
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
              className="w-full sm:w-auto min-h-[44px] justify-center"
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
