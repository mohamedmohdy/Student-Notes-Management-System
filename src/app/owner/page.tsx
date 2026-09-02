'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  GraduationCap,
  CreditCard,
  ChevronLeft,
} from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  OwnerDashboardHeader,
  TeacherStatusBadge,
  AddTeacherModal,
} from '@/components/Owner';
import { StatCard } from '@/components/UI/StatCard';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { OwnerStats, User } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { Button } from '@/components/UI/Button';

export default function OwnerOverviewPage() {
  const toast = useToast();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإحصائيات');
      setStats(data.stats);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleActivate = async (teacherId: string) => {
    setUpdatingId(teacherId);
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'تم تفعيل الحساب بنجاح');
      fetchStats();
    } catch (e: any) {
      toast.error(e.message || 'فشل التفعيل');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header with Title and Primary Actions */}
      <OwnerDashboardHeader onOpenAddTeacher={() => setIsAddModalOpen(true)} />

      {loading && !stats ? (
        <LoadingSkeleton count={3} type="card" />
      ) : stats ? (
        <div className="space-y-6">
          {/* 2. KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              title="إجمالي المعلمين"
              value={stats.totalTeachers}
              description="حسابات مسجلة"
              icon={Users}
              color="indigo"
            />

            <StatCard
              title="الحسابات النشطة"
              value={stats.activeTeachers}
              description="تفعيل دائم"
              icon={UserCheck}
              color="emerald"
            />

            <StatCard
              title="قيد المراجعة"
              value={stats.pendingTeachers}
              description="بانتظار التفعيل"
              icon={Clock}
              color="amber"
            />

            <StatCard
              title="المعطلة"
              value={stats.disabledTeachers}
              description="بياناتها محفوظة"
              icon={ShieldAlert}
              color="rose"
            />

            <StatCard
              title="إجمالي الطلاب"
              value={stats.totalStudents}
              description="في كافة الصفوف"
              icon={GraduationCap}
              color="cyan"
            />

            <StatCard
              title="الإيرادات"
              value={`${stats.totalRevenue} ر.س`}
              description="المعاملات المؤكدة"
              icon={CreditCard}
              color="purple"
            />
          </div>

          {/* 3. Recent Teachers Section */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  أحدث المعلمين المسجلين
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  مراجعة الحسابات الجديدة وتفعيلها بنقرة واحدة
                </p>
              </div>

              <Link
                href="/owner/teachers"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                <span>كافة المعلمين</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recentTeachers?.map((t) => (
                <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center justify-center border border-amber-100 dark:border-amber-900/60 shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm block">
                        {t.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        {t.email} • {formatDateArabic(t.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <TeacherStatusBadge status={t.status} />

                    {t.status === 'pending' && (
                      <Button
                        onClick={() => handleActivate(t.id)}
                        disabled={updatingId === t.id}
                        variant="primary"
                        size="sm"
                      >
                        {updatingId === t.id ? 'جاري التفعيل...' : 'تفعيل الحساب'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchStats}
      />
    </PageContainer>
  );
}
