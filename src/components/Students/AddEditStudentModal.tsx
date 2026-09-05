'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { Student, StudentStatus, ClassRoom } from '@/lib/types';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';

interface AddEditStudentModalProps {
  initialGradeId?: string;
  initialClassId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStudent?: Student | null;
  presetClassId?: string;
}

export function AddEditStudentModal({
  isOpen,
  onClose,
  onSuccess,
  initialStudent,
  presetClassId,
}: AddEditStudentModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassRoom[]>([]);

  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<StudentStatus>('normal');

  useEffect(() => {
    if (isOpen) {
      loadClasses();
      if (initialStudent) {
        setName(initialStudent.name);
        setStudentNumber(initialStudent.student_number);
        setClassId(initialStudent.class_id);
        setStatus(initialStudent.status);
      } else {
        setName('');
        setStudentNumber(Math.floor(100 + Math.random() * 900).toString());
        setClassId(presetClassId || '');
        setStatus('normal');
      }
    }
  }, [isOpen, initialStudent, presetClassId]);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentNumber.trim() || !classId) {
      toast.error('يرجى تعبئة جميع الحقول الإلزامية');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        student_number: studentNumber.trim(),
        class_id: classId,
        status,
      };

      const url = initialStudent ? `/api/students/${initialStudent.id}` : '/api/students';
      const method = initialStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      toast.success(initialStudent ? 'تم تعديل بيانات الطالب بنجاح' : 'تم إضافة الطالب بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الطالب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الطالب الرباعي *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: عبد الرحمن بن خالد العتيبي"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">رقم الطالب / الأكاديمي *</label>
            <input
              type="text"
              required
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="مثال: 401"
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الفصل الدراسي *</label>
            <select
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
            >
              <option value="">اختر الفصل...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.grade_name} - {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">حالة الطالب الأولية</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StudentStatus)}
            className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
          >
            {Object.entries(STUDENT_STATUS_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
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
            {loading ? 'جاري الحفظ...' : initialStudent ? 'تحديث البيانات' : 'إضافة الطالب'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
