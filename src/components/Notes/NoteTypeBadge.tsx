'use client';

import React from 'react';
import { Badge } from '../UI/Badge';
import { NoteType } from '@/lib/types';
import { NOTE_TYPE_LABELS } from '@/lib/utils';

export function NoteTypeBadge({ type }: { type: NoteType }) {
  const map: Record<NoteType, { variant: 'success' | 'danger' | 'info' | 'primary' | 'neutral' | 'warning'; label: string }> = {
    positive: { variant: 'success', label: 'ملاحظة إيجابية' },
    behavioral: { variant: 'danger', label: 'ملاحظة سلوكية' },
    academic: { variant: 'info', label: 'ملاحظة أكاديمية' },
    participation: { variant: 'primary', label: 'مشاركة وتفاعل' },
    skill: { variant: 'primary', label: 'تطوير مهارة' },
    needs_followup: { variant: 'warning', label: 'تحتاج متابعة' },
    other: { variant: 'neutral', label: 'أخرى' },
  };

  const current = map[type] || {
    variant: 'neutral',
    label: NOTE_TYPE_LABELS[type]?.label || type,
  };

  return (
    <Badge variant={current.variant} size="sm">
      {current.label}
    </Badge>
  );
}
