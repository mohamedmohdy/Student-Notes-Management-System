'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  GradesWorkspaceHeader,
  GradeCard,
  AddEditGradeModal,
} from '@/components/Grades';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { Grade } from '@/lib/types';
import { useToast } from '@/components/UI/Toast';
import { GraduationCap } from 'lucide-react';

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);
  const [isPermanent, setIsPermanent] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();

  const loadGrades = useCallback(async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleDeleteConfirm = async () => {
    if (!deletingGrade) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grades/${deletingGrade.id}?permanent=${isPermanent}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(isPermanent ? 'تم حذف الصف وكافة فصوله وطلابه وملاحظاته نهائياً بنجاح' : 'تم أرشفة الصف بنجاح');
      setDeletingGrade(null);
      loadGrades();
    } catch {
      toast.error('حدث خطأ أثناء حذف الصف');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header with Title and Primary CTA */}
      <GradesWorkspaceHeader
        totalCount={grades.length}
        onOpenAddGrade={() => setIsAddOpen(true)}
      />

      {/* 2. Content */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : grades.length === 0 ? (
        <EmptyState
          title="لا توجد صفوف دراسية حتى الآن"
          description="قم بإضافة أول صف دراسي (مثل: الصف الرابع، الصف الخامس) لبدء إضافة الفصول والطلاب."
          actionLabel="+ إضافة صف دراسي"
          onAction={() => setIsAddOpen(true)}
          icon={<GraduationCap className="w-10 h-10" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {grades.map((grade) => (
            <GradeCard
              key={grade.id}
              grade={grade}
              onEdit={(g) => setEditingGrade(g)}
              onDelete={(g) => {
                setDeletingGrade(g);
                setIsPermanent(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddEditGradeModal
        isOpen={isAddOpen || !!editingGrade}
        onClose={() => {
          setIsAddOpen(false);
          setEditingGrade(null);
        }}
        onSuccess={loadGrades}
        initialGrade={editingGrade}
      />

      <ConfirmDialog
        isOpen={!!deletingGrade}
        onClose={() => setDeletingGrade(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={actionLoading}
        title="حذف الصف الدراسي نهائياً"
        message={`هل أنت متأكد من رغبتك في حذف (${deletingGrade?.name})؟ سيتم مسح كافة الفصول والطلاب والملاحظات التابعة له نهائياً من قاعدة البيانات.`}
        confirmLabel="حذف الصف نهائياً مع كافة البيانات"
      />
    </PageContainer>
  );
}
