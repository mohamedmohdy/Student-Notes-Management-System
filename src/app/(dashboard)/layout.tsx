'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';

// Lazy-load non-critical interactive overlays to reduce initial JS execution and render delay
const GlobalSearchModal = dynamic(
  () => import('@/components/Layout/GlobalSearchModal').then((mod) => mod.GlobalSearchModal),
  { ssr: false }
);
const InteractiveTour = dynamic(
  () => import('@/components/Tour/InteractiveTour').then((mod) => mod.InteractiveTour),
  { ssr: false }
);
const FloatingAnalystButton = dynamic(
  () => import('@/components/AI/FloatingAnalystButton').then((mod) => mod.FloatingAnalystButton),
  { ssr: false }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
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

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Desktop & Drawer Sidebar */}
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
          user={user}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav user={user} />

      {/* Global Search & Tour Modals (Lazy Loaded) */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <InteractiveTour />
      <FloatingAnalystButton />
    </div>
  );
}
