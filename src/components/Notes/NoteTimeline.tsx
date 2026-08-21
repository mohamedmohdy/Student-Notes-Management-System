'use client';

import React from 'react';
import { Note } from '@/lib/types';
import { NoteCard } from './NoteCard';
import { EmptyState } from '../UI/EmptyState';
import { FileText } from 'lucide-react';

interface NoteTimelineProps {
  notes: Note[];
  onEditNote?: (note: Note) => void;
  onArchiveSuccess?: () => void;
  onResolveFollowUp?: (note: Note) => void;
  onAddNewNote?: () => void;
}

export function NoteTimeline({
  notes,
  onEditNote,
  onArchiveSuccess,
  onResolveFollowUp,
  onAddNewNote,
}: NoteTimelineProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        title="لا توجد ملاحظات مسجلة حتى الآن"
        description="ابدأ بإضافة أول ملاحظة سلوكية أو أكاديمية أو مهارية لهذا الطالب لبدء بناء سجله الإلكتروني."
        actionLabel={onAddNewNote ? "+ إضافة أول ملاحظة" : undefined}
        onAction={onAddNewNote}
        icon={<FileText className="w-10 h-10" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote}
          onArchiveSuccess={onArchiveSuccess}
          onResolveFollowUp={onResolveFollowUp}
        />
      ))}
    </div>
  );
}
