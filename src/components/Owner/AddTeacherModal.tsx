'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, User, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTeacherModal({ isOpen, onClose, onSuccess }: AddTeacherModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'pending'>('active');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('يرجى ملء كافة الحقول المطلوبة');
      return;
    }
    if (password.length < 6) {
      toast.error('يجب أن تكون كلمة المرور 6 خانات على الأقل');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/owner/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');

      toast.success(data.message);
      setName('');
      setEmail('');
      setPassword('');
      setStatus('active');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 space-y-6 animate-in zoom-in-95 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">إضافة وتفعيل معلم جديد</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">إنشاء حساب المعلم وتعيين كلمة المرور وتفعيله فورياً</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المعلم الكامل</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أ. خالد بن فهد العتيبي"
                className={heroTheme.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">البريد الإلكتروني للمعلم</label>
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور الابتدائية</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={heroTheme.input}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">يستطيع المعلم تغييرها لاحقاً من إعدادات حسابه.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">حالة الحساب المبدئية</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition ${
                  status === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>مفعل فورياً (Active 🟢)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition ${
                  status === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>قيد المراجعة (Pending 🟡)</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className={heroTheme.button.primary + ' flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20'}
            >
              {loading ? 'جاري إنشاء الحساب...' : 'حفظ وإنشاء حساب المعلم'}
              {!loading && <CheckCircle2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={heroTheme.button.secondary + ' py-3.5'}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
