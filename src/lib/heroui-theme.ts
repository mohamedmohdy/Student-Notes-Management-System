// HeroUI Design System Class Tokens & Component Variants (Light & Dark)
export const heroTheme = {
  card: 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200/60 dark:hover:border-indigo-500/30 transition-all duration-300 text-slate-900 dark:text-slate-100',
  glassCard: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-xl shadow-indigo-950/5 rounded-3xl text-slate-900 dark:text-slate-100',
  darkCard: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-2xl border border-indigo-500/20',
  input: 'w-full px-4 py-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none',
  button: {
    primary: 'px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2',
    secondary: 'px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-2',
    success: 'px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2',
    danger: 'px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2',
    flat: 'px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5',
    ghost: 'px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5',
  },
  chip: {
    excellent: 'px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-black inline-flex items-center gap-1.5',
    normal: 'px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-black inline-flex items-center gap-1.5',
    needs_followup: 'px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 text-xs font-black inline-flex items-center gap-1.5',
  },
};
