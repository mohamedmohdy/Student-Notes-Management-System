'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { GlobalSearchModal } from '@/components/Layout/GlobalSearchModal';
import { AddEditNoteModal } from '@/components/Notes/AddEditNoteModal';
import { InteractiveTour } from '@/components/Tour/InteractiveTour';
import { FloatingAnalystButton } from '@/components/AI/FloatingAnalystButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!data.user) {
          router.replace('/login');
          return;
        }

        const role = (data.user.role || '').toUpperCase();
        const status = data.user.status;

        // Route Guard for pending, disabled, or forced password change
        if (role !== 'OWNER' && role !== 'ADMIN') {
          if (status === 'pending') {
            router.replace('/pending-activation');
            return;
          }
          if (status === 'disabled') {
            router.replace('/account-disabled');
            return;
          }
          if (data.user.must_change_password === 1) {
            router.replace('/change-password');
            return;
          }
        }

        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500">جاري التحقق من الجلسة والصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAddNote={() => setAddNoteOpen(true)}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Interactive Platform Tour */}
      <InteractiveTour />

      {/* Floating AI Data Analyst Button */}
      <FloatingAnalystButton />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <AddEditNoteModal
        isOpen={addNoteOpen}
        onClose={() => setAddNoteOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new Event('refresh-data'));
        }}
      />
    </div>
  );
}
