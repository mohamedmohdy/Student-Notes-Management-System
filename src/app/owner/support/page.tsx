'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import { OwnerTicketDetailsModal } from '@/components/Owner/OwnerTicketDetailsModal';
import { StatCard } from '@/components/UI/StatCard';
import { Badge } from '@/components/UI/Badge';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';

export default function OwnerSupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/owner/support?${params.toString()}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
      toast.error('تعذر جلب تذاكر الدعم الفني');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, search, toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const newCount = tickets.filter((t) => t.status === 'new').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <PageContainer>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              إدارة الدعم الفني والتذاكر
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {tickets.length} تذكرة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            استعراض تذاكر ومشاكل واستفسارات المعلمين ومتابعتها والرد عليها.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          className="p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center self-start"
          title="تحديث القائمة"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Ticket KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="إجمالي التذاكر"
          value={tickets.length}
          description="كافة الطلبات المسجلة"
          icon={LifeBuoy}
          color="indigo"
        />

        <StatCard
          title="تذاكر جديدة"
          value={newCount}
          description="تحتاج مراجعة"
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="قيد المعالجة"
          value={inProgressCount}
          description="جاري العمل عليها"
          icon={AlertCircle}
          color="cyan"
        />

        <StatCard
          title="تم حلها"
          value={resolvedCount}
          description="مغلقة بنجاح"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* 3. Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمعلم أو رقم التذكرة أو الموضوع..."
            className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          >
            <option value="all">كافة الحالات</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[44px] px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          >
            <option value="all">كافة الأنواع</option>
            {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Ticket List */}
      {loading ? (
        <LoadingSkeleton count={4} type="card" />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="لا توجد تذاكر دعم فني مطابقة"
          description="لا توجد تذاكر مسجلة حالياً بناءً على معايير البحث والتصفية المحددة."
          icon={<LifeBuoy className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const categoryKey = t.category as SupportTicketCategory;
            const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: t.category };
            const statusKey = t.status as SupportTicketStatus;
            const statusInfo = TICKET_STATUS_LABELS[statusKey] || { label: t.status };

            const statusBadgeVariant: 'warning' | 'success' | 'info' | 'neutral' =
              statusKey === 'new' ? 'warning' : statusKey === 'in_progress' ? 'info' : statusKey === 'resolved' || statusKey === 'closed' ? 'success' : 'neutral';

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-500/40 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/60 group-hover:scale-105 transition-transform">
                    <LifeBuoy className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                        {t.ticket_number}
                      </span>
                      <Badge variant={statusBadgeVariant} size="sm">
                        {statusInfo.label}
                      </Badge>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        • المعلم: {t.teacher_name || 'معلم'} ({categoryInfo.label})
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-md group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {t.subject}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-lg">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      {formatDateArabic(t.created_at)}
                    </span>
                    {t.admin_reply && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black inline-flex items-center gap-1 mt-0.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>تم الرد</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    <span>مراجعة</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Modal */}
      <OwnerTicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSuccess={loadTickets}
      />
    </PageContainer>
  );
}
