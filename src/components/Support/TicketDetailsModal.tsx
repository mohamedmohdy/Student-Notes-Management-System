'use client';

import React from 'react';
import { LifeBuoy, X, Calendar, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';

interface TicketDetailsModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  if (!isOpen || !ticket) return null;

  const categoryKey = ticket.category as SupportTicketCategory;
  const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: ticket.category, icon: 'HelpCircle' };

  const statusKey = ticket.status as SupportTicketStatus;
  const statusInfo = TICKET_STATUS_LABELS[statusKey] || { label: ticket.status, badgeClass: 'bg-slate-100 text-slate-800' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                  {ticket.ticket_number}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${statusInfo.badgeClass}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black truncate max-w-xs sm:max-w-sm mt-0.5">{ticket.subject}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 font-bold block">نوع المشكلة:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{categoryInfo.label}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 font-bold block">تاريخ الإرسال:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {formatDateArabic(ticket.created_at)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">وصف المشكلة:</span>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Screenshot if available */}
          {ticket.attachment_url && (
            <div className="space-y-1.5">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">لقطة الشاشة المرفقة:</span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={ticket.attachment_url}
                  alt="مرفق التذكرة"
                  className="w-full max-h-64 object-contain bg-slate-950"
                />
              </div>
            </div>
          )}

          {/* Admin Reply Section */}
          {ticket.admin_reply ? (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-black text-xs">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>رد إدارة المنصة:</span>
                </div>
                {ticket.admin_replied_at && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formatDateArabic(ticket.admin_replied_at)}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap">
                {ticket.admin_reply}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300 font-semibold">
              <Clock className="w-4 h-4 shrink-0 text-amber-500" />
              <span>طلبك قيد المراجعة والمتابعة من قِبل فريق الإدارة وسنقوم بالرد عليك قريباً.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
