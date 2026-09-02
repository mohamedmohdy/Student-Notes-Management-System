'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  SupportWorkspaceHeader,
  SupportTicketCard,
  AddSupportTicketModal,
  TicketDetailsModal,
} from '@/components/Support';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { EmptyState } from '@/components/UI/EmptyState';
import { useToast } from '@/components/UI/Toast';
import { SupportTicket } from '@/lib/types';
import { LifeBuoy } from 'lucide-react';

export default function TeacherSupportPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      const [ticketsRes, userRes] = await Promise.all([
        fetch('/api/support/tickets'),
        fetch('/api/auth/me'),
      ]);
      const tData = await ticketsRes.json();
      const uData = await userRes.json();

      setTickets(tData.tickets || []);
      setUser(uData.user);
    } catch (err) {
      console.error(err);
      toast.error('تعذر جلب تذاكر الدعم الفني');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return (
    <PageContainer>
      {/* 1. Header with Title and Primary Action */}
      <SupportWorkspaceHeader onOpenAddTicket={() => setIsAddOpen(true)} />

      {/* 2. Tickets List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
            تذاكري المسجلة ({tickets.length})
          </h3>
          <span className="text-xs font-semibold text-slate-400">متابعة حالة التذاكر والردود الواردة</span>
        </div>

        {loading ? (
          <LoadingSkeleton count={3} type="card" />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="لا توجد تذاكر دعم فني مسجلة حالياً"
            description="إذا واجهت أي استفسار أو مشكلة في المنصة، اضغط أدناه لإنشاء أول تذكرة دعم وسنكون سعداء بمساعدتك."
            actionLabel="+ إنشاء تذكرة دعم الآن"
            onAction={() => setIsAddOpen(true)}
            icon={<LifeBuoy className="w-10 h-10" />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tickets.map((ticket) => (
              <SupportTicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSupportTicketModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadTickets}
        user={user}
      />

      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </PageContainer>
  );
}
