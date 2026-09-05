'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { Grade } from '@/lib/types';

interface AddEditGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialGrade?: Grade | null;
}

export function AddEditGradeModal({ isOpen, onClose, onSuccess, initialGrade }: AddEditGradeModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialGrade ? initialGrade.name : '');
    }
  }, [isOpen, initialGrade]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('اسم الصف مطلوب');
      return;
    }

    setLoading(true);
    try {
      const url = initialGrade ? `/api/grades/${initialGrade.id}` : '/api/grades';
      const method = initialGrade ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      toast.success(initialGrade ? 'تم تعديل الصف بنجاح' : 'تم إضافة الصف بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الصف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialGrade ? 'تعديل الصف' : 'إضافة صف دراسي جديد'} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الصف *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: الصف الخامس الابتدائي"
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
            {loading ? 'جاري الحفظ...' : initialGrade ? 'تعديل' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
