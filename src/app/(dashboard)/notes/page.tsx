'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Filter, Plus, Calendar } from 'lucide-react';
import { Note, Grade, ClassRoom, NoteType, NotePriority } from '@/lib/types';
import { NoteTimeline } from '@/components/Notes/NoteTimeline';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS } from '@/lib/utils';

export default function AllNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const loadInitialOptions = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.all([fetch('/api/grades'), fetch('/api/classes')]);
      const [gData, cData] = await Promise.all([gRes.json(), cRes.json()]);
      setGrades(gData.grades || []);
      setClasses(cData.classes || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedGrade) params.set('gradeId', selectedGrade);
      if (selectedClass) params.set('classId', selectedClass);
      if (selectedType) params.set('type', selectedType);
      if (selectedPriority) params.set('priority', selectedPriority);
      if (requiresFollowUp !== '') params.set('requiresFollowUp', requiresFollowUp);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedClass, selectedType, selectedPriority, requiresFollowUp, startDate, endDate]);

  useEffect(() => {
    loadInitialOptions();
  }, [loadInitialOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadNotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">سجل الملاحظات العام</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            استعراض وفلترة جميع الملاحظات المسجلة للطلاب بمختلف المعايير
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة ملاحظة جديدة</span>
        </button>
      </div>

      {/* Advanced Filter Box */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في نص الملاحظة أو اسم الطالب..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Grade */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClass('');
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الصفوف الدراسية</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الفصول</option>
              {classes
                .filter((c) => !selectedGrade || c.grade_id === selectedGrade)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.grade_name} - {c.name}</option>
                ))}
            </select>
          </div>

          {/* Note Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة أنواع الملاحظات</option>
              {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row Filters: Priority, Followup, Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">كافة الأولويات</option>
              {Object.entries(NOTE_PRIORITY_LABELS).map(([key, val]) => (
                <option key={key} value={key}>أولوية: {val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={requiresFollowUp}
              onChange={(e) => setRequiresFollowUp(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">حالة المتابعة (الكل)</option>
              <option value="true">تحتاج متابعة فقط</option>
              <option value="false">لا تحتاج متابعة</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              placeholder="من تاريخ"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              placeholder="إلى تاريخ"
            />
          </div>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <LoadingSkeleton count={4} type="card" />
      ) : notes.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أي ملاحظات مطابقة"
          description="جرب تخفيف شروط الفلترة أو تسجيل ملاحظة جديدة."
          actionLabel="+ إضافة ملاحظة"
          onAction={() => setIsAddOpen(true)}
          icon={<FileText className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500">تم العثور على {notes.length} ملاحظة مسجلة</p>
          <NoteTimeline
            notes={notes}
            onEditNote={(note) => setEditingNote(note)}
            onArchiveSuccess={loadNotes}
            onAddNewNote={() => setIsAddOpen(true)}
          />
        </div>
      )}

      {/* Modals */}
      <AddEditNoteModal
        isOpen={isAddOpen || !!editingNote}
        onClose={() => {
          setIsAddOpen(false);
          setEditingNote(null);
        }}
        onSuccess={loadNotes}
        initialNote={editingNote}
      />
    </div>
  );
}
