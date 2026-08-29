'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  X,
  GraduationCap,
  School,
  Users,
  FileText,
  Clock,
  BarChart3,
  Settings,
  Search,
  Bot,
  LayoutDashboard,
  CheckCircle2,
  FileSpreadsheet,
  LifeBuoy,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  details?: string[];
  badge?: string;
  icon: any;
  position?: 'bottom' | 'top' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard"]',
    title: 'الرئيسية (Dashboard)',
    badge: 'لوحة التحكم',
    description: 'لوحة التحكم المركزية لمتابعة كافة الأرقام والإحصائيات الخاصة بطلابك وفصولك ومعرفة الحالات التي تحتاج إلى اهتمام فوري.',
    details: [
      'إجمالي الصفوف والفصول والطلاب والدرجات.',
      'الملاحظات الأخيرة ومتابعة الحالات التي تحتاج رعاية.',
      'مصفوفة تصنيف الطلاب والمساعد التربوي الذكي.',
    ],
    icon: LayoutDashboard,
    position: 'left',
  },
  {
    target: '[data-tour="grades"]',
    title: 'الصفوف والفصول',
    badge: 'الهيكل التعليمي',
    description: 'من هنا تقوم بإنشاء وتنظيم الصفوف والفصول الدراسية التي تدرّسها وإدارة توزيع الطلاب بداخلها.',
    details: [
      'إنشاء صف دراسي جديد (مثل: الصف الرابع الابتدائي).',
      'إضافة وتعديل وأرشفة الفصول (مثل: 4/أ ، 4/ب).',
      'الدخول إلى الفصل لعرض ومتابعة طلابه مباشرة.',
    ],
    icon: GraduationCap,
    position: 'left',
  },
  {
    target: '[data-tour="students"]',
    title: 'دليل الطلاب وإدارتهم',
    badge: 'إدارة الطلاب',
    description: 'يحتوي على جميع الطلاب المسجلين في حسابك مع إمكانية إضافة الطلاب بطريقتين منظمتين.',
    details: [
      'الطريقة الأولى: إضافة طالب يدويًا عبر إدخال الاسم، الرقم، الصف، والفصل.',
      'الطريقة الثانية: استيراد دفعة كاملة من الطلاب عبر ملف Excel جاهز.',
    ],
    icon: Users,
    position: 'left',
  },
  {
    target: '[data-tour="students"]',
    title: 'شرح استيراد ملف Excel',
    badge: 'رفع البيانات',
    description: 'يمكنك رفع مئات الطلاب دفعة واحدة بخطوات سريعة ودقيقة مع التحقق التلقائي من صحة البيانات.',
    details: [
      '1. اضغط على "رفع ملف إكسيل" ثم قم بتنزيل النموذج المعتمد.',
      '2. أدخل بيانات الطلاب في الأعمدة: [اسم الطالب | رقم الطالب | الفصل].',
      '3. لا تغيّر أسماء الأعمدة. الصيغ المدعومة: (.xlsx, .xls).',
      '4. يقوم النظام بفحص التكرار والأخطاء تلقائياً قبل حفظ الطلاب في فصولهم.',
    ],
    icon: FileSpreadsheet,
    position: 'left',
  },
  {
    target: '[data-tour="notes"]',
    title: 'سجل الملاحظات اليومية',
    badge: 'التوثيق المستمر',
    description: 'توثيق الملاحظات الأكاديمية والسلوكية والمشاركات الإيجابية والمهارات لكل طالب في سجله الدائم.',
    details: [
      'تصنيفات متنوعة: (أكاديمي، سلوكي، إيجابي، مشاركة، مهاري).',
      'تحديد مستوى الأهمية: (منخفضة، متوسطة، عالية).',
      'خيار "يتطلب متابعة": يربط الملاحظة فورياً بقسم المتابعات المستمرة.',
    ],
    icon: FileText,
    position: 'left',
  },
  {
    target: '[data-tour="follow-ups"]',
    title: 'ملاحظات الفصل والمتابعات',
    badge: 'المتابعة والإجراءات',
    description: 'أدوات مساعدة لتوثيق انضباط الفصل ككل، ومتابعة الطلاب الذين يحتاجون خطط دعم إضافية.',
    details: [
      'ملاحظات الفصل: تدوين انضباط وتفاعل الفصل ككل.',
      'المتابعات المستمرة: جدولة مواعيد المتابعة وتسجيل النتائج والإجراء المتخذ.',
      'إغلاق المتابعة: تحويل الحالة إلى "تم الحل" عند استجابة الطالب.',
    ],
    icon: Clock,
    position: 'left',
  },
  {
    target: '[data-tour="reports"]',
    title: 'التقارير والتصدير والطباعة',
    badge: 'مركز التقارير',
    description: 'استخراج تقارير إحصائية وتفصيلية لمشاركتها مع إدارة المدرسة أو أولياء الأمور.',
    details: [
      'تقرير المعلم الشامل لكافة الصفوف والطلاب.',
      'تقارير مفصلة لكل فصل دراسي مع نسب التميز والمتابعة.',
      'تصدير فوري بصيغ Excel و PDF مهيأة للطباعة المباشرة.',
    ],
    icon: BarChart3,
    position: 'left',
  },
  {
    target: '[data-tour="ai-analyst"]',
    title: 'المساعد الذكي (AI Analyst)',
    badge: 'الذكاء الاصطناعي',
    description: 'محلل تربوي ذكي يحلل بيانات طلابك وفصولك ويقدم مؤشرات وتوصيات دقيقة ومبسطة.',
    details: [
      'تحليل الطلاب وتحديد مؤشرات التقدم الأكاديمي والانضباط.',
      'تحليل الفصول واقتراح أساليب لإدارة التفاعل الحصي.',
      '🔒 خصوصية تامة 100%: الذكاء الاصطناعي يعتمد فقط على بياناتك الخاصة.',
    ],
    icon: Bot,
    position: 'bottom',
  },
  {
    target: '[data-tour="support"]',
    title: '🛟 الدعم الفني المباشر',
    badge: 'نحن هنا لمساعدتك',
    description: 'إذا واجهتك أي مشكلة أو كان لديك استفسار، يمكنك التواصل فوراً مع إدارة المنصة من هنا.',
    details: [
      'فتح تذكرة دعم فني جديدة وإرفاق لقطات الشاشة التوضيحية.',
      'متابعة حالة التذكرة وتلقي رد وحلول الإدارة مباشرة.',
      '🤝 شعارنا الدائم: نحن معك دائمًا في أي وقت لمساعدتك.',
    ],
    icon: LifeBuoy,
    position: 'left',
  },
  {
    target: '[data-tour="settings"]',
    title: 'الإعدادات والبيانات',
    badge: 'الأمان والتحكم',
    description: 'إدارة حسابك، النسخ الاحتياطي الكامل، استعادة البيانات، وسجل الأرشيف.',
    details: [
      'تصدير واستعادة النسخ الاحتياطية الشاملة لجميع بياناتك.',
      'استعراض واسترجاع الطلاب والملاحظات المؤرشفة.',
      'زر "إعادة الجولة التعريفية": لتشغيل هذه الجولة مرة أخرى في أي وقت.',
    ],
    icon: Settings,
    position: 'left',
  },
];

