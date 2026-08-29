'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { AddSupportTicketModal } from '@/components/Support/AddSupportTicketModal';
import { TicketDetailsModal } from '@/components/Support/TicketDetailsModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';
import { heroTheme } from '@/lib/heroui-theme';

export default function TeacherSupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const [ticketsRes, userRes] = await Promise.all([
        fetch('/api/support/tickets'),
        fetch('/api/auth/me'),
      ]);
      const tData = await ticketsRes.json();
      const uData = await userRes.json();

      setTickets(tData.tickets || []);
      setUser(uData.user);
    } catch (err) {
      console.error(err);
      toast.error('تعذر جلب تذاكر الدعم الفني');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome & Trust Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black">
              <HeartHandshake className="w-4 h-4 text-amber-300" />
              <span>نحن هنا لمساعدتك 🤝</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              مركز الدعم الفني والمساعدة
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-medium">
              واجهت أي مشكلة أو لديك استفسار أو اقتراح؟ أرسل لنا تذكرة وسنقوم بمتابعتها وحلها معك خطوة بخطوة. اقتراحك يهمنا ويساعدنا على تطوير المنصة.
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-black/10 transition active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>+ إنشاء تذكرة دعم جديدة</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Tickets List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              📋
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تذاكري المسجلة ({tickets.length})
              </h3>
              <p className="text-xs text-slate-400 font-semibold">متابعة حالة التذاكر والردود الواردة من إدارة المنصة</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            + تذكرة جديدة
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="table" />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="لا توجد تذاكر دعم فني مسجلة حالياً"
            description="إذا واجهت أي استفسار أو مشكلة في المنصة، اضغط أدناه لإنشاء أول تذكرة دعم وسنكون سعداء بمساعدتك."
            actionLabel="+ إنشاء تذكرة دعم الآن"
            onAction={() => setIsAddOpen(true)}
            icon={<LifeBuoy className="w-12 h-12" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {tickets.map((ticket) => {
              const categoryKey = ticket.category as SupportTicketCategory;
              const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: ticket.category, icon: 'HelpCircle' };

              const statusKey = ticket.status as SupportTicketStatus;
              const statusInfo = TICKET_STATUS_LABELS[statusKey] || { label: ticket.status, badgeClass: 'bg-slate-100 text-slate-800' };

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      <LifeBuoy className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {ticket.ticket_number}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          • {categoryInfo.label}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-md group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {ticket.subject}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-lg">
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
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

                    <button className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-extrabold group-hover:bg-indigo-600 group-hover:text-white transition">
                      التفاصيل ←
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Ticket Modal */}
      <AddSupportTicketModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadTickets}
        user={user}
      />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
