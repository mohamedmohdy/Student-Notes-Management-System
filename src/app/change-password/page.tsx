'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, CheckCircle2, LogOut } from 'lucide-react';
import { AuthShell, AuthBrand, PasswordInput } from '@/components/Auth';
import { Button } from '@/components/UI/Button';
import { useToast } from '@/components/UI/Toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');

      toast.success(data.message || 'تم تحديث كلمة المرور بنجاح');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AuthShell>
      {/* Header */}
      <AuthBrand
        title="تعيين كلمة المرور الدائمة"
        subtitle="تم تسجيل دخولك بكلمة مرور مؤقتة، يرجى إنشاء كلمة مرور خاصة بك للمتابعة."
        icon={<KeyRound className="w-7 h-7" />}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordInput
          id="new-password"
          label="كلمة المرور الجديدة"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
        />

        <PasswordInput
          id="confirm-password"
          label="تأكيد كلمة المرور الجديدة"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {loading ? 'جاري الحفظ والتفعيل...' : 'حفظ كلمة المرور والدخول'}
          </Button>
        </div>
      </form>

      {/* Logout option */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج والعودة لاحقاً</span>
        </button>
      </div>
    </AuthShell>
  );
}
