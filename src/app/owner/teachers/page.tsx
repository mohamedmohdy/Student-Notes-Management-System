'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  X,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  TeacherCard,
  AddTeacherModal,
  EditTeacherModal,
  DeleteTeacherModal,
} from '@/components/Owner';
import { Modal } from '@/components/UI/Modal';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Button } from '@/components/UI/Button';
import { User, UserStatus } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';

export default function TeachersManagementPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'disabled'>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<User | null>(null);

  // Change / Reset Password Modal State
  const [passwordModalTeacher, setPasswordModalTeacher] = useState<User | null>(null);
  const [isDirectChange, setIsDirectChange] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/owner/teachers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTeachers(data.teachers || []);
    } catch (e: any) {
      toast.error(e.message || 'فشل جلب المعلمين');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, toast]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleUpdateStatus = async (teacher: User, newStatus: UserStatus) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/owner/teachers/${teacher.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'تم تحديث الحالة بنجاح');
      fetchTeachers();
    } catch (e: any) {
      toast.error(e.message || 'فشل تحديث الحالة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteChangePassword = async () => {
    if (!passwordModalTeacher) return;
    
    if (isDirectChange && (!newPassword.trim() || newPassword.trim().length < 6)) {
      toast.error('يجب أن تكون كلمة المرور 6 خانات على الأقل');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/owner/teachers/${passwordModalTeacher.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPassword: newPassword.trim() || undefined,
          isDirectChange,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تعيين كلمة المرور');

      setGeneratedPassword(data.tempPassword);
      toast.success(data.message || 'تم تحديث كلمة المرور بنجاح');
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPassword = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success('تم نسخ كلمة المرور إلى الحافظة');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClosePasswordModal = () => {
    setPasswordModalTeacher(null);
    setGeneratedPassword(null);
    setNewPassword('');
    setIsDirectChange(true);
    setCopied(false);
  };

  return (
    <PageContainer>
      {/* 1. Header with Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              إدارة المعلمين وتفعيل الحسابات
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {teachers.length} معلم
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            إضافة المعلمين، تعديل البيانات، تغيير كلمات المرور، تفعيل أو تعطيل الحسابات والحذف الآمن.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            إضافة معلم جديد
          </Button>

          <button
            type="button"
            onClick={fetchTeachers}
            className="p-2.5 min-h-[44px] min-w-[44px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المعلم أو البريد الإلكتروني..."
            className="w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">الحالة:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none transition"
          >
            <option value="all">كافة الحسابات</option>
            <option value="active">نشطة فقط 🟢</option>
            <option value="pending">في انتظار التفعيل 🟡</option>
            <option value="disabled">معطلة 🔴</option>
          </select>
        </div>
      </div>

      {/* 3. Teachers Grid */}
      {loading ? (
        <LoadingSkeleton count={6} type="card" />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="لا يوجد معلمون مطابقون للبحث"
          description="جرّب تعديل كلمة البحث أو فلتر الحالة لعرض المعلمين."
          actionLabel="+ إضافة معلم جديد"
          onAction={() => setIsAddModalOpen(true)}
          icon={<Users className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onEdit={(t) => setEditingTeacher(t)}
              onToggleStatus={handleUpdateStatus}
              onChangePassword={(t) => {
                setPasswordModalTeacher(t);
                setNewPassword('');
                setGeneratedPassword(null);
              }}
              onDelete={(t) => setDeletingTeacher(t)}
              isUpdating={isProcessing}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeachers}
      />

      <EditTeacherModal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSuccess={fetchTeachers}
        teacher={editingTeacher}
      />

      <DeleteTeacherModal
        isOpen={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        onSuccess={fetchTeachers}
        teacher={deletingTeacher}
      />

      {/* Change Password Modal */}
      {passwordModalTeacher && (
        <Modal
          isOpen={true}
          onClose={handleClosePasswordModal}
          title={`تغيير كلمة المرور: ${passwordModalTeacher.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {!generatedPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    كلمة المرور الجديدة:
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور من 6 خانات على الأقل"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="md" onClick={handleClosePasswordModal}>
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleExecuteChangePassword}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    تم تعيين كلمة المرور بنجاح:
                  </span>
                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 font-mono text-sm font-black text-slate-900 dark:text-slate-100">
                    <span>{generatedPassword}</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 text-slate-400 hover:text-emerald-600"
                      title="نسخ"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="primary" size="md" onClick={handleClosePasswordModal}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
