'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Calendar, FileText, Sparkles } from 'lucide-react';
import { ClassNote, ClassNoteType } from '@/lib/types';
import { AddEditClassNoteModal } from './AddEditClassNoteModal';
import { ClassNoteTimeline } from './ClassNoteTimeline';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { CLASS_NOTE_TYPE_LABELS } from '@/lib/utils';
import { heroTheme } from '@/lib/heroui-theme';

interface ClassNotesTabProps {
  classId: string;
  className: string;
  gradeName?: string;
}

export function ClassNotesTab({ classId, className, gradeName }: ClassNotesTabProps) {
  const [classNotes, setClassNotes] = useState<ClassNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<ClassNote | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('classId', classId);
      if (search) params.set('search', search);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/class-notes?${params.toString()}`);
      const data = await res.json();
      setClassNotes(Array.isArray(data.classNotes) ? data.classNotes : []);
    } catch (err) {
      console.error(err);
      setClassNotes([]);
    } finally {
      setLoading(false);
    }
  }, [classId, search, typeFilter, startDate, endDate]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <div className="space-y-6">
      {/* Tab Actions Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>سجل ملاحظات فصل: {className}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            توثيق الملاحظات العامة ومستوى انضباط وتفاعل الفصل ككل
          </p>
        </div>

        <button
          onClick={() => {
            setEditingNote(null);
            setIsAddOpen(true);
          }}
          className={heroTheme.button.primary}
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة ملاحظة للفصل</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في ملاحظات الفصل..."
            className={heroTheme.input}
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">كافة أنواع الملاحظات</option>
            {(Object.entries(CLASS_NOTE_TYPE_LABELS) as [ClassNoteType, typeof CLASS_NOTE_TYPE_LABELS[ClassNoteType]][]).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="من تاريخ"
            className={heroTheme.input}
          />
        </div>

        {/* End Date */}
        <div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="إلى تاريخ"
            className={heroTheme.input}
          />
        </div>
      </div>

      {/* Timeline View */}
      {loading ? (
        <LoadingSkeleton count={4} type="card" />
      ) : classNotes.length === 0 ? (
        <EmptyState
          title="لا توجد ملاحظات مسجلة لهذا الفصل"
          description="سجل أول ملاحظة عامة لتوثيق سلوك وتفاعل وانضباط هذا الفصل بمرور الوقت."
          actionLabel="+ إضافة أول ملاحظة للفصل"
          onAction={() => {
            setEditingNote(null);
            setIsAddOpen(true);
          }}
          icon={<FileText className="w-10 h-10" />}
        />
      ) : (
        <ClassNoteTimeline
          classNotes={classNotes}
          onEdit={(note) => {
            setEditingNote(note);
            setIsAddOpen(true);
          }}
          onRefresh={loadNotes}
        />
      )}

      {/* Add / Edit Modal */}
      <AddEditClassNoteModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingNote(null);
        }}
        onSuccess={loadNotes}
        classId={classId}
        className={className}
        gradeName={gradeName}
        initialNote={editingNote}
      />
    </div>
  );
}
