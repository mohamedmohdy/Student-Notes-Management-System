import { supabase, supabaseAdmin } from '../supabase';
import { User, UserStatus, OwnerStats } from '../types';
import { invalidateUserAuthCache } from '../auth';
import { PricingRepository } from './pricing.repository';
import { toNum, toBool } from './base';

export const UserRepository = {
  findByEmail: async (email: string): Promise<(User & { password_hash?: string }) | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      must_change_password: toNum(data.must_change_password),
      onboarding_completed: toNum(data.onboarding_completed),
      onboarding_skipped: toNum(data.onboarding_skipped),
    };
  },

  findById: async (id: string, client?: any): Promise<User | null> => {
    const activeClient = client || supabase;
    const { data, error } = await activeClient
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      must_change_password: toNum(data.must_change_password),
      onboarding_completed: toNum(data.onboarding_completed),
      onboarding_skipped: toNum(data.onboarding_skipped),
    };
  },

  getOnboardingStatus: async (userId: string): Promise<{ completed: boolean; skipped: boolean; version: number; shouldShowTour: boolean }> => {
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed, onboarding_skipped, onboarding_version, role')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return { completed: false, skipped: false, version: 1, shouldShowTour: false };
    }

    const completed = toBool(data.onboarding_completed);
    const skipped = toBool(data.onboarding_skipped);
    const version = Number(data.onboarding_version) || 1;
    const isTeacher = String(data.role).toUpperCase() === 'TEACHER';
    const shouldShowTour = isTeacher && !completed && !skipped;
    return { completed, skipped, version, shouldShowTour };
  },

  updateOnboardingStatus: async (userId: string, action: 'complete' | 'skip' | 'reset', version: number = 1): Promise<{ completed: boolean; skipped: boolean; version: number; shouldShowTour: boolean }> => {
    const now = new Date().toISOString();

    if (action === 'complete') {
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_skipped: false,
          onboarding_version: version,
          onboarding_completed_at: now,
          updated_at: now,
        })
        .eq('id', userId);
    } else if (action === 'skip') {
      await supabase
        .from('users')
        .update({
          onboarding_skipped: true,
          onboarding_version: version,
          updated_at: now,
        })
        .eq('id', userId);
    } else if (action === 'reset') {
      await supabase
        .from('users')
        .update({
          onboarding_completed: false,
          onboarding_skipped: false,
          onboarding_version: version,
          onboarding_completed_at: null,
          updated_at: now,
        })
        .eq('id', userId);
    }

    return UserRepository.getOnboardingStatus(userId);
  },

  create: async (data: { name: string; email: string; password_hash?: string; status?: UserStatus; must_change_password?: number; role?: string }): Promise<User> => {
    return UserRepository.createTeacher(data);
  },

  createTeacher: async (data: { name: string; email: string; password?: string; password_hash?: string; status?: UserStatus; must_change_password?: number }, client?: any): Promise<User> => {
    const now = new Date().toISOString();
    const status = data.status || 'pending';
    const mustChange = Boolean(data.must_change_password);
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    const adminClient = supabaseAdmin;

    if (!adminClient) {
      throw new Error('يتطلب إنشاء حسابات المعلمين من لوحة المالك إضافة مفتاح SUPABASE_SERVICE_ROLE_KEY في ملف .env.local لتسجيل الحسابات في Supabase Auth بدون قيود بريد.');
    }

    // 1. Create User in Supabase Auth GoTrue with email confirmed
    const { data: authResult, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: data.password || 'TempPass123!',
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        role: 'TEACHER',
      },
    });

    if (authError || !authResult?.user) {
      throw new Error(`فشل إنشاء حساب المعلم في Supabase Auth: ${authError?.message || 'خطأ غير معروف'}`);
    }
    const authUserId = authResult.user.id;

    if (!authUserId) {
      throw new Error('تعذر الحصول على معرف المستخدم (UUID) من Supabase Auth');
    }

    // 2. Insert or Upsert into public.users with the real Auth User ID
    const dbClient = adminClient || client || supabase;
    const { data: inserted, error: dbError } = await dbClient
      .from('users')
      .upsert({
        id: authUserId,
        name: cleanName,
        email: cleanEmail,
        role: 'TEACHER',
        status,
        must_change_password: mustChange,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (dbError || !inserted) {
      throw new Error(`خطأ في حفظ المعلم في قاعدة البيانات (public.users): ${dbError?.message || 'فشلت العملية'}`);
    }

    return {
      ...inserted,
      must_change_password: toNum(inserted.must_change_password),
    };
  },

  updateStatus: async (id: string, status: UserStatus, client?: any): Promise<User | null> => {
    try { invalidateUserAuthCache(id); } catch {}
    const now = new Date().toISOString();
    const dbClient = client || supabaseAdmin || supabase;
    const { data, error } = await dbClient
      .from('users')
      .update({ status, updated_at: now })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('updateStatus Supabase error:', error);
      throw error;
    }
    if (!data) return null;
    return {
      ...data,
      must_change_password: toNum(data.must_change_password),
    };
  },

  resetPasswordByOwner: async (id: string, password_hash: string): Promise<boolean> => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('users')
      .update({ must_change_password: true, updated_at: now })
      .eq('id', id);

    return !error;
  },

  changePassword: async (id: string, password_hash: string): Promise<boolean> => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('users')
      .update({ must_change_password: false, updated_at: now })
      .eq('id', id);

    return !error;
  },

  updatePassword: async (id: string, newPasswordPlain: string, mustChangePassword: boolean = false, client?: any): Promise<void> => {
    const now = new Date().toISOString();
    if (supabaseAdmin && newPasswordPlain) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPasswordPlain });
      if (authErr) {
        console.error('Supabase Auth update password error:', authErr);
        throw authErr;
      }
    }
    const dbClient = client || supabase;
    const { error } = await dbClient
      .from('users')
      .update({ must_change_password: mustChangePassword, updated_at: now })
      .eq('id', id);

    if (error) {
      console.error('updatePassword Supabase error:', error);
      throw error;
    }
  },

  deleteTeacherPermanent: async (teacherId: string, client?: any): Promise<boolean> => {
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(teacherId);
    }
    const dbClient = client || supabase;
    const { error } = await dbClient.from('users').delete().eq('id', teacherId);
    if (error) {
      console.error('deleteTeacherPermanent Supabase error:', error);
      throw error;
    }
    return true;
  },

  updateTeacherProfile: async (teacherId: string, data: { name?: string; email?: string; status?: UserStatus }, client?: any): Promise<User | null> => {
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (data.status !== undefined) updatePayload.status = data.status;

    if (supabaseAdmin && data.email) {
      await supabaseAdmin.auth.admin.updateUserById(teacherId, {
        email: data.email.trim().toLowerCase(),
        user_metadata: data.name ? { name: data.name.trim() } : undefined,
      });
    }

    const dbClient = client || supabase;
    const { data: updated, error } = await dbClient
      .from('users')
      .update(updatePayload)
      .eq('id', teacherId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('updateTeacherProfile Supabase error:', error);
      throw error;
    }
    if (!updated) return null;
    return {
      ...updated,
      must_change_password: toNum(updated.must_change_password),
    };
  },

  updateLastLogin: async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase
      .from('users')
      .update({ last_login: now, updated_at: now })
      .eq('id', id);
  },

  getAllTeachers: async (filters?: { status?: UserStatus; search?: string }, client?: any): Promise<User[]> => {
    const dbClient = client || supabaseAdmin || supabase;
    let query = dbClient
      .from('users')
      .select(`
        *,
        students(count),
        notes(count)
      `)
      .in('role', ['TEACHER', 'teacher'])
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      must_change_password: toNum(u.must_change_password),
      last_login: u.last_login,
      created_at: u.created_at,
      updated_at: u.updated_at,
      students_count: u.students?.[0]?.count || 0,
      notes_count: u.notes?.[0]?.count || 0,
    }));
  },

  getOwnerStats: async (client?: any): Promise<OwnerStats> => {
    const dbClient = client || supabaseAdmin || supabase;

    // Parallelized Single-Roundtrip Data Aggregation for Owner Dashboard
    const [allTeachers, studentsCountRes, notesCountRes] = await Promise.all([
      UserRepository.getAllTeachers(undefined, dbClient),
      dbClient.from('students').select('*', { count: 'exact', head: true }).eq('archived', false),
      dbClient.from('notes').select('*', { count: 'exact', head: true }).eq('archived', false),
    ]);

    const totalTeachers = allTeachers.length;
    let activeCount = 0;
    let pendingCount = 0;
    let disabledCount = 0;

    allTeachers.forEach((t) => {
      if (t.status === 'active') activeCount++;
      else if (t.status === 'pending') pendingCount++;
      else if (t.status === 'disabled') disabledCount++;
    });

    const totalStudents = studentsCountRes.count || 0;
    const totalNotes = notesCountRes.count || 0;

    const pricing = await PricingRepository.getPricingInfo(activeCount, dbClient);

    let totalRevenue = 0;
    if (activeCount <= 5) {
      totalRevenue = activeCount * 50;
    } else {
      totalRevenue = (5 * 50) + ((activeCount - 5) * 100);
    }

    const recentTeachers = allTeachers.slice(0, 5);

    return {
      totalTeachers,
      activeTeachers: activeCount,
      pendingTeachers: pendingCount,
      disabledTeachers: disabledCount,
      totalStudents,
      totalNotes,
      totalRevenue,
      pricing,
      recentTeachers,
    };
  },

  logActivity: async (userId: string | null, action: string, details: string): Promise<void> => {
    await UserRepository.logAudit(userId, action, details);
  },

    createPasswordReset: async (email: string, code: string, expiresAt?: string): Promise<void> => {
    await supabase.from('audit_logs').insert({
      action: 'PASSWORD_RESET_CODE',
      details: JSON.stringify({ email: email.toLowerCase().trim(), code, expiresAt }),
      created_at: new Date().toISOString(),
    });
  },

  verifyPasswordReset: async (email: string, code: string): Promise<boolean> => {
    const { data } = await supabase
      .from('audit_logs')
      .select('details, created_at')
      .eq('action', 'PASSWORD_RESET_CODE')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data) return false;
    for (const row of data) {
      try {
        const parsed = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
        if (parsed.email === email.toLowerCase().trim() && parsed.code === code) {
          const exp = new Date(parsed.expiresAt).getTime();
          if (exp > Date.now()) return true;
        }
      } catch {}
    }
    return false;
  },

  clearPasswordReset: async (email: string): Promise<void> => {
    // Audit-based password reset code consumed
  },

  logAudit: async (userId: string | null, action: string, details: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      details,
      created_at: now,
    });
  },
};
