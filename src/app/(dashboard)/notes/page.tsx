'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  NotesWorkspaceHeader,
  NotesSearch,
  NotesFilters,
  NoteTimeline,
  AddEditNoteModal,
} from '@/components/Notes';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Note, Grade, ClassRoom } from '@/lib/types';
import { FileText } from 'lucide-react';

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

      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedClass, selectedType, selectedPriority, requiresFollowUp]);

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
    <PageContainer>
      {/* 1. Header with Title and Primary Action */}
      <NotesWorkspaceHeader
        totalCount={notes.length}
        onOpenAddNote={() => setIsAddOpen(true)}
      />

      {/* 2. Search and Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <NotesSearch value={search} onChange={setSearch} />
        <NotesFilters
          grades={grades}
          classes={classes}
          selectedGrade={selectedGrade}
          onSelectGrade={setSelectedGrade}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          requiresFollowUp={requiresFollowUp}
          onSelectRequiresFollowUp={setRequiresFollowUp}
          onResetFilters={() => {
            setSelectedGrade('');
            setSelectedClass('');
            setSelectedType('');
            setSelectedPriority('');
            setRequiresFollowUp('');
            setSearch('');
          }}
        />
      </div>

      {/* 3. Notes Content */}
      {loading ? (
        <LoadingSkeleton count={4} type="card" />
      ) : notes.length === 0 ? (
        <EmptyState
          title="لم يتم العثور على أي ملاحظات مطابقة"
          description="جرب تخفيف شروط الفلترة أو تسجيل ملاحظة جديدة للطلاب."
          actionLabel="+ تدوين ملاحظة"
          onAction={() => setIsAddOpen(true)}
          icon={<FileText className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-4">
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
    </PageContainer>
  );
}
