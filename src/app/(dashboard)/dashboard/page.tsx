'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/Layout/PageContainer';
import {
  DashboardHeader,
  NeedsAttention,
  DashboardStats,
  QuickActions,
  RecentActivity,
  ClassQuickAccess,
  AnnouncementBanner,
} from '@/components/Dashboard';
import { LoadingSkeleton } from '@/components/UI/LoadingSkeleton';
import { Note, FollowUp, Student, ClassRoom } from '@/lib/types';
import { checkAndNotifyUrgentFollowUps } from '@/lib/notifications';
import { useToast } from '@/components/UI/Toast';

// Lazy-load action modals to keep initial JS bundle small and execution fast
const AddEditNoteModal = dynamic(
  () => import('@/components/Notes/AddEditNoteModal').then((mod) => mod.AddEditNoteModal),
  { ssr: false }
);
const ResolveFollowUpModal = dynamic(
  () => import('@/components/FollowUps/ResolveFollowUpModal').then((mod) => mod.ResolveFollowUpModal),
  { ssr: false }
);

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [resolvingFollowUp, setResolvingFollowUp] = useState<FollowUp | null>(null);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [quickNoteStudent, setQuickNoteStudent] = useState<Student | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dashRes, classRes, stuRes, annRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/classes'),
        fetch('/api/students'),
        fetch('/api/announcements'),
      ]);
      const [dashData, classData, stuData, annData] = await Promise.all([
        dashRes.json().catch(() => ({ stats: null })),
        classRes.json().catch(() => ({ classes: [] })),
        stuRes.json().catch(() => ({ students: [] })),
        annRes.json().catch(() => ({ announcements: [] })),
      ]);

      const fetchedStats = dashData.stats || {
        totalGrades: 0,
        totalClasses: 0,
        totalStudents: 0,
        totalNotes: 0,
        totalClassNotes: 0,
        pendingFollowUps: 0,
        notesToday: 0,
        notesThisWeek: 0,
        notesThisMonth: 0,
        recentNotes: [],
        urgentFollowUps: [],
      };

      setStats(fetchedStats);
      if (fetchedStats.teacherName) {
        setUser({ name: fetchedStats.teacherName });
      }
      setClasses(classData.classes || []);
      setStudents(stuData.students || []);
      setAnnouncements(annData.announcements || []);

      if (fetchedStats.urgentFollowUps) {
        checkAndNotifyUrgentFollowUps(fetchedStats.urgentFollowUps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = () => loadDashboardData();
    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, [loadDashboardData]);

  return (
    <PageContainer>
      {/* 1. Header with greeting and primary CTA (Immutable position at top - Zero CLS) */}
      <DashboardHeader
        teacherName={user?.name}
        totalStudents={stats?.totalStudents || 0}
        onOpenAddNote={() => {
          setQuickNoteStudent(null);
          setIsAddNoteOpen(true);
        }}
      />

      {loading ? (
        <div className="space-y-6 pt-2">
          <LoadingSkeleton count={4} type="metric" />
          <LoadingSkeleton count={3} type="card" />
        </div>
      ) : (
        <>
          {/* Platform Announcements (below header so hero never shifts) */}
          <AnnouncementBanner initialAnnouncements={announcements} />

          {/* 2. Needs Attention (High Priority) */}
          <NeedsAttention
            urgentFollowUps={stats?.urgentFollowUps}
            pendingCount={stats?.pendingFollowUps}
            onResolveFollowUp={(f) => setResolvingFollowUp(f)}
          />

          {/* 3. Primary Statistics Grid */}
          <DashboardStats
            totalStudents={stats?.totalStudents}
            totalNotes={stats?.totalNotes}
            notesToday={stats?.notesToday}
            pendingFollowUps={stats?.pendingFollowUps}
          />

          {/* 4. Quick Actions */}
          <QuickActions
            onOpenAddNote={() => {
              setQuickNoteStudent(null);
              setIsAddNoteOpen(true);
            }}
          />

          {/* 5. Class Quick Access & Students */}
          <ClassQuickAccess
            classes={classes}
            students={students}
            selectedClassId={selectedClassId}
            onSelectClassId={(id) => setSelectedClassId(id)}
            onQuickNote={(student) => {
              setQuickNoteStudent(student);
              setIsAddNoteOpen(true);
            }}
          />

          {/* 6. Recent Activity & Notes Timeline */}
          <RecentActivity recentNotes={stats?.recentNotes} />
        </>
      )}

      {/* Add Note Modal (Lazy Loaded) */}
      {isAddNoteOpen && (
        <AddEditNoteModal
          isOpen={true}
          onClose={() => setIsAddNoteOpen(false)}
          initialStudent={quickNoteStudent}
          onSuccess={() => {
            setIsAddNoteOpen(false);
            loadDashboardData();
            toast.success('تم تدوين الملاحظة بنجاح');
          }}
        />
      )}

      {/* Resolve Follow Up Modal (Lazy Loaded) */}
      {resolvingFollowUp && (
        <ResolveFollowUpModal
          isOpen={true}
          followUp={resolvingFollowUp}
          onClose={() => setResolvingFollowUp(null)}
          onSuccess={() => {
            setResolvingFollowUp(null);
            loadDashboardData();
          }}
        />
      )}
    </PageContainer>
  );
}
