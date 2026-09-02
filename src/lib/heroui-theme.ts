// Institutional Educational Design System Tokens
export const designTokens = {
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#090d16',
    },
  },
  touchTargetMin: 'min-h-[44px] min-w-[44px]',
};

// Backward-compatible heroTheme with institutional calm styles
export const heroTheme = {
  card: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs hover:border-indigo-300/80 dark:hover:border-indigo-500/40 transition-all duration-200 text-slate-900 dark:text-slate-100',
  glassCard: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl text-slate-900 dark:text-slate-100',
  darkCard: 'bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800',
  input: 'w-full px-4 py-2.5 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all duration-150 outline-none',
  select: 'w-full px-4 py-2.5 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-400 transition-all duration-150 outline-none',
  button: {
    primary: 'px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2',
    secondary: 'px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2',
    success: 'px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2',
    danger: 'px-4 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2',
    flat: 'px-3.5 py-2 min-h-[40px] rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5',
    ghost: 'px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5',
  },
  chip: {
    excellent: 'px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold inline-flex items-center gap-1.5',
    normal: 'px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-bold inline-flex items-center gap-1.5',
    needs_followup: 'px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-xs font-bold inline-flex items-center gap-1.5',
  },
};
