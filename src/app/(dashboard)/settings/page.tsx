'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  SettingsHeader,
  GuidedTourCard,
  DataBackupCard,
} from '@/components/Settings';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { useToast } from '@/components/UI/Toast';
import { formatDateArabic } from '@/lib/utils';
import { RotateCcw, Archive } from 'lucide-react';
import { Button } from '@/components/UI/Button';

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

  const totalArchived =
    (archived.grades?.length || 0) +
    (archived.classes?.length || 0) +
    (archived.students?.length || 0) +
    (archived.notes?.length || 0);

  return (
    <PageContainer>
      {/* 1. Header */}
      <SettingsHeader />

      {/* 2. Guided Tour Banner */}
      <GuidedTourCard onLaunchTour={handleReLaunchTour} />

      {/* 3. Backup & Safety Actions */}
      <DataBackupCard
        onExport={handleExportBackup}
        onFileChange={handleFileChange}
        fileInputRef={fileInputRef}
      />

      {/* 4. Archived Items Section */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                سجل العناصر المؤرشفة ({totalArchived})
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                يمكنك استعادة أي صف، فصل، طالب، أو ملاحظة تم أرشفتها مسبقاً.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton count={2} type="card" />
        ) : totalArchived === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-semibold">
            لا توجد أي عناصر مؤرشفة حالياً. كافة بياناتك نشطة ومتاحة.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Students */}
            {archived.students?.map((s) => (
              <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-slate-900 dark:text-slate-100 block">طالب: {s.name}</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{s.grade_name || ''} - فصل {s.class_name || ''}</span>
                </div>
                <Button
                  onClick={() => handleRestore('student', s.id)}
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  استعادة
                </Button>
              </div>
            ))}

            {/* Classes */}
            {archived.classes?.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-slate-900 dark:text-slate-100 block">فصل: {c.name}</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{c.grade_name || ''}</span>
                </div>
                <Button
                  onClick={() => handleRestore('class', c.id)}
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  استعادة
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
