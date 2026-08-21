'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Search, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { STUDENT_STATUS_LABELS } from '@/lib/utils';
import { Student } from '@/lib/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // toggle search
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectStudent = (id: string) => {
    onClose();
    router.push(`/students/${id}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="البحث السريع عن الطلاب" maxWidth="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب اسم الطالب، رقمه الأكاديمي، أو الفصل..."
            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          {loading && (
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin absolute left-3.5 top-3.5" />
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {results.length > 0 ? (
            results.map((student) => {
              const statusStyle = STUDENT_STATUS_LABELS[student.status];
              return (
                <button
                  key={student.id}
                  onClick={() => handleSelectStudent(student.id)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-indigo-50/60 rounded-xl transition text-right group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        رقم: {student.student_number} • {student.grade_name} - فصل {student.class_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                  </div>
                </button>
              );
            })
          ) : query.trim() && !loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              لم يتم العثور على أي طالب يطابق "{query}"
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              ابحث بالاسم أو الرقم الأكاديمي للوصول السريع لملف الطالب وملاحظاته.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
