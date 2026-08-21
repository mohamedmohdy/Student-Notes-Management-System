'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GraduationCap, School, Users, Plus, Edit2, Archive, ChevronLeft, Trash2 } from 'lucide-react';
import { Grade } from '@/lib/types';
import { AddEditGradeModal } from '@/components/Grades/AddEditGradeModal';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { useToast } from '@/components/UI/Toast';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الصفوف الدراسية</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            استعراض الصفوف، إدارتها، وفتح الفصول التابعة لكل صف
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صف دراسي جديد</span>
        </button>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {grades.map((grade) => (
            <div
              key={grade.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                        {grade.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">مرحلة دراسية معتمدة</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setEditingGrade(grade)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingGrade(grade);
                        setIsPermanent(true);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="حذف نهائي شامل لكافة الفصول والطلاب"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stat pills */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400">الفصول</p>
                    <p className="text-lg font-black text-slate-800">{grade.classes_count || 0}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400">الطلاب</p>
                    <p className="text-lg font-black text-slate-800">{grade.students_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link
                href={`/grades/${grade.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-bold transition group/btn"
              >
                <span>استعراض فصول الصف</span>
                <ChevronLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition" />
              </Link>
            </div>
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
        message={`هل أنت متأكد من رغبتك في حذف (${deletingGrade?.name})؟ سيتم مسح كافة الفصول والطلاب والملاحظات التابعة له نهائياً من قاعدة البيانات لضمان دقة البيانات الجديدة.`}
        confirmLabel="حذف الصف نهائياً مع كافة البيانات"
      />
    </div>
  );
}
