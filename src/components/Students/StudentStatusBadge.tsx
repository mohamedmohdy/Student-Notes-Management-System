'use client';

import React from 'react';
import { Badge } from '../UI/Badge';
import { StudentStatus } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const statusMap: Record<StudentStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary'; label: string }> = {
    excellent: { variant: 'success', label: 'متميز' },
    normal: { variant: 'primary', label: 'عادي' },
    needs_followup: { variant: 'danger', label: 'يحتاج متابعة' },
  };

  const current = statusMap[status] || { variant: 'neutral', label: STUDENT_STATUS_LABELS[status]?.label || status };

  return (
    <Badge variant={current.variant} size="sm">
      {current.label}
    </Badge>
  );
}
