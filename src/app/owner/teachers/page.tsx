'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  X,
  Mail,
  Filter,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Lock,
  Edit,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { User, UserStatus } from '@/lib/types';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';
import { AddTeacherModal } from '@/components/Owner/AddTeacherModal';
import { EditTeacherModal } from '@/components/Owner/EditTeacherModal';
import { DeleteTeacherModal } from '@/components/Owner/DeleteTeacherModal';

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

  // Disable Confirmation Modal
  const [disablingTeacher, setDisablingTeacher] = useState<User | null>(null);

  // Change / Reset Password Modal State
  const [passwordModalTeacher, setPasswordModalTeacher] = useState<User | null>(null);
  const [isDirectChange, setIsDirectChange] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTeachers = async () => {
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
  };

  useEffect(() => {
    fetchTeachers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeachers();
  };

  const handleUpdateStatus = async (teacherId: string, newStatus: UserStatus) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/owner/teachers/${teacherId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setDisablingTeacher(null);
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
    <div className="space-y-6">
      {/* Header with Add Teacher Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-amber-500" />
            <span>إدارة المعلمين وتفعيل الحسابات (Teachers Management)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            إضافة المعلمين، تعديل البيانات، تغيير كلمات المرور، تفعيل أو تعطيل الحسابات، والحذف النهائي الآمن
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>➕ إضافة معلم جديد</span>
          </button>

          <button
            onClick={fetchTeachers}
            className={heroTheme.button.ghost}
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            كافة المعلمين ({teachers.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            <span>🟡 قيد التفعيل (Pending)</span>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            }`}
          >
            <span>🟢 مفعل دائم (Active)</span>
          </button>
          <button
            onClick={() => setStatusFilter('disabled')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 ${
              statusFilter === 'disabled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
            }`}
          >
            <span>🔴 معطل (Disabled)</span>
          </button>
        </div>

        {/* Live Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>
      </div>

      {/* Teachers Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل قائمة المعلمين...</p>
          </div>
        ) : teachers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-extrabold">
                <tr>
                  <th className="py-4 px-5">المعلم</th>
                  <th className="py-4 px-5">البريد الإلكتروني</th>
                  <th className="py-4 px-5 text-center">حالة الحساب</th>
                  <th className="py-4 px-5 text-center">الطلاب</th>
                  <th className="py-4 px-5">تاريخ الإنشاء</th>
                  <th className="py-4 px-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black flex items-center justify-center shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">{t.name}</span>
                          {t.must_change_password === 1 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                              🔑 كلمة مرور مؤقتة
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-300">
                      {t.email}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${
                          t.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : t.status === 'disabled'
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-emerald-500' : t.status === 'disabled' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {t.status === 'active' ? 'مفعل (Active) 🟢' : t.status === 'disabled' ? 'معطل (Disabled) 🔴' : 'قيد المراجعة (Pending) 🟡'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {t.students_count || 0} طالب
                    </td>

                    <td className="py-4 px-5 text-slate-500 dark:text-slate-400 font-semibold">
                      {formatDateArabic(t.created_at)}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Teacher Button */}
                        <button
                          onClick={() => setEditingTeacher(t)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="تعديل بيانات المعلم"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {/* Change Password Button */}
                        <button
                          onClick={() => setPasswordModalTeacher(t)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-xl text-xs font-bold transition border border-amber-200 dark:border-amber-800 flex items-center gap-1 shadow-xs"
                          title="تغيير أو إعادة تعيين كلمة مرور المعلم"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>كلمة المرور</span>
                        </button>

                        {/* Activate / Disable Toggle */}
                        {t.status !== 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(t.id, 'active')}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                            title="تفعيل الحساب بشكل دائم"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تفعيل</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setDisablingTeacher(t)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            title="تعطيل الحساب مؤقتاً"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>تعطيل</span>
                          </button>
                        )}

                        {/* Safe Permanent Delete Button */}
                        <button
                          onClick={() => setDeletingTeacher(t)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl text-xs font-bold transition border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                          title="حذف المعلم وجميع سجلاته نهائيًا (إجراء خطير)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف نهائي</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>لم يتم العثور على معلمين يطابقون خيارات البحث الحالية.</p>
          </div>
        )}
      </div>

      {/* Change / Reset Password Modal */}
      {passwordModalTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-6 animate-in zoom-in-95 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">تغيير كلمة مرور المعلم</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{passwordModalTeacher.name} ({passwordModalTeacher.email})</p>
                </div>
              </div>

              <button
                onClick={handleClosePasswordModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedPassword ? (
              <div className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setIsDirectChange(true)}
                    className={`py-2 text-xs font-black rounded-xl transition ${
                      isDirectChange
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    تعيين كلمة مرور جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDirectChange(false)}
                    className={`py-2 text-xs font-black rounded-xl transition ${
                      !isDirectChange
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    توليد كلمة مرور مؤقتة
                  </button>
                </div>

                {isDirectChange ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      كلمة المرور الجديدة * (6 خانات على الأقل)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة للمعلم..."
                        className={heroTheme.input}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-slate-700 dark:text-slate-300 font-semibold space-y-1.5">
                    <p className="font-black text-amber-900 dark:text-amber-300">
                      إعادة تعيين بكلمة مرور مؤقتة:
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      سيتم إنشاء كلمة مرور مؤقتة آمنة، وعند أول تسجيل دخول للمعلم سيُطلب منه إلزاميًا تعيين كلمة مرور جديدة خاصة به.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleExecuteChangePassword}
                    disabled={isProcessing}
                    className={heroTheme.button.primary + ' flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20'}
                  >
                    {isProcessing ? 'جاري الحفظ...' : isDirectChange ? 'حفظ كلمة المرور الجديدة' : 'توليد كلمة المرور المؤقتة'}
                  </button>

                  <button
                    onClick={handleClosePasswordModal}
                    disabled={isProcessing}
                    className={heroTheme.button.secondary + ' py-3'}
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {isDirectChange ? 'تم حفظ كلمة المرور بنجاح!' : 'تم إنشاء كلمة المرور المؤقتة!'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    انسخ كلمة المرور وزودها للمعلم لتسجيل الدخول:
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-2 border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-between gap-3">
                  <span className="font-mono text-base font-black tracking-wider text-slate-900 dark:text-white select-all">
                    {generatedPassword}
                  </span>

                  <button
                    onClick={handleCopyPassword}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>

                <button
                  onClick={handleClosePasswordModal}
                  className={heroTheme.button.primary + ' w-full py-3'}
                >
                  إتمام وإغلاق النافذة
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Disabling */}
      {disablingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">تأكيد تعطيل حساب المعلم</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{disablingTeacher.name}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
              <p>⚠️ <strong>تنبيه الأمان والبيانات:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>سيتم منع المعلم من الدخول واستخدام لوحة التحكم.</li>
                <li><strong>لن يتم حذف أي طالب أو ملاحظة أو تقرير</strong> مرتبط بحسابه نهائياً.</li>
                <li>يمكنك إعادة تفعيل الحساب في أي وقت بنقرة واحدة.</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleUpdateStatus(disablingTeacher.id, 'disabled')}
                disabled={isProcessing}
                className={heroTheme.button.danger + ' flex-1 py-3'}
              >
                {isProcessing ? 'جاري التعطيل...' : 'نعم، قم بتعطيل الحساب'}
              </button>

              <button
                onClick={() => setDisablingTeacher(null)}
                disabled={isProcessing}
                className={heroTheme.button.secondary + ' py-3'}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddTeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTeachers}
      />

      {/* Edit Teacher Modal */}
      <EditTeacherModal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        teacher={editingTeacher}
        onSuccess={fetchTeachers}
      />

      {/* Safe Permanent Delete Modal */}
      <DeleteTeacherModal
        isOpen={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        teacher={deletingTeacher}
        onSuccess={fetchTeachers}
      />
    </div>
  );
}
