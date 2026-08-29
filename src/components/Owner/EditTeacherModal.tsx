'use client';

import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { UserCheck, X, Mail, User as UserIcon } from 'lucide-react';

interface EditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: User | null;
  onSuccess: () => void;
}

export function EditTeacherModal({ isOpen, onClose, teacher, onSuccess }: EditTeacherModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name || '');
      setEmail(teacher.email || '');
      setStatus(teacher.status || 'active');
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/owner/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث البيانات');

      toast.success(data.message || 'تم تحديث بيانات المعلم بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base">تعديل بيانات المعلم</h3>
              <p className="text-xs text-slate-400">تحديث الاسم والبريد وحالة التفعيل</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المعلم الكامل *
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم المعلم..."
                className={heroTheme.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              البريد الإلكتروني *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className={heroTheme.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              حالة الحساب
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className={heroTheme.input}
            >
              <option value="active">🟢 مفعل دائم (Active)</option>
              <option value="pending">🟡 قيد المراجعة (Pending)</option>
              <option value="disabled">🔴 معطل (Disabled)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className={heroTheme.button.primary + ' flex-1 py-3'}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={heroTheme.button.secondary + ' py-3'}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
