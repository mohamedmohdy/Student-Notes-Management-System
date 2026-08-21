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
} from 'lucide-react';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic } from '@/lib/utils';

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
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">الإعدادات، الأمان، وإدارة البيانات</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          النسخ الاحتياطي الكامل، الاستعادة، استعراض العناصر المؤرشفة، وإعادة تهيئة البيانات
        </p>
      </div>

      {/* Backup & Safety Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Export Backup Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">تصدير نسخة احتياطية كاملة</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              تنزيل ملف JSON آمن يحتوي على كافة الصفوف، الفصول، الطلاب، الملاحظات، وسجلات المتابعة.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition"
          >
            تنزيل ملف Backup (JSON)
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">استعادة من نسخة احتياطية</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              استيراد ملف نسخة احتياطية تم تنزيلها مسبقاً واسترجاع كافة البيانات وقاعدة البيانات.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            اختيار ملف واستعادة البيانات
          </button>
        </div>

        {/* Re-seed / Demo Data Card */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">إعادة توليد البيانات التجريبية</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              إنشاء بيانات اختبارية للصف الرابع والخامس وأكثر من 40 طالباً وملاحظات متنوعة ومتابعات.
            </p>
          </div>
          <button
            onClick={() => setIsSeedConfirmOpen(true)}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-sm transition"
          >
            توليد بيانات تجريبية (Seed)
          </button>
        </div>
      </div>

      {/* Archive Management Section */}
      <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">سجل العناصر المؤرشفة (Soft Delete)</h3>
            <p className="text-xs text-slate-400 font-medium">
              العناصر المؤرشفة تظل محفوظة بأمان ولا يتم حذفها نهائياً، ويمكنك استعادتها في أي وقت
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="table" />
        ) : (
          <div className="space-y-6">
            {/* Archived Students */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700">الطلاب المؤرشفون ({archived.students.length})</h4>
              {archived.students.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {archived.students.map((s) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between bg-slate-50/50 text-xs">
                      <div>
                        <strong className="text-slate-800 font-bold">{s.name}</strong>
                        <span className="text-slate-400 mr-2">(رقم: {s.student_number} • {s.grade_name} - {s.class_name})</span>
                      </div>
                      <button
                        onClick={() => handleRestore('student', s.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-600 font-bold rounded-xl transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استعادة الطالب</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">لا يوجد طلاب مؤرشفون حالياً.</p>
              )}
            </div>

            {/* Archived Notes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700">الملاحظات المؤرشفة ({archived.notes.length})</h4>
              {archived.notes.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {archived.notes.map((n) => (
                    <div key={n.id} className="p-3.5 flex items-center justify-between bg-slate-50/50 text-xs">
                      <div className="max-w-md">
                        <strong className="text-slate-800 font-bold">{n.student_name}:</strong>
                        <span className="text-slate-600 mr-2">{n.content}</span>
                      </div>
                      <button
                        onClick={() => handleRestore('note', n.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-600 font-bold rounded-xl transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>استعادة الملاحظة</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">لا توجد ملاحظات مؤرشفة حالياً.</p>
              )}
            </div>

            {/* Archived Classes & Grades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">الفصول المؤرشفة ({archived.classes.length})</h4>
                {archived.classes.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {archived.classes.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between bg-slate-50/50 text-xs">
                        <span>فصل {c.name} ({c.grade_name})</span>
                        <button
                          onClick={() => handleRestore('class', c.id)}
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          استعادة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">لا توجد فصول مؤرشفة.</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">الصفوف المؤرشفة ({archived.grades.length})</h4>
                {archived.grades.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {archived.grades.map((g) => (
                      <div key={g.id} className="p-3 flex items-center justify-between bg-slate-50/50 text-xs">
                        <span>{g.name}</span>
                        <button
                          onClick={() => handleRestore('grade', g.id)}
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          استعادة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">لا توجد صفوف مؤرشفة.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isSeedConfirmOpen}
        onClose={() => setIsSeedConfirmOpen(false)}
        onConfirm={handleReSeed}
        isLoading={seeding}
        isDestructive={false}
        title="توليد البيانات التجريبية"
        message="سيتم استبدال البيانات الحالية بالبيانات التجريبية المعيارية للصف الرابع والخامس والطلاب والملاحظات النموذجية. هل ترغب في المتابعة؟"
        confirmLabel="نعم، قم بالتوليد"
      />
    </div>
  );
}
