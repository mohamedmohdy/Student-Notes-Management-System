'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../UI/Modal';
import { useToast } from '../UI/Toast';
import { ClassRoom, Grade } from '@/lib/types';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Check,
  RefreshCw,
} from 'lucide-react';
import { parseExcelStudentData, ParsedStudentRow } from '@/lib/excelStudentParser';

interface ImportStudentsModalProps {
  defaultGradeId?: string;
  defaultClassId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  presetClassId?: string;
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
  const [selectedClassId, setSelectedClassId] = useState('');

  const [parsedStudents, setParsedStudents] = useState<ParsedStudentRow[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    duplicates: 0,
    invalid: 0,
  });
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'issues'>('all');

  useEffect(() => {
    if (isOpen) {
      loadGradesAndClasses();
      setSelectedClassId(presetClassId || '');
      setParsedStudents([]);
      setStats({ total: 0, valid: 0, duplicates: 0, invalid: 0 });
      setParseError(null);
      setFileName('');
      setFileSize('');
    }
  }, [isOpen, presetClassId]);

  const loadGradesAndClasses = async () => {
    try {
      const [gRes, cRes] = await Promise.all([fetch('/api/grades'), fetch('/api/classes')]);
      const [gData, cData] = await Promise.all([gRes.json(), cRes.json()]);
      setGrades(gData.grades || []);
      setClasses(cData.classes || []);
    } catch (e) {
      console.error('Failed to load grades/classes for import:', e);
    }
  };

  // Download Empty Template
  const handleDownloadTemplate = async () => {
    const sampleData = [
      {
        'رقم الطالب': '101',
        'اسم الطالب': 'عبد الرحمن بن خالد العتيبي',
        'الحالة': 'ممتاز',
      },
      {
        'رقم الطالب': '102',
        'اسم الطالب': 'سعود بن فهد الدوسري',
        'الحالة': 'طبيعي',
      },
      {
        'رقم الطالب': '103',
        'اسم الطالب': 'عمر بن إبراهيم السليمان',
        'الحالة': 'يحتاج متابعة',
      },
      {
        'رقم الطالب': '104',
        'اسم الطالب': 'محمد بن عبد العزيز آل سعود',
        'الحالة': 'طبيعي',
      },
    ];

    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
      XLSX.writeFile(workbook, 'نموذج_استيراد_الطلاب_الرسمي.xlsx');
      toast.success('تم تحميل نموذج Excel الجاهز بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تنزيل النموذج');
    }
  };

  // Handle File Upload & Parse
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setParseError(null);

    try {
      // 1. Fetch existing students for duplicate cross-check if class is selected
      const existingNumbers = new Set<string>();
      const existingNames = new Set<string>();
      if (selectedClassId) {
        try {
          const sRes = await fetch(`/api/students?classId=${selectedClassId}`);
          const sData = await sRes.json();
          if (Array.isArray(sData.students)) {
            sData.students.forEach((s: any) => {
              if (s.student_number) existingNumbers.add(String(s.student_number).trim());
              if (s.name) existingNames.add(String(s.name).trim());
            });
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Read Workbook via dynamic XLSX import
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setParseError('الملف لا يحتوي على أي صفحات عمل صالحة');
        return;
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw2D: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false });

      // 3. Parse and Validate
      const result = parseExcelStudentData(raw2D, existingNumbers, existingNames);

      if (!result.success && result.error_message) {
        setParseError(result.error_message);
        setParsedStudents([]);
        setStats({ total: 0, valid: 0, duplicates: 0, invalid: 0 });
        toast.error(result.error_message);
        return;
      }

      setParsedStudents(result.students);
      setStats({
        total: result.total_rows,
        valid: result.valid_count,
        duplicates: result.duplicate_count,
        invalid: result.invalid_count,
      });

      if (result.valid_count > 0) {
        toast.success(`تم التعرف على ${result.valid_count} طالباً جاهزاً للاستيراد بنجاح!`);
      } else if (result.error_message) {
        setParseError(result.error_message);
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError('حدث خطأ في قراءة ملف Excel. تأكد من أن الملف سليم بصيغة .xlsx أو .csv.');
      toast.error('فشلت قراءة ملف Excel');
    }
  };

  // Submit Valid Students to API
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('يرجى تحديد الفصل الدراسي المراد استيراد الطلاب إليه');
      return;
    }

    const validStudents = parsedStudents.filter((s) => s.is_valid);
    if (validStudents.length === 0) {
      toast.error('لا يوجد طلاب صالحون للاستيراد في الملف');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        classId: selectedClassId,
        students: validStudents.map((s) => ({
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
      if (!res.ok) throw new Error(data.error || 'فشل استيراد الطلاب');

      toast.success(data.message || `تم استيراد ${data.count} طالباً بنجاح!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء حفظ بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  };

  const filteredPreview = parsedStudents.filter((s) => {
    if (activeFilter === 'valid') return s.is_valid;
    if (activeFilter === 'issues') return !s.is_valid;
    return true;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="استيراد قائمة الطلاب من ملف Excel" maxWidth="xl">
      <form onSubmit={handleImportSubmit} className="space-y-5">
        {/* Template Helper Card */}
        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200">
              نموذج Excel الرسمي المعتمد
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
              يمكنك تنزيل النموذج المنسق وتعبئته بأسماء الطلاب وأرقامهم ثم إعادة رفعه هنا.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="shrink-0 px-3.5 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
            aria-label="تحميل نموذج Excel المعتمد"
          >
            <Download className="w-4 h-4" />
            <span>تحميل النموذج (.xlsx)</span>
          </button>
        </div>

        {/* Target Class Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            الفصل الدراسي المستهدف *
          </label>
          <select
            required
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              // Clear previous parse to re-evaluate duplicates against newly chosen class
              if (parsedStudents.length > 0 && fileInputRef.current?.files?.[0]) {
                const event = { target: { files: fileInputRef.current.files } } as any;
                handleFileUpload(event);
              }
            }}
            className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
          >
            <option value="">اختر الفصل لإضافة الطلاب إليه...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.grade_name || ''} — فصل {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            ملف البيانات (.xlsx / .xls / .csv) *
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 dark:border-indigo-900/80 hover:border-indigo-500 dark:hover:border-indigo-600 bg-indigo-50/20 dark:bg-slate-900/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'اضغط لاختيار ملف Excel أو اسحبه وأفلته هنا'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {fileSize ? `الحجم: ${fileSize}` : 'يدعم صيغ .xlsx و .xls و .csv بجميع التنسيقات العربية والإنجليزية'}
              </p>
            </div>
          </div>
        </div>

        {/* Parsing Error Box */}
        {parseError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-black">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>تنبيه في فحص الملف:</span>
            </div>
            <p className="font-semibold leading-relaxed">{parseError}</p>
            <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-rose-100 dark:border-rose-900/30 text-slate-700 dark:text-slate-300 space-y-1">
              <p className="font-bold">العناوين المقبولة تلقائياً لعمود اسم الطالب:</p>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                اسم الطالب • الاسم • اسم الطالب الرباعي • اسم التلميذ • Student Name • Name • Full Name
              </p>
            </div>
          </div>
        )}

        {/* Analysis & Summary Badges */}
        {parsedStudents.length > 0 && (
          <div className="space-y-3">
            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي المكتشف</p>
                <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">{stats.total}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">صالح للاستيراد</p>
                <p className="text-base font-black text-emerald-900 dark:text-emerald-200 mt-0.5">{stats.valid}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">مكرر (تم تخطيه)</p>
                <p className="text-base font-black text-amber-900 dark:text-amber-200 mt-0.5">{stats.duplicates}</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center">
                <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">صفوف غير صالحة</p>
                <p className="text-base font-black text-rose-900 dark:text-rose-200 mt-0.5">{stats.invalid}</p>
              </div>
            </div>

            {/* Preview Filter Tabs */}
            <div className="flex items-center justify-between gap-2 pt-1 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                معاينة بيانات الطلاب ({filteredPreview.length})
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  الكل ({parsedStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('valid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeFilter === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  الصالح ({stats.valid})
                </button>
                {(stats.duplicates > 0 || stats.invalid > 0) && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('issues')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeFilter === 'issues'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    تنبيهات ({stats.duplicates + stats.invalid})
                  </button>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/40 dark:bg-slate-900/60">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5 w-24">رقم الطالب</th>
                    <th className="p-2.5">اسم الطالب</th>
                    <th className="p-2.5 w-24">الحالة</th>
                    <th className="p-2.5 w-32 text-left">حالة الفحص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPreview.map((s, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-white dark:hover:bg-slate-800/80 transition ${
                        !s.is_valid ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {s.student_number}
                      </td>
                      <td className="p-2.5 font-black text-slate-900 dark:text-slate-100">
                        {s.name || <span className="text-rose-500 font-bold">اسم غير محدد</span>}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 font-semibold">
                        {s.status === 'excellent' ? 'ممتاز' : s.status === 'needs_followup' ? 'يحتاج متابعة' : 'طبيعي'}
                      </td>
                      <td className="p-2.5 text-left">
                        {s.is_valid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            <Check className="w-3 h-3" />
                            <span>جاهز</span>
                          </span>
                        ) : s.is_duplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]" title={s.validation_error}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>مكرر</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px]" title={s.validation_error}>
                            <XCircle className="w-3 h-3" />
                            <span>ناقص</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || stats.valid === 0 || !selectedClassId}
            className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-500/20 transition disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استيراد الطلاب...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>استيراد ({stats.valid}) طالباً إلى الفصل</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
