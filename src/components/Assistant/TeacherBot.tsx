'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Play,
  Send,
  Trash2,
  FileText,
  Clock,
  BarChart3,
  GraduationCap,
  School,
  FileSpreadsheet,
  AlertTriangle,
  Flame,
  Mic,
  Zap,
  Brain,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDateArabic } from '@/lib/utils';
import { useToast } from '@/components/UI/Toast';
import { heroTheme } from '@/lib/heroui-theme';

interface Step {
  id: number;
  title: string;
  desc: string;
  icon: any;
  actionText: string;
  actionHref: string;
}

const guideSteps: Step[] = [
  {
    id: 1,
    title: 'الخطوة 1: إنشاء الصفوف الدراسية',
    desc: 'ابدأ بإضافة الصفوف التي تدرّسها (مثل: الصف الرابع الابتدائي، الصف الخامس الابتدائي).',
    icon: GraduationCap,
    actionText: 'إدارة الصفوف',
    actionHref: '/grades',
  },
  {
    id: 2,
    title: 'الخطوة 2: إضافة الفصول داخل كل صف',
    desc: 'افتح الصف وأنشئ فصوله (مثل: 4/أ، 4/ب، 5/أ، 5/ب) لتوزيع الطلاب عليها بدقة.',
    icon: School,
    actionText: 'استعراض الفصول',
    actionHref: '/grades',
  },
  {
    id: 3,
    title: 'الخطوة 3: استيراد أو إضافة الطلاب (Excel)',
    desc: 'يمكنك رفع ملف Excel بأسماء طلابك دفعة واحدة لتوفير الوقت، أو إضافة طالب يدوياً.',
    icon: FileSpreadsheet,
    actionText: 'دليل الطلاب واستيراد Excel',
    actionHref: '/students',
  },
  {
    id: 4,
    title: 'الخطوة 4: فتح ملف الطالب وتسجيل الملاحظات',
    desc: 'اضغط على أي طالب لفتح سجله التاريخي وإضافة ملاحظات أكاديمية، سلوكية، أو إيجابية.',
    icon: FileText,
    actionText: 'سجل الملاحظات',
    actionHref: '/notes',
  },
  {
    id: 5,
    title: 'الخطوة 5: متابعة الطلاب المحتاجين للتدخل',
    desc: 'عند اختيار "تحتاج متابعة = نعم"، ستُرصد الملاحظة تلقائياً في قسم المتابعات لتقييم النتيجة.',
    icon: Clock,
    actionText: 'مركز المتابعات',
    actionHref: '/follow-ups',
  },
  {
    id: 6,
    title: 'الخطوة 6: تصدير التقارير الرسمية و Excel',
    desc: 'استخرج تقارير مفصلة لكل طالب أو فصل أو صف بصيغة Excel أو تقرير رسمي منسق للطباعة و PDF.',
    icon: BarChart3,
    actionText: 'مركز التقارير',
    actionHref: '/reports',
  },
  {
    id: 7,
    title: 'الخطوة 7: تصفير البيانات والبدء الفعلي',
    desc: 'إذا كنت تريد حذف كافة البيانات التجريبية للبدء بإدخال بيانات مدرستك الحقيقية، استخدم تصفير البيانات من الإعدادات.',
    icon: Trash2,
    actionText: 'الإعدادات وتصفير البيانات',
    actionHref: '/settings',
  },
];

