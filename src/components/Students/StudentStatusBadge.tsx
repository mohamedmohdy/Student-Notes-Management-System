import React from 'react';
import { StudentStatus } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const s = STUDENT_STATUS_LABELS[status] || STUDENT_STATUS_LABELS.normal;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
}
