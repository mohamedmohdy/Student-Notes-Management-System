'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  FollowUpsWorkspaceHeader,
  FollowUpCard,
  ResolveFollowUpModal,
} from '@/components/FollowUps';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { FollowUp } from '@/lib/types';
import { Clock } from 'lucide-react';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [resolvingFollowUp, setResolvingFollowUp] = useState<FollowUp | null>(null);

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await fetch(`/api/follow-ups?${params.toString()}`);
      const data = await res.json();
      setFollowUps(data.followUps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadFollowUps();
  }, [loadFollowUps]);

  const tabs = [
    { id: 'all', label: 'كافة المتابعات' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'completed', label: 'تمت المتابعة' },
    { id: 'still_needs_followup', label: 'تحتاج متابعة إضافية' },
  ];

  const pendingCount = followUps.filter((f) => f.status === 'pending').length;

  return (
    <PageContainer>
      {/* 1. Header */}
      <FollowUpsWorkspaceHeader
        totalCount={followUps.length}
        pendingCount={pendingCount}
      />

      {/* 2. Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl self-start">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Follow-ups Cards List */}
      {loading ? (
        <LoadingSkeleton count={3} type="card" />
      ) : followUps.length === 0 ? (
        <EmptyState
          title="لا توجد متابعات مطابقة"
          description="الملاحظات التي يتم تحديد خيار (تحتاج متابعة) لها ستظهر تلقائياً في هذا القسم."
          icon={<Clock className="w-10 h-10" />}
        />
      ) : (
        <div className="space-y-4">
          {followUps.map((fu) => (
            <FollowUpCard
              key={fu.id}
              followUp={fu}
              onResolve={(f) => setResolvingFollowUp(f)}
            />
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      <ResolveFollowUpModal
        isOpen={!!resolvingFollowUp}
        onClose={() => setResolvingFollowUp(null)}
        onSuccess={loadFollowUps}
        followUp={resolvingFollowUp}
      />
    </PageContainer>
  );
}
