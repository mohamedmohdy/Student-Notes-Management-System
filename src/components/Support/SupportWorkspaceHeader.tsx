'use client';

import React from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { Button } from '../UI/Button';

export interface SupportWorkspaceHeaderProps {
  onOpenAddTicket: () => void;
}

export function SupportWorkspaceHeader({ onOpenAddTicket }: SupportWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            مركز الدعم الفني والمساعدة
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          واجهت أي استفسار أو مشكلة؟ أنشئ تذكرة دعم وسنقوم بمتابعتها وحلها معك.
        </p>
      </div>

      <Button
        onClick={onOpenAddTicket}
        variant="primary"
        size="md"
        leftIcon={<Plus className="w-4 h-4" />}
      >
        فتح تذكرة دعم جديدة
      </Button>
    </div>
  );
}
