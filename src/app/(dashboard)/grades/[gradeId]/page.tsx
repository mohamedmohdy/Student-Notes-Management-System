'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { School, Users, Plus, Edit2, Archive, ChevronLeft, ArrowRight } from 'lucide-react';
import { ClassRoom, Grade } from '@/lib/types';
import { AddEditClassModal } from '@/components/Grades/AddEditClassModal';
import { ConfirmDialog } from '@/components/UI/ConfirmDialog';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { useToast } from '@/components/UI/Toast';

export default function GradeDetailPage() {
  const params = useParams();
  const gradeId = params.gradeId as string;
  const router = useRouter();
  const toast = useToast();

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [currentGradeName, setCurrentGradeName] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom[] | any>(null);
  const [archivingClass, setArchivingClass] = useState<ClassRoom | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes?gradeId=${gradeId}`);
      const data = await res.json();
      setClasses(data.classes || []);
      if (data.classes && data.classes.length > 0) {
        setCurrentGradeName(data.classes[0].grade_name || '');
      } else {
        // fetch grades list to find name
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
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/grades"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لكافة الصفوف</span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            فصول: {currentGradeName || 'الصف الدراسي'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            استعراض الفصول وإضافة فصول جديدة والاطلاع على أعداد الطلاب
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فصل جديد</span>
        </button>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                        فصل {cls.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold">{cls.grade_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setEditingClass(cls)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setArchivingClass(cls)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="أرشفة"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-bold">عدد الطلاب المسجلين:</span>
                  <span className="text-base font-black text-slate-800">{cls.students_count || 0} طالب</span>
                </div>
              </div>

              <Link
                href={`/grades/${gradeId}/${cls.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold transition group/btn"
              >
                <span>فتح قائمة طلاب الفصل ({cls.name})</span>
                <ChevronLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition" />
              </Link>
            </div>
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
    </div>
  );
}
