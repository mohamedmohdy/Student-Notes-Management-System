'use client';

import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { AIDataAnalystModal } from './AIDataAnalystModal';

export function FloatingAnalystButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          data-tour="ai-analyst"
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 active:scale-95 border border-white/20"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:scale-110 transition duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
          </div>

          <div className="text-right">
            <p className="text-xs font-black leading-none">التحليل الذكي</p>
            <p className="text-[9px] text-indigo-200 font-bold mt-0.5">AI Analyst</p>
          </div>
        </button>
      </div>

      <AIDataAnalystModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
