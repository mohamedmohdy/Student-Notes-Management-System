'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Clock,
  ShieldAlert,
  GraduationCap,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { OwnerStats, User } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { AddTeacherModal } from '@/components/Owner/AddTeacherModal';

export default function OwnerOverviewPage() {
  const toast = useToast();
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/owner/stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل جلب الإحصائيات');
      setStats(data.stats);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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

      toast.success(data.message);
      fetchStats();
    } catch (e: any) {
      toast.error(e.message || 'فشل التفعيل');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !stats) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">جاري تحميل إحصائيات المالك...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white shadow-xl shadow-amber-950/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة التحكم المركزية لمالك المنصة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              إدارة وتفعيل حسابات المعلمين 👑
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 font-semibold max-w-2xl">
              إضافة المعلمين يدوياً وإدارتهم وتفعيل الحسابات بنقرة واحدة (50 ريال سعودي لمرة واحدة لكل معلم).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 bg-white hover:bg-amber-50 text-amber-950 rounded-2xl text-xs font-black shadow-lg transition active:scale-95 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>➕ إضافة معلم جديد</span>
            </button>

            <Link
              href="/owner/teachers"
              className="px-4 py-3 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-200" />
              <span>قائمة المعلمين</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Hero KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Teachers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المعلمين</span>
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalTeachers}</p>
          <span className="text-[10px] text-slate-400 font-semibold">حسابات مسجلة</span>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 shadow-xs space-y-2 bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">الحسابات النشطة 🟢</span>
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.activeTeachers}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">تفعيل دائم</span>
        </div>

        {/* Pending Accounts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 shadow-xs space-y-2 bg-amber-50/20 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">قيد المراجعة 🟡</span>
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.pendingTeachers}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">بانتظار التفعيل</span>
        </div>

        {/* Disabled Accounts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-2 bg-rose-50/20 dark:bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">المعطلة 🔴</span>
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{stats.disabledTeachers}</p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">بياناتها محفوظة</span>
        </div>

        {/* Total Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الطلاب</span>
            <GraduationCap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalStudents}</p>
          <span className="text-[10px] text-slate-400 font-semibold">في كافة الفصول</span>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-900/50 shadow-xs space-y-2 bg-purple-50/20 dark:bg-purple-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">الإيرادات (50 ر.س)</span>
            <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{stats.totalRevenue} <span className="text-xs font-bold">ر.س</span></p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">دفعة واحدة</span>
        </div>
      </div>

      {/* Quick Pending Activation Requests Section */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>الحسابات قيد المراجعة والتفعيل (Pending Accounts)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              المعلمون الذين تم إدراجهم وينتظرون تأكيد تفعيل الحساب
            </p>
          </div>

          <Link
            href="/owner/teachers?status=pending"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentTeachers.filter((t) => t.status === 'pending').length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.recentTeachers
              .filter((t) => t.status === 'pending')
              .map((teacher) => (
                <div
                  key={teacher.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center shrink-0 text-sm">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{teacher.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{teacher.email}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        تاريخ التسجيل: {formatDateArabic(teacher.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      🟡 قيد التفعيل
                    </span>
                    <button
                      onClick={() => handleActivate(teacher.id)}
                      disabled={updatingId === teacher.id}
                      className={heroTheme.button.success + ' text-xs py-2 px-4 shadow-sm'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{updatingId === teacher.id ? 'جاري التفعيل...' : 'تفعيل الحساب (Activate) 🟢'}</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">لا توجد طلبات تفعيل معلقة حالياً</p>
            <p className="text-[11px] text-slate-400">كافة المعلمين المسجلين مفعلين بالكامل</p>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
