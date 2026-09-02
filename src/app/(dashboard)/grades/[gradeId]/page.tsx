'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Plus, School } from 'lucide-react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  GradeBreadcrumb,
  ClassCard,
  AddEditClassModal,
} from '@/components/Grades';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Button } from '@/components/UI/Button';
import { ClassRoom, Grade } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';

export default function GradeDetailPage() {
  const params = useParams();
  const gradeId = params.gradeId as string;
  const toast = useToast();

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [currentGradeName, setCurrentGradeName] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [archivingClass, setArchivingClass] = useState<ClassRoom | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes?gradeId=${gradeId}`);
      const data = await res.json();
      setClasses(data.classes || []);
      if (data.classes && data.classes.length > 0) {
        setCurrentGradeName(data.classes[0].grade_name || '');
      } else {
        const gRes = await fetch('/api/grades');
        const gData = await gRes.json();
        const found = gData.grades?.find((g: Grade) => g.id === gradeId);
        if (found) setCurrentGradeName(found.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gradeId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleArchiveConfirm = async () => {
    if (!archivingClass) return;
    try {
      const res = await fetch(`/api/classes/${archivingClass.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('تم أرشفة الفصل بنجاح');
      setArchivingClass(null);
      loadClasses();
    } catch {
      toast.error('حدث خطأ أثناء أرشفة الفصل');
    }
  };

  return (
    <PageContainer>
      {/* 1. Breadcrumb */}
      <GradeBreadcrumb
        items={[
          { label: currentGradeName || 'الصف الدراسي' },
        ]}
      />

      {/* 2. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              فصول: {currentGradeName || 'الصف الدراسي'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              {classes.length} فصل
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            استعراض الفصول وإضافة فصول جديدة والاطلاع على أعداد الطلاب.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          إضافة فصل جديد
        </Button>
      </div>

      {/* 3. Classes Grid */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : classes.length === 0 ? (
        <EmptyState
          title="لا توجد فصول دراسية لهذا الصف"
          description="أضف فصولاً لهذا الصف (مثل: 5/أ، 5/ب، 5/ج) لبدء تسجيل الطلاب وملاحظاتهم."
          actionLabel="+ إضافة فصل"
          onAction={() => setIsAddOpen(true)}
          icon={<School className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              classRoom={cls}
              gradeId={gradeId}
              onEdit={(c) => setEditingClass(c)}
              onArchive={(c) => setArchivingClass(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddEditClassModal
        isOpen={isAddOpen || !!editingClass}
        onClose={() => {
          setIsAddOpen(false);
          setEditingClass(null);
        }}
        onSuccess={loadClasses}
        initialClass={editingClass}
        presetGradeId={gradeId}
      />

      <ConfirmDialog
        isOpen={!!archivingClass}
        onClose={() => setArchivingClass(null)}
        onConfirm={handleArchiveConfirm}
        title="أرشفة الفصل الدراسي"
        message={`هل أنت متأكد من أرشفة (فصل ${archivingClass?.name})؟ سيتم الاحتفاظ بكافة الطلاب والملاحظات بأمان.`}
        confirmLabel="أرشفة الفصل"
      />
    </PageContainer>
  );
}
