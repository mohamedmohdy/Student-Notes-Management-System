import React from 'react';

export function LoadingSkeleton({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'table' | 'profile' }) {
  if (type === 'table') {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-100 p-4 space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-xl w-1/4"></div>
        <div className="space-y-2">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded-lg w-1/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 space-y-3">
          <div className="h-5 bg-slate-200 rounded-lg w-2/3"></div>
          <div className="h-4 bg-slate-100 rounded-lg w-1/2"></div>
          <div className="h-8 bg-slate-50 rounded-xl w-full"></div>
        </div>
      ))}
    </div>
  );
}
