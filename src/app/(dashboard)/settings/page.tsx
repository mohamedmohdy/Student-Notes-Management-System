'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Archive,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Database,
  ShieldCheck,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic } from '@/lib/utils';
import { heroTheme } from '@/lib/heroui-theme';

export default function SettingsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [archived, setArchived] = useState<{
    grades: any[];
    classes: any[];
    students: any[];
    notes: any[];
  }>({ grades: [], classes: [], students: [], notes: [] });

  const [loading, setLoading] = useState(true);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loadArchive = useCallback(async () => {
    try {
      const res = await fetch('/api/archive');
      const data = await res.json();
      setArchived(data.archived || { grades: [], classes: [], students: [], notes: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  // Launch Tour
  const handleReLaunchTour = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
    } catch {}
    window.dispatchEvent(new Event('start-platform-tour'));
    toast.success('تم بدء الجولة التعريفية التفاعلية للمنصة');
  };

  // Export Full Backup
  const handleExportBackup = () => {
    window.location.href = '/api/backup/export';
    toast.success('جاري تنزيل ملف النسخة الاحتياطية الشاملة...');
  };

  // Import Backup
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'فشل الاستيراد');

      toast.success('تمت استعادة النسخة الاحتياطية بنجاح');
      loadArchive();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء استيراد البيانات');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Re-seed Data
  const handleReSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/backup/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم إعادة توليد البيانات التجريبية بنجاح');
      setIsSeedConfirmOpen(false);
      loadArchive();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إعادة التوليد');
    } finally {
      setSeeding(false);
    }
  };

  // Restore item from Archive
  const handleRestore = async (type: 'grade' | 'class' | 'student' | 'note', id: string) => {
    try {
      const res = await fetch('/api/archive/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('تم استعادة العنصر من الأرشيف بنجاح');
      loadArchive();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الاستعادة');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">الإعدادات، الأمان، وإدارة البيانات</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          النسخ الاحتياطي الكامل، الاستعادة، استعراض العناصر المؤرشفة، وإعادة تشغيل الجولة التعريفية
        </p>
      </div>

      {/* Guided Tour Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">الجولة التعريفية للمنصة</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              شرح تفاعلي خطوة بخطوة لجميع أدوات وأقسام المنصة لتسهيل الاستخدام
            </p>
          </div>
        </div>

        <button
          onClick={handleReLaunchTour}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>🎓 إعادة الجولة التعريفية</span>
        </button>
      </div>

      {/* Backup & Safety Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Export Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">تصدير نسخة احتياطية كاملة</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              تنزيل ملف JSON آمن يحتوي على كافة الصفوف، الفصول، الطلاب، الملاحظات، وسجلات المتابعة.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 dark:shadow-none transition"
          >
            تنزيل ملف Backup (JSON)
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">استعادة نسخة احتياطية</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              رفع ملف النسخة الاحتياطية واسترجاع كافة البيانات والصفوف والطلاب المسجلين فورياً.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-200 dark:shadow-none transition"
            >
              اختيار ملف النسخة الاحتياطية
            </button>
          </div>
        </div>

        {/* Re-seed / Reset Data Card */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">إعادة تعيين البيانات التجريبية</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              إعادة توليد بيانات تجريبية افتراضية كاملة (صفوف، فصول، طلاب، ملاحظات) للاختبار والمعاينة.
            </p>
          </div>
          <button
            onClick={() => setIsSeedConfirmOpen(true)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-200 dark:shadow-none transition"
          >
            إعادة تعيين البيانات التجريبية
          </button>
        </div>
      </div>

      {/* Archive Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-r-4 border-indigo-600 pr-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>سجل العناصر المؤرشفة (الأرشيف)</span>
          </h3>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="table" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Archived Students */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">الطلاب المؤرشفون ({archived.students?.length || 0})</h4>
              {archived.students?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">لا يوجد طلاب مؤرشفون</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {archived.students?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.student_number}</p>
                      </div>
                      <button
                        onClick={() => handleRestore('student', s.id)}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-100 transition"
                      >
                        استعادة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Archived Notes */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300">الملاحظات المؤرشفة ({archived.notes?.length || 0})</h4>
              {archived.notes?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">لا توجد ملاحظات مؤرشفة</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {archived.notes?.map((n) => (
                    <div key={n.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                      <div className="max-w-[70%]">
                        <p className="font-black text-slate-900 dark:text-white truncate">{n.student_name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{n.content}</p>
                      </div>
                      <button
                        onClick={() => handleRestore('note', n.id)}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-100 transition"
                      >
                        استعادة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Seed */}
      <ConfirmDialog
        isOpen={isSeedConfirmOpen}
        onClose={() => setIsSeedConfirmOpen(false)}
        onConfirm={handleReSeed}
        title="تأكيد إعادة تعيين البيانات التجريبية"
        message="سيؤدي هذا الإجراء إلى مسح كافة البيانات الحالية وتوليد مجموعة بيانات تجريبية جديدة بالكامل. هل تود المتابعة؟"
        confirmText={seeding ? 'جاري التوليد...' : 'نعم، أعد التعيين'}
        isDangerous={true}
      />
    </div>
  );
}
