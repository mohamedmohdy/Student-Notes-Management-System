'use client';

import React from 'react';
import { Badge } from '../UI/Badge';
import { FollowUpStatus } from '@/lib/types';
import { FOLLOWUP_STATUS_LABELS } from '@/lib/utils';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  const map: Record<FollowUpStatus, { variant: 'warning' | 'success' | 'danger'; label: string; icon: React.ReactNode }> = {
    pending: { variant: 'warning', label: 'قيد الانتظار', icon: <Clock className="w-3 h-3 text-amber-600" /> },
    completed: { variant: 'success', label: 'تمت المتابعة', icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" /> },
    still_needs_followup: { variant: 'danger', label: 'ما زالت تحتاج متابعة', icon: <AlertTriangle className="w-3 h-3 text-rose-600" /> },
  };

  const current = map[status] || {
    variant: 'warning',
    label: FOLLOWUP_STATUS_LABELS[status]?.label || status,
    icon: null,
  };

  return (
    <Badge variant={current.variant} size="sm" icon={current.icon}>
      {current.label}
    </Badge>
  );
}
