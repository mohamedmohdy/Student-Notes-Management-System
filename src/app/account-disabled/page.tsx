'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut } from 'lucide-react';
import { AuthShell, AuthBrand } from '@/components/Auth';
import { Button } from '@/components/UI/Button';

export default function AccountDisabledPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <AuthShell>
      {/* Header */}
      <AuthBrand
        title="الحساب معطل مؤقتاً"
        subtitle="تم إيقاف الحساب من قِبل إدارة المنصة، علماً بأن كافة سجلاتك وبياناتك محفوظة بأمان."
        icon={<ShieldAlert className="w-7 h-7 text-rose-300" />}
      />

      {/* Info message */}
      <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-300 font-semibold text-center leading-relaxed">
        لإعادة تفعيل الحساب، يرجى التواصل مع مالك المنصة أو الدعم الفني.
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <Button
          onClick={handleLogout}
          variant="danger"
          size="lg"
          className="w-full"
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          تسجيل الخروج
        </Button>
      </div>
    </AuthShell>
  );
}
