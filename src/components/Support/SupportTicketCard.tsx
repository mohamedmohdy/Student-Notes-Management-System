'use client';

import React from 'react';
import { LifeBuoy, MessageSquare, ChevronLeft } from 'lucide-react';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { Badge } from '../UI/Badge';

export interface SupportTicketCardProps {
  ticket: SupportTicket;
  onClick: () => void;
}

export function SupportTicketCard({ ticket, onClick }: SupportTicketCardProps) {
  const categoryKey = ticket.category as SupportTicketCategory;
  const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: ticket.category, icon: 'HelpCircle' };

  const statusKey = ticket.status as SupportTicketStatus;
  const statusInfo = TICKET_STATUS_LABELS[statusKey] || { label: ticket.status, badgeClass: 'bg-slate-100 text-slate-800' };

  const statusBadgeVariant: 'warning' | 'success' | 'info' | 'neutral' =
    statusKey === 'new' ? 'warning' : statusKey === 'in_progress' ? 'info' : statusKey === 'resolved' || statusKey === 'closed' ? 'success' : 'neutral';

  return (
    <div
      onClick={onClick}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/60 group-hover:scale-105 transition-transform">
          <LifeBuoy className="w-5 h-5" />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
              {ticket.ticket_number}
            </span>
            <Badge variant={statusBadgeVariant} size="sm">
              {statusInfo.label}
            </Badge>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              • {categoryInfo.label}
            </span>
          </div>

          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-md group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {ticket.subject}
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-lg">
            {ticket.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
        <div className="text-right">
          <span className="text-[11px] text-slate-400 font-semibold block">
            {formatDateArabic(ticket.created_at)}
          </span>
          {ticket.admin_reply && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black inline-flex items-center gap-1 mt-0.5">
              <MessageSquare className="w-3 h-3" />
              <span>يوجد رد إداري</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
          <span>التفاصيل</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
