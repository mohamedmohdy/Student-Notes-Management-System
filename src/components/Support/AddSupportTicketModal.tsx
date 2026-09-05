'use client';

import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  X,
  Send,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Bug,
  Lock,
  Users,
  BarChart3,
  Bot,
  Lightbulb,
  Wrench,
} from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { TICKET_CATEGORY_LABELS } from '@/lib/utils';
import { SupportTicketCategory } from '@/lib/types';

interface AddSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function AddSupportTicketModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: AddSupportTicketModalProps) {
  const toast = useToast();
  const [category, setCategory] = useState<SupportTicketCategory>('technical');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCategory('technical');
      setSubject('');
      setDescription('');
      setAttachmentBase64(null);
      setAttachmentName(null);
      setSubmittedTicket(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الصورة هو 5 ميجابايت');
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error('يرجى كتابة عنوان للتذكرة');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('يرجى كتابة وصف تفصيلي للمشكلة (10 أحرف على الأقل)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          description: description.trim(),
          attachment_url: attachmentBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إرسال التذكرة');

      setSubmittedTicket(data.ticket);
      toast.success('تم إرسال طلب الدعم بنجاح!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إرسال التذكرة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/70 via-transparent to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black">إنشاء تذكرة دعم فني جديدة</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                نحن هنا لمساعدتك 🤝 سيتم مراجعة طلبك والرد عليك فورياً
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {submittedTicket ? (
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ✅ تم إرسال طلب الدعم بنجاح
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                شكرًا لتواصلك معنا. تم استلام طلبك وسيتم مراجعته ومتابعته معك من إدارة المنصة في أقرب وقت.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 inline-block">
              <span className="text-xs font-bold text-slate-400 block">رقم التذكرة الخاص بك:</span>
              <span className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                {submittedTicket.ticket_number}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              نحن هنا لمساعدتك دائمًا 🤝
            </p>

            <button
              onClick={onClose}
              className="w-full py-3.5 min-h-[44px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition active:scale-98 flex items-center justify-center"
            >
              العودة إلى المنصة
            </button>
          </div>
        ) : (
          /* Ticket Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Auto-filled Teacher Info Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs font-bold">
              <div className="space-y-0.5">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 block font-black">بيانات مقدم التذكرة:</span>
                <span className="text-slate-800 dark:text-slate-200">{user?.name || 'المعلم'} ({user?.email})</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-black">
                تلقائي
              </span>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                نوع المشكلة أو الاستفسار *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                className={heroTheme.input}
              >
                {Object.entries(TICKET_CATEGORY_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                عنوان التذكرة / المشكلة *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: لا أستطيع إضافة طالب جديد أو استيراد ملف Excel..."
                className={heroTheme.input}
                required
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                وصف المشكلة بالتفصيل *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح المشكلة بالتفصيل لمساعدتنا في تشخيصها وحلها بأسرع وقت..."
                className={heroTheme.input}
                required
              />
            </div>

            {/* Attachment / Screenshot Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                إرفاق لقطة شاشة للمشكلة (اختياري)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition border border-slate-200 dark:border-slate-700">
                  <Paperclip className="w-4 h-4 text-indigo-500" />
                  <span>{attachmentName ? 'تغيير الصورة' : 'اختر صورة من جهازك'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {attachmentName && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                    ✓ {attachmentName}
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition flex items-center justify-center"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'جاري الإرسال...' : '📨 إرسال التذكرة'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