export function InteractiveTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1: Welcome, 0..N-1: Steps, N: Finished
  const [targetRect, setTargetRect] = useState(null);
  const [isSkipConfirmOpen, setIsSkipConfirmOpen] = useState(false);

  // 1. Fetch onboarding state from PostgreSQL on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/user/onboarding')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.status?.shouldShowTour) {
          // Delay slightly for smooth page render
          const timer = setTimeout(() => {
            setIsOpen(true);
            setCurrentStepIndex(-1);
          }, 800);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Global event listener to restart tour from Settings
  useEffect(() => {
    const handleStartTour = () => {
      setIsOpen(true);
      setCurrentStepIndex(-1);
      setIsSkipConfirmOpen(false);
    };

    window.addEventListener('start-platform-tour', handleStartTour);
    return () => window.removeEventListener('start-platform-tour', handleStartTour);
  }, []);

  // 3. Spotlight update on active element
  const updateSpotlight = useCallback(() => {
    if (currentStepIndex >= 0 && currentStepIndex < tourSteps.length) {
      const step = tourSteps[currentStepIndex];
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStepIndex]);

  useEffect(() => {
    if (isOpen && currentStepIndex >= 0) {
      updateSpotlight();
      window.addEventListener('resize', updateSpotlight);
      window.addEventListener('scroll', updateSpotlight);
      return () => {
        window.removeEventListener('resize', updateSpotlight);
        window.removeEventListener('scroll', updateSpotlight);
      };
    }
  }, [isOpen, currentStepIndex, updateSpotlight]);

  // Handlers
  const handleStart = () => {
    setCurrentStepIndex(0);
  };

  const handleNext = async () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Finished tour: Persist in PostgreSQL
      setCurrentStepIndex(tourSteps.length);
      try {
        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete', version: 1 }),
        });
      } catch (e) {}
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleConfirmSkip = async () => {
    setIsSkipConfirmOpen(false);
    setIsOpen(false);
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip', version: 1 }),
      });
    } catch (e) {}
  };

  const handleFinishAndClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  // 1. Welcome Modal
  if (currentStepIndex === -1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center text-slate-900 dark:text-white">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black">👋 أهلاً بك في سجل الطالب الإلكتروني</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              سنأخذ جولة سريعة لتتعرف على أهم أدوات المنصة وكيف تستخدمها في متابعة طلابك وتنظيم مهامك اليومية بسهولة واحترافية.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={handleStart}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-indigo-500/20 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <span>🚀 ابدأ الجولة التعريفية</span>
            </button>
            <button
              onClick={() => setIsSkipConfirmOpen(true)}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              تخطي الجولة والبدء مباشرة
            </button>
          </div>
        </div>

        {/* Skip Confirmation Dialog */}
        {isSkipConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center space-y-4 text-slate-900 dark:text-white">
              <HelpCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h4 className="text-base font-black">هل تريد تخطي الجولة التعريفية؟</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                يمكنك إعادة تشغيل الجولة في أي وقت لاحقاً من قسم الإعدادات.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsSkipConfirmOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  متابعة الجولة
                </button>
                <button
                  onClick={handleConfirmSkip}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                >
                  تخطي الجولة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Finished Modal
  if (currentStepIndex === tourSteps.length) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center text-slate-900 dark:text-white">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black">🎉 أحسنت! أصبحت الآن جاهزًا لاستخدام المنصة</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              أصبحت الآن على دراية تامة بكافة أدوات المنصة. يمكنك في أي وقت إعادة تشغيل الجولة التعريفية من قسم الإعدادات.
            </p>
          </div>

          <button
            onClick={handleFinishAndClose}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-emerald-500/20 transition active:scale-98"
          >
            ✨ ابدأ استخدام المنصة الآن
          </button>
        </div>
      </div>
    );
  }

  // 3. Active Step View (0..N-1)
  const currentStep = tourSteps[currentStepIndex];
  const StepIcon = currentStep.icon;
  const progressPercent = Math.round(((currentStepIndex + 1) / tourSteps.length) * 100);

  let tooltipStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 100,
  };

  if (targetRect) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const padding = 16;

    if (isMobile) {
      tooltipStyle = {
        position: 'fixed',
        bottom: '24px',
        left: '16px',
        right: '16px',
        zIndex: 100,
      };
    } else {
      const spaceLeft = targetRect.left;
      if (currentStep.position === 'bottom') {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.min(targetRect.bottom + padding, window.innerHeight - 340)}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`,
          zIndex: 100,
        };
      } else if (spaceLeft > 420) {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.max(20, Math.min(targetRect.top - 20, window.innerHeight - 380))}px`,
          left: `${Math.max(20, targetRect.left - 420)}px`,
          zIndex: 100,
        };
      } else {
        tooltipStyle = {
          position: 'fixed',
          top: `${Math.min(targetRect.bottom + padding, window.innerHeight - 340)}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`,
          zIndex: 100,
        };
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-auto">
      {/* Dark Backdrop with Spotlight Cutout */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-all duration-300">
        {targetRect && (
          <div
            className="absolute rounded-2xl border-4 border-amber-400 bg-white/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.80)] animate-pulse transition-all duration-300 pointer-events-none"
            style={{
              top: `${targetRect.top - 6}px`,
              left: `${targetRect.left - 6}px`,
              width: `${targetRect.width + 12}px`,
              height: `${targetRect.height + 12}px`,
            }}
          />
        )}
      </div>

      {/* Floating Tooltip Card */}
      <div
        style={tooltipStyle}
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-amber-400/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black/50 text-slate-900 dark:text-white space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Step Header & Progress */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  الخطوة {currentStepIndex + 1} من {tourSteps.length}
                </span>
                {currentStep.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {currentStep.badge}
                  </span>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-black leading-tight">{currentStep.title}</h4>
            </div>
          </div>

          <button
            onClick={() => setIsSkipConfirmOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="تخطي الجولة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {currentStep.description}
        </p>

        {/* Bullet Details if present */}
        {currentStep.details && currentStep.details.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-right">
            {currentStep.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                <span className="text-amber-500 font-bold shrink-0">•</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsSkipConfirmOpen(true)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            تخطي الجولة
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <span>{currentStepIndex === tourSteps.length - 1 ? 'إنهاء الجولة 🎉' : 'التالي'}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Skip Confirmation Dialog inside step view */}
      {isSkipConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center space-y-4 text-slate-900 dark:text-white">
            <HelpCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-base font-black">هل تريد تخطي الجولة التعريفية؟</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              يمكنك إعادة تشغيل الجولة في أي وقت لاحقاً من قسم الإعدادات.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsSkipConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                متابعة الجولة
              </button>
              <button
                onClick={handleConfirmSkip}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                تخطي الجولة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}