'use client';

import React from 'react';
import { Badge } from '../UI/Badge';
import { UserStatus } from '@/lib/types';
import { CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export function TeacherStatusBadge({ status }: { status: UserStatus }) {
  const statusMap: Record<UserStatus, { variant: 'success' | 'warning' | 'danger'; label: string; icon: React.ReactNode }> = {
    active: { variant: 'success', label: 'نشط', icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" /> },
    pending: { variant: 'warning', label: 'في انتظار التفعيل', icon: <Clock className="w-3 h-3 text-amber-600" /> },
    disabled: { variant: 'danger', label: 'موقوف', icon: <ShieldAlert className="w-3 h-3 text-rose-600" /> },
  };

  const current = statusMap[status] || { variant: 'warning', label: status, icon: null };

  return (
    <Badge variant={current.variant} size="sm" icon={current.icon}>
      {current.label}
    </Badge>
  );
}
