'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { ClassRoom, Grade } from '@/lib/types';

interface AddEditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialClass?: ClassRoom | null;
  presetGradeId?: string;
}

export function AddEditClassModal({
  isOpen,
  onClose,
  onSuccess,
  initialClass,
  presetGradeId,
}: AddEditClassModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGrades();
      if (initialClass) {
        setName(initialClass.name);
        setGradeId(initialClass.grade_id);
      } else {
        setName('');
        setGradeId(presetGradeId || '');
      }
    }
  }, [isOpen, initialClass, presetGradeId]);

  const loadGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gradeId) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      const url = initialClass ? `/api/classes/${initialClass.id}` : '/api/classes';
      const method = initialClass ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), grade_id: gradeId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      toast.success(initialClass ? 'تم تعديل الفصل بنجاح' : 'تم إضافة الفصل بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الفصل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialClass ? 'تعديل الفصل' : 'إضافة فصل دراسي جديد'} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">الصف الدراسي *</label>
          <select
            required
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="">اختر الصف...</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الفصل *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: 5/أ أو 4/ب"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'جاري الحفظ...' : initialClass ? 'تعديل' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
