'use client';

import React from 'react';
import { Badge } from '../UI/Badge';
import { NotePriority } from '@/lib/types';
import { NOTE_PRIORITY_LABELS } from '@/lib/utils';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export function NotePriorityBadge({ priority }: { priority: NotePriority }) {
  const map: Record<NotePriority, { variant: 'danger' | 'warning' | 'neutral'; label: string; icon: React.ReactNode }> = {
    high: { variant: 'danger', label: 'أولوية عالية', icon: <AlertCircle className="w-3 h-3 text-rose-600" /> },
    medium: { variant: 'warning', label: 'أولوية متوسطة', icon: <AlertTriangle className="w-3 h-3 text-amber-600" /> },
    low: { variant: 'neutral', label: 'أولوية عادية', icon: <ShieldCheck className="w-3 h-3 text-slate-400" /> },
  };

  const current = map[priority] || {
    variant: 'neutral',
    label: NOTE_PRIORITY_LABELS[priority]?.label || priority,
    icon: null,
  };

  return (
    <Badge variant={current.variant} size="sm" icon={current.icon}>
      {current.label}
    </Badge>
  );
}
