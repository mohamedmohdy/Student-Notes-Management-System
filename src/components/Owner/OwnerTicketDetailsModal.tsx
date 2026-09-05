'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  X,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
} from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic, TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '@/lib/utils';
import { SupportTicket, SupportTicketCategory, SupportTicketStatus } from '@/lib/types';
import { heroTheme } from '@/lib/heroui-theme';

interface OwnerTicketDetailsModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OwnerTicketDetailsModal({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}: OwnerTicketDetailsModalProps) {
  const toast = useToast();
  const [status, setStatus] = useState<SupportTicketStatus>(ticket?.status || 'new');
  const [adminReply, setAdminReply] = useState<string>(ticket?.admin_reply || '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setAdminReply(ticket.admin_reply || '');
    }
  }, [ticket]);

  if (!isOpen || !ticket) return null;

  const categoryKey = ticket.category as SupportTicketCategory;
  const categoryInfo = TICKET_CATEGORY_LABELS[categoryKey] || { label: ticket.category, icon: 'HelpCircle' };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/owner/support/${ticket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_reply: adminReply.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث التذكرة');

      toast.success('تم تحديث التذكرة بنجاح وإرسال الإشعار للمعلم');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                  {ticket.ticket_number}
                </span>
                <span className="text-[11px] font-extrabold text-slate-500">
                  • من: {ticket.teacher_name} ({ticket.teacher_email})
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black truncate max-w-md mt-0.5">{ticket.subject}</h3>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata & Status Changer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 font-bold block">نوع المشكلة:</span>
              <span className="font-black text-slate-800 dark:text-slate-200 mt-0.5 block">{categoryInfo.label}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 font-bold block">تاريخ الإرسال:</span>
              <span className="font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                {formatDateArabic(ticket.created_at)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="text-slate-400 font-bold block">تعديل حالة التذكرة:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SupportTicketStatus)}
                className="mt-1 w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 block">وصف المشكلة:</span>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          {/* Screenshot */}
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

          {/* Admin Reply Input */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>رد / ملاحظة إدارة المنصة (تصل للمعلم في حسابه):</span>
            </label>
            <textarea
              rows={4}
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
              placeholder="اكتب ردك وملاحظاتك التوضيحية للمعلم هنا..."
              className={heroTheme.input}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-medium text-center sm:text-right">
            يتم إرسال الرد والإشعار للمعلم فور الحفظ
          </span>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition flex items-center justify-center"
            >
              إلغاء
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات والرد'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
