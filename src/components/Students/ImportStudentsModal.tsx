'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { ClassRoom, Grade, StudentStatus } from '@/lib/types';
import { FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, Users, Check } from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  presetClassId?: string;
}

interface ParsedRow {
  student_number: string;
  name: string;
  status: StudentStatus;
}

export function ImportStudentsModal({
  isOpen,
  onClose,
  onSuccess,
  presetClassId,
}: ImportStudentsModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [grades, setGrades] = useState<Grade[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [parsedStudents, setParsedStudents] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGradesAndClasses();
      setSelectedClassId(presetClassId || '');
      setParsedStudents([]);
      setFileName('');
    }
  }, [isOpen, presetClassId]);

  const loadGradesAndClasses = async () => {
    try {
      const [gRes, cRes] = await Promise.all([fetch('/api/grades'), fetch('/api/classes')]);
      const [gData, cData] = await Promise.all([gRes.json(), cRes.json()]);
      setGrades(gData.grades || []);
      setClasses(cData.classes || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Download Empty Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      { 'رقم الطالب': '101', 'اسم الطالب الرباعي': 'عبد الرحمن بن خالد العتيبي', 'الحالة (ممتاز / طبيعي / يحتاج متابعة)': 'ممتاز' },
      { 'رقم الطالب': '102', 'اسم الطالب الرباعي': 'سعود بن فهد الدوسري', 'الحالة (ممتاز / طبيعي / يحتاج متابعة)': 'طبيعي' },
      { 'رقم الطالب': '103', 'اسم الطالب الرباعي': 'عمر بن إبراهيم السليمان', 'الحالة (ممتاز / طبيعي / يحتاج متابعة)': 'يحتاج متابعة' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج_الطلاب');
    XLSX.writeFile(workbook, 'نموذج_استيراد_الطلاب.xlsx');
    toast.info('تم تحميل النموذج، قم بملئه بأسماء طلابك ورفعه.');
  };

  // Handle File Upload & Parse
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet);

      if (!rawRows || rawRows.length === 0) {
        toast.error('الملف فارغ أو لا يحتوي على صفوف بيانات');
        return;
      }

      // Map dynamic column names (English or Arabic)
      const mapped: ParsedRow[] = rawRows
        .map((row, idx) => {
          const name = row['اسم الطالب'] || row['اسم الطالب الرباعي'] || row['الاسم'] || row['Name'] || row['name'] || '';
          const num = row['رقم الطالب'] || row['الرقم الأكاديمي'] || row['الرقم'] || row['StudentNumber'] || row['Number'] || (100 + idx).toString();
          const rawStatus = row['الحالة'] || row['حالة الطالب'] || row['Status'] || '';
          
          let status: StudentStatus = 'normal';
          if (rawStatus.includes('ممتاز') || rawStatus.toLowerCase().includes('excel')) status = 'excellent';
          if (rawStatus.includes('متابع') || rawStatus.toLowerCase().includes('follow')) status = 'needs_followup';

          return {
            student_number: num.toString().trim(),
            name: name.toString().trim(),
            status,
          };
        })
        .filter((r) => r.name.length > 0);

      if (mapped.length === 0) {
        toast.error('لم نتمكن من العثور على عمود اسم الطالب في الملف. يرجى استخدام النموذج المرفق.');
        return;
      }

      setParsedStudents(mapped);
      toast.success(`تم قراءة ${mapped.length} طالباً بنجاح من الملف!`);
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء قراءة ملف Excel، تأكد من صحة الصيغة.');
    }
  };

  // Submit to API
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('يرجى تحديد الفصل الدراسي المراد استيراد الطلاب إليه');
      return;
    }
    if (parsedStudents.length === 0) {
      toast.error('يرجى رفع ملف يحتوي على بيانات الطلاب');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        students: parsedStudents.map((s) => ({
          class_id: selectedClassId,
          student_number: s.student_number,
          name: s.name,
          status: s.status,
        })),
      };

      const res = await fetch('/api/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاستيراد');

      toast.success(data.message);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الطلاب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="استيراد قائمة الطلاب من ملف Excel" maxWidth="xl">
      <form onSubmit={handleImportSubmit} className="space-y-5">
        {/* Template Helper Box */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-indigo-950">هل تريد نموذج Excel جاهز؟</h4>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              يمكنك تنزيل النموذج المنسق وإدخال أسماء طلابك وأرقامهم ثم رفعه هنا بنقرة واحدة.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل نموذج Excel</span>
          </button>
        </div>

        {/* Class Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اختر الفصل الدراسي المستهدف *</label>
          <select
            required
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          >
            <option value="">اختر الفصل لإضافة الطلاب إليه...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.grade_name} - فصل {c.name}</option>
            ))}
          </select>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">ملف Excel (.xlsx / .xls / .csv) *</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/20 hover:bg-indigo-50/50 p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                {fileName ? fileName : 'اضغط لاختيار ملف Excel أو سحبه وإفلاته هنا'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">يدعم صيغ .xlsx و .xls و .csv</p>
            </div>
          </div>
        </div>

        {/* Live Preview Table */}
        {parsedStudents.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">معاينة الطلاب المكتشفين في الملف ({parsedStudents.length} طالب):</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>جاهز للاستيراد</span>
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="p-2.5">م</th>
                    <th className="p-2.5">رقم الطالب</th>
                    <th className="p-2.5">اسم الطالب</th>
                    <th className="p-2.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-white transition">
                      <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-600">{s.student_number}</td>
                      <td className="p-2.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-2.5 text-slate-500">
                        {s.status === 'excellent' ? 'ممتاز' : s.status === 'needs_followup' ? 'يحتاج متابعة' : 'طبيعي'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || parsedStudents.length === 0 || !selectedClassId}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>{loading ? 'جاري الاستيراد...' : `استيراد ${parsedStudents.length} طالباً إلى الفصل`}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
