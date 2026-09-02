'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export function PasswordInput({
  label = 'كلمة المرور',
  error,
  id = 'password',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-right">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`w-full min-h-[44px] bg-slate-50 dark:bg-slate-800/80 border ${
            error ? 'border-rose-400 dark:border-rose-600' : 'border-slate-200 dark:border-slate-700'
          } rounded-xl pr-10 pl-11 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg flex items-center justify-center transition"
          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