export function TeacherBot({ onOpenAddNote }: { onOpenAddNote?: () => void }) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'briefing' | 'steps'>('chat');
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'bot' | 'user';
    text: string;
    thoughtProcess?: string;
    actionExecuted?: boolean;
  }>>([
    {
      sender: 'bot',
      text: 'أهلاً بك يا أستاذي الفاضل! 🤖 أنا زميلك ومساعدك الذكي (Hero Copilot).\n\nأنا أفكر معك في كل ما يخص الفصول والطلاب والملاحظات، وأنصحك تربوياً، وأنَفذ كل ما تطلبه فورياً باللغة العربية!\n\nماذا تحب أن نفعل الآن؟',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [hasNewBadge, setHasNewBadge] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((d) => setUser(d.user))
      .catch(() => {});

    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loadingAction) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: text.trim() }];
    setChatMessages(newMessages);
    if (!textToSend) setInputText('');
    setLoadingAction(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الاتصال بالذكاء الاصطناعي');

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.message,
          thoughtProcess: data.thoughtProcess,
          actionExecuted: data.actionExecuted,
        },
      ]);

      if (data.actionExecuted) {
        toast.success('تم تنفيذ العملية بنجاح في قاعدة البيانات ✅');
        window.dispatchEvent(new Event('refresh-data'));
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'عذراً يا أستاذي، حدث خطأ بسيط أثناء معالجة الأمر. يرجى المحاولة مرة أخرى.',
        },
      ]);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <>
      {/* Floating Robot Avatar Launcher Button */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3 no-print">
        {!isOpen && (
          <div
            onClick={() => {
              setIsOpen(true);
              setHasNewBadge(false);
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-950/10 border border-indigo-100 text-xs font-extrabold text-slate-800 cursor-pointer hover:scale-105 transition-all animate-bounce"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>مرحباً {user?.name ? user.name.split(' ')[0] : 'أستاذنا'}! أنا زميلك ومساعدك الذكي 🤖</span>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
            setHasNewBadge(false);
          }}
          className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="المساعد الذكي المنفذ للأوامر"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xs opacity-70 group-hover:opacity-100 transition animate-pulse"></div>
          <Bot className="w-7 h-7 relative z-10" />

          {hasNewBadge && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-ping"></span>
          )}
        </button>
      </div>

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-[94vw] sm:w-[500px] max-h-[86vh] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-950/20 border border-slate-200/80 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300 no-print">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  <span>المساعد الذكي (Hero Copilot)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    <span>مفكر ومنفذ</span>
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-200 font-medium">يفكر معك في الحلول وينفذ طلباتك فورياً</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/80 p-2 gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>محادثة وتنفيذ الأوامر</span>
            </button>

            <button
              onClick={() => setActiveTab('briefing')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'briefing'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span>موجز المهام</span>
            </button>

            <button
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'steps'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>دليل المنصة (7)</span>
            </button>
          </div>

          {/* TAB 1: Conversational AI Copilot Chat */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[62vh]">
              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-line shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-bl-xs shadow-indigo-500/20'
                          : 'bg-slate-50/90 text-slate-800 rounded-br-xs border border-slate-200/80 shadow-xs'
                      }`}
                    >
                      {msg.thoughtProcess && (
                        <div className="mb-2 p-2 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-indigo-800">
                          <Brain className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                          <span>تحليل المساعد: {msg.thoughtProcess}</span>
                        </div>
                      )}

                      {msg.text}

                      {msg.actionExecuted && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم تنفيذ الإجراء في قاعدة البيانات بنجاح ✅</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loadingAction && (
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 animate-pulse">
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>المساعد الذكي يحلل طلبك وينفذ الإجراء في قاعدة البيانات...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Action Suggestion Buttons */}
              <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                <button
                  onClick={() => handleSendMessage('عندي طالب درجاته متراجعة في مادة الرياضيات أعمل معاه إيه؟')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 rounded-xl transition font-bold flex items-center gap-1"
                >
                  💡 نصيحة تربوية لتراجع الدرجات
                </button>
                <button
                  onClick={() => handleSendMessage('مين الطلاب اللي محتاجين متابعة حالياً؟')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 rounded-xl transition font-bold"
                >
                  🔍 فحص طلاب المتابعة
                </button>
                <button
                  onClick={() => handleSendMessage('أضف ملاحظة للطالب أحمد بن طارق: شارك بتفوق في الرياضيات')}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 rounded-xl transition font-bold"
                >
                  📝 أمر إضافة ملاحظة
                </button>
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white/90 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  disabled={loadingAction}
                  placeholder="تحدث مع زميلك الذكي واطلب أي شيء..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition outline-none"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loadingAction}
                  className="p-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl transition shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Smart Daily Briefing */}
          {activeTab === 'briefing' && (
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تقرير وموجز الذكاء الاصطناعي اليومي:</span>
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  أهلاً بك يا أستاذ <strong>{user?.name || ''}</strong>! قمت بتسجيل{' '}
                  <strong className="text-indigo-600 font-bold">{stats?.totalNotes || 0} ملاحظة</strong>، ولديك{' '}
                  <strong className="text-purple-600 font-bold">{stats?.totalStudents || 0} طالباً</strong> في{' '}
                  <strong className="text-slate-800 font-bold">{stats?.totalClasses || 0} فصول</strong>.
                </p>
              </div>

              {/* Tasks Needing Action */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>ما تحتاج متابعته واتخاذ إجراء بشأنه:</span>
                  </h4>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {stats?.pendingFollowUps || 0} متابعة
                  </span>
                </div>

                {stats?.urgentFollowUps && stats.urgentFollowUps.length > 0 ? (
                  <div className="space-y-2">
                    {stats.urgentFollowUps.map((fu: any) => (
                      <div
                        key={fu.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">{fu.student_name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{fu.note_content}</p>
                          <p className="text-[10px] text-rose-600 font-bold">
                            الموعد: {formatDateArabic(fu.follow_up_date)}
                          </p>
                        </div>
                        <Link
                          href="/follow-ups"
                          onClick={() => setIsOpen(false)}
                          className={heroTheme.button.flat}
                        >
                          إتمام
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs text-emerald-800 font-bold">
                    🎉 أحسنت! ليس لديك حالات متابعة معلقة حالياً.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Step-by-Step Guide */}
          {activeTab === 'steps' && (
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-3.5">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-950 font-semibold">
                اتبع هذه الخطوات الـ 7 لتشغيل المنصة وإدارتها باحترافية:
              </div>

              <div className="space-y-3">
                {guideSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition space-y-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                          {step.id}
                        </div>
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-black text-slate-900">{step.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">{step.desc}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <Link
                          href={step.actionHref}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition group"
                        >
                          <span>{step.actionText}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
