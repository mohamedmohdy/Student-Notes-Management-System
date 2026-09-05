'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { Note, NoteType, NotePriority, Student, Grade, ClassRoom } from '@/lib/types';
import { NOTE_TYPE_LABELS, NOTE_PRIORITY_LABELS } from '@/lib/utils';
import { Calendar, AlertCircle } from 'lucide-react';

interface AddEditNoteModalProps {
  initialStudent?: any;
  initialStudentId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialNote?: Note | null;
  presetStudentId?: string;
  presetStudentName?: string;
}

export function AddEditNoteModal({
  isOpen,
  onClose,
  onSuccess,
  initialNote,
  presetStudentId,
  presetStudentName,
}: AddEditNoteModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Student selection state if not preset
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Note form state
  const [type, setType] = useState<NoteType>('academic');
  const [priority, setPriority] = useState<NotePriority>('medium');
  const [content, setContent] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setSelectedStudentId(initialNote.student_id);
        setType(initialNote.type);
        setPriority(initialNote.priority);
        setContent(initialNote.content);
        setActionTaken(initialNote.action_taken || '');
        setRequiresFollowUp(initialNote.requires_follow_up === 1);
        setFollowUpDate(initialNote.follow_up?.follow_up_date || '');
      } else {
        setSelectedStudentId(presetStudentId || '');
        setType('academic');
        setPriority('medium');
        setContent('');
        setActionTaken('');
        setRequiresFollowUp(false);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3);
        setFollowUpDate(tomorrow.toISOString().split('T')[0]);
      }

      if (!presetStudentId && !initialNote) {
        loadGrades();
      }
    }
  }, [isOpen, initialNote, presetStudentId]);

  const loadGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGradeChange = async (gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedClassId('');
    setSelectedStudentId('');
    setStudents([]);
    if (!gradeId) {
      setClasses([]);
      return;
    }
    const res = await fetch(`/api/classes?gradeId=${gradeId}`);
    const data = await res.json();
    setClasses(data.classes || []);
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudentId('');
    if (!classId) {
      setStudents([]);
      return;
    }
    const res = await fetch(`/api/students?classId=${classId}`);
    const data = await res.json();
    setStudents(data.students || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error('يرجى تحديد الطالب');
      return;
    }
    if (!content.trim()) {
      toast.error('يرجى كتابة نص الملاحظة');
      return;
    }
    if (requiresFollowUp && !followUpDate) {
      toast.error('يرجى تحديد تاريخ المتابعة');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: selectedStudentId,
        type,
        priority,
        content: content.trim(),
        action_taken: actionTaken.trim() || null,
        requires_follow_up: requiresFollowUp,
        follow_up_date: requiresFollowUp ? followUpDate : null,
      };

      const url = initialNote ? `/api/notes/${initialNote.id}` : '/api/notes';
      const method = initialNote ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء حفظ الملاحظة');

      toast.success(initialNote ? 'تم تعديل الملاحظة بنجاح' : 'تم حفظ الملاحظة بنجاح');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة جديدة للطالب'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student Selector if not preset */}
        {presetStudentName ? (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">الملاحظة تخص الطالب:</span>
            <span className="text-sm font-bold text-indigo-950">{presetStudentName}</span>
          </div>
        ) : !initialNote ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الصف</label>
              <select
                value={selectedGradeId}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">اختر الصف...</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الفصل</label>
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={!selectedGradeId}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">اختر الفصل...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الطالب *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">اختر الطالب...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.student_number})</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {/* Note Type & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الملاحظة *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NoteType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            >
              {Object.entries(NOTE_TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">درجة الأولوية *</label>
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
              {Object.entries(NOTE_PRIORITY_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPriority(key as NotePriority)}
                  className={`flex-1 min-w-[70px] py-2 px-3 min-h-[40px] rounded-xl text-xs font-bold border transition flex items-center justify-center ${
                    priority === key
                      ? `${val.bg} ${val.text} border-current shadow-xs`
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Note Content */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            نص الملاحظة *
          </label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب تفاصيل الملاحظة الأكاديمية أو السلوكية هنا بدقة..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm leading-relaxed text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition resize-none"
          ></textarea>
        </div>

        {/* Action Taken */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            الإجراء المتخذ (اختياري)
          </label>
          <textarea
            rows={2}
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="ما الإجراء أو التوجيه الذي تم تقديمه للطالب؟"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition resize-none"
          ></textarea>
        </div>

        {/* Follow-up Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">هل تحتاج هذه الملاحظة إلى متابعة؟</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">سيتم إدراجها تلقائياً في قائمة مهام المتابعة المستمرة</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requiresFollowUp}
                onChange={(e) => setRequiresFollowUp(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {requiresFollowUp && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاريخ المتابعة المقترح *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required={requiresFollowUp}
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 min-h-[44px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition flex items-center justify-center"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition active:scale-95 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'جاري الحفظ...' : initialNote ? 'حفظ التعديلات' : 'حفظ الملاحظة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
