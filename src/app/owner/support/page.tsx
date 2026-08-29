'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { OwnerTicketDetailsModal } from '@/components/Owner/OwnerTicketDetailsModal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';
import { heroTheme } from '@/lib/heroui-theme';

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
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              🛟 إدارة الدعم الفني والتذاكر
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-800">
              {tickets.length} تذكرة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            استعراض تذاكر ومشاكل واستفسارات المعلمين ومتابعتها والرد عليها
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400">إجمالي التذاكر</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{tickets.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-amber-500">🟡 تذاكر جديدة</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{newCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-sky-500">🔵 قيد المراجعة</span>
          <p className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-emerald-500">🟢 تم الحل</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمعلم أو رقم التذكرة أو العنوان..."
            className={heroTheme.input}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">كافة الحالات</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">كافة الأنواع</option>
            {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Table / List */}
      {loading ? (
        <LoadingSkeleton count={4} type="table" />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="لا توجد تذاكر دعم فني مطابقة"
          description="لا توجد تذاكر مسجلة حالياً بناءً على معايير البحث والتصفية المحددة."
          icon={<LifeBuoy className="w-12 h-12" />}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="p-4">رقم التذكرة</th>
                  <th className="p-4">المعلم</th>
                  <th className="p-4">نوع المشكلة</th>
                  <th className="p-4">عنوان التذكرة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">تاريخ الإرسال</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {tickets.map((t) => {
                  const categoryKey = t.category as SupportTicketCategory;
                  const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: t.category };

                  const statusKey = t.status as SupportTicketStatus;
                  const statusInfo = TICKET_STATUS_LABELS[statusKey] || { label: t.status, badgeClass: 'bg-slate-100 text-slate-800' };

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">
                        {t.ticket_number}
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{t.teacher_name}</p>
                        <p className="text-[11px] text-slate-400">{t.teacher_email}</p>
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                        {categoryInfo.label}
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 max-w-xs truncate">{t.subject}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{t.description}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold whitespace-nowrap">
                        {formatDateArabic(t.created_at)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-xs font-black transition"
                        >
                          معاينة ورد 📝
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Owner Ticket Details & Reply Modal */}
      <OwnerTicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onSuccess={loadTickets}
      />
    </div>
  );
}
