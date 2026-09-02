-- ==============================================================================
-- 🏛️ Supabase Database Architecture — Version 3 (Production Cloud SQL)
-- 🔒 Strict Supabase Cloud Native Schema: Native auth.users, Native auth.uid()
-- ==============================================================================

-- ==============================================================================
-- 1. جدول المستخدمين أولاً (Profiles & Roles) - يرتبط مباشرة بـ auth.users
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('OWNER', 'TEACHER')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disabled')),
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_skipped BOOLEAN NOT NULL DEFAULT false,
  onboarding_version INTEGER NOT NULL DEFAULT 1,
  onboarding_completed_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. الدوال المساعدة والأمنية (Security Definer Functions)
-- ==============================================================================

-- دالة فحص صلاحيات المالك بأمان من السيرفر
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
        AND role = 'OWNER'
        AND status = 'active'
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, anon, service_role;

-- دالة تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. إنشاء الجداول الـ 11 والقيود التكاملية (Tables & Composite FKs)
-- ==============================================================================

-- 2. جدول الصفوف الدراسية (Grades)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_grades_id_teacher UNIQUE (id, teacher_id)
);

-- 3. جدول الفصول الدراسية (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL,
  name TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_classes_id_teacher UNIQUE (id, teacher_id),
  CONSTRAINT fk_classes_grade_teacher FOREIGN KEY (grade_id, teacher_id) 
    REFERENCES public.grades(id, teacher_id) ON DELETE CASCADE
);

-- 4. جدول الطلاب (Students)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL,
  student_number TEXT NOT NULL,
  name TEXT NOT NULL,
  photo TEXT,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('excellent', 'normal', 'needs_followup')),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_students_id_teacher UNIQUE (id, teacher_id),
  CONSTRAINT uq_students_number_class UNIQUE (teacher_id, class_id, student_number),
  CONSTRAINT fk_students_class_teacher FOREIGN KEY (class_id, teacher_id) 
    REFERENCES public.classes(id, teacher_id) ON DELETE CASCADE
);

-- 5. جدول الملاحظات الفردية للطلاب (Notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'academic' CHECK (type IN ('academic', 'behavioral', 'participation', 'skill', 'positive', 'needs_followup', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  content TEXT NOT NULL,
  action_taken TEXT,
  requires_follow_up BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_notes_id_teacher UNIQUE (id, teacher_id),
  CONSTRAINT fk_notes_student_teacher FOREIGN KEY (student_id, teacher_id) 
    REFERENCES public.students(id, teacher_id) ON DELETE CASCADE
);

-- 6. جدول ملاحظات الفصل الجماعية (Class Notes)
CREATE TABLE IF NOT EXISTS public.class_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('behavior', 'engagement', 'discipline', 'academic', 'general')),
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_class_notes_class_teacher FOREIGN KEY (class_id, teacher_id) 
    REFERENCES public.classes(id, teacher_id) ON DELETE CASCADE
);

-- 7. جدول سجل المتابعات المستمرة (Follow-ups)
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL,
  student_id UUID NOT NULL,
  follow_up_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'still_needs_followup')),
  result TEXT,
  additional_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_followups_note_teacher FOREIGN KEY (note_id, teacher_id) 
    REFERENCES public.notes(id, teacher_id) ON DELETE CASCADE,
  CONSTRAINT fk_followups_student_teacher FOREIGN KEY (student_id, teacher_id) 
    REFERENCES public.students(id, teacher_id) ON DELETE CASCADE
);

-- 8. جدول تذاكر الدعم الفني للمعلمين (Support Tickets - Historical Retention)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL,
  teacher_email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('technical', 'login', 'students_data', 'reports', 'ai', 'suggestion', 'inquiry', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  admin_replied_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. جدول الإعلانات العامة للمنصة (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'event', 'update', 'warning', 'tip', 'offer')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. جدول تتبع قراءة وإخفاء الإعلانات (Announcement Reads)
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  hidden_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_announcement_user UNIQUE (announcement_id, user_id)
);

-- 11. جدول إعدادات النظام (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. جدول سجل العمليات والتدقيق الأمني (Audit Logs - Append Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. مشغلات التحديث التلقائي والأمان (Triggers)
-- ==============================================================================

-- مشغل إنشاء الملف الشخصي تلقائياً عند إنشاء مستخدم في auth.users
-- تم تأمينه تماماً بحيث يمنع حقن صلاحيات OWNER أو active من قبل الـ client metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    name,
    email,
    role,
    status,
    must_change_password
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(COALESCE(NEW.email, ''), '@', 1)),
    LOWER(COALESCE(NEW.email, '')),
    'TEACHER', -- إجبار الدور الأساسي لمنع التلاعب عبر user_metadata
    'pending', -- إجبار حالة الانتظار حتى التفعيل
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- مشغل منع رفع الصلاحيات أو تعديل الدور والحالة من قبل المستخدم العادي
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'غير مصرح لك بتعديل دور المستخدم (role).';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'غير مصرح لك بتعديل حالة الحساب (status).';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'لا يمكن تغيير معرف المستخدم (id).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- مشغلات updated_at التلقائية لكافة الجداول
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_grades_updated_at ON public.grades;
CREATE TRIGGER trg_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.notes;
CREATE TRIGGER trg_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_class_notes_updated_at ON public.class_notes;
CREATE TRIGGER trg_class_notes_updated_at BEFORE UPDATE ON public.class_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER trg_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON public.announcements;
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. فهارس الأداء المحسنة (Performance Indexes)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_grades_teacher ON public.grades(teacher_id, archived);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_grade ON public.classes(teacher_id, grade_id, archived);

CREATE INDEX IF NOT EXISTS idx_students_teacher_class ON public.students(teacher_id, class_id, archived);
CREATE INDEX IF NOT EXISTS idx_students_teacher_status ON public.students(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_students_teacher_name ON public.students(teacher_id, name);

CREATE INDEX IF NOT EXISTS idx_notes_teacher_student ON public.notes(teacher_id, student_id, archived);
CREATE INDEX IF NOT EXISTS idx_notes_teacher_created ON public.notes(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_teacher_type ON public.notes(teacher_id, type, archived);
CREATE INDEX IF NOT EXISTS idx_class_notes_teacher_class ON public.class_notes(teacher_id, class_id, note_date DESC);

CREATE INDEX IF NOT EXISTS idx_followups_teacher_status_date ON public.follow_ups(teacher_id, status, follow_up_date ASC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_teacher ON public.support_tickets(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_published_expires ON public.announcements(is_published, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON public.announcement_reads(user_id, announcement_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 6. تفعيل أمان مستوى الصف وسياسات الوصول المتكاملة (RLS Policies)
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- --- 1. سياسات users (فصل سياسة النفس عن المالك لمنع الـ Recursion بنسبة 100%) ---
DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "users_select_owner" ON public.users;
CREATE POLICY "users_select_owner" ON public.users
  FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "users_update_policy" ON public.users;
CREATE POLICY "users_update_policy" ON public.users
  FOR UPDATE USING (id = auth.uid() OR public.is_owner())
  WITH CHECK (id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "users_delete_policy" ON public.users;
CREATE POLICY "users_delete_policy" ON public.users
  FOR DELETE USING (public.is_owner());

-- --- 2. سياسات grades ---
DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;
CREATE POLICY "grades_select_policy" ON public.grades
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "grades_insert_policy" ON public.grades;
CREATE POLICY "grades_insert_policy" ON public.grades
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "grades_update_policy" ON public.grades;
CREATE POLICY "grades_update_policy" ON public.grades
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "grades_delete_policy" ON public.grades;
CREATE POLICY "grades_delete_policy" ON public.grades
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 3. سياسات classes ---
DROP POLICY IF EXISTS "classes_select_policy" ON public.classes;
CREATE POLICY "classes_select_policy" ON public.classes
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "classes_insert_policy" ON public.classes;
CREATE POLICY "classes_insert_policy" ON public.classes
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "classes_update_policy" ON public.classes;
CREATE POLICY "classes_update_policy" ON public.classes
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "classes_delete_policy" ON public.classes;
CREATE POLICY "classes_delete_policy" ON public.classes
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 4. سياسات students ---
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy" ON public.students
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
CREATE POLICY "students_insert_policy" ON public.students
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "students_update_policy" ON public.students;
CREATE POLICY "students_update_policy" ON public.students
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "students_delete_policy" ON public.students;
CREATE POLICY "students_delete_policy" ON public.students
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 5. سياسات notes ---
DROP POLICY IF EXISTS "notes_select_policy" ON public.notes;
CREATE POLICY "notes_select_policy" ON public.notes
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "notes_insert_policy" ON public.notes;
CREATE POLICY "notes_insert_policy" ON public.notes
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "notes_update_policy" ON public.notes;
CREATE POLICY "notes_update_policy" ON public.notes
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "notes_delete_policy" ON public.notes;
CREATE POLICY "notes_delete_policy" ON public.notes
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 6. سياسات class_notes ---
DROP POLICY IF EXISTS "class_notes_select_policy" ON public.class_notes;
CREATE POLICY "class_notes_select_policy" ON public.class_notes
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "class_notes_insert_policy" ON public.class_notes;
CREATE POLICY "class_notes_insert_policy" ON public.class_notes
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "class_notes_update_policy" ON public.class_notes;
CREATE POLICY "class_notes_update_policy" ON public.class_notes
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "class_notes_delete_policy" ON public.class_notes;
CREATE POLICY "class_notes_delete_policy" ON public.class_notes
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 7. سياسات follow_ups ---
DROP POLICY IF EXISTS "follow_ups_select_policy" ON public.follow_ups;
CREATE POLICY "follow_ups_select_policy" ON public.follow_ups
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "follow_ups_insert_policy" ON public.follow_ups;
CREATE POLICY "follow_ups_insert_policy" ON public.follow_ups
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "follow_ups_update_policy" ON public.follow_ups;
CREATE POLICY "follow_ups_update_policy" ON public.follow_ups
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "follow_ups_delete_policy" ON public.follow_ups;
CREATE POLICY "follow_ups_delete_policy" ON public.follow_ups
  FOR DELETE USING (teacher_id = auth.uid() OR public.is_owner());

-- --- 8. سياسات support_tickets (معالجة السجلات عند حذف المعلم SET NULL) ---
DROP POLICY IF EXISTS "support_tickets_select_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_select_policy" ON public.support_tickets
  FOR SELECT USING (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "support_tickets_insert_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_insert_policy" ON public.support_tickets
  FOR INSERT WITH CHECK (teacher_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "support_tickets_update_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_update_policy" ON public.support_tickets
  FOR UPDATE USING (teacher_id = auth.uid() OR public.is_owner())
  WITH CHECK (teacher_id = auth.uid() OR public.is_owner() OR (teacher_id IS NULL AND public.is_owner()));

DROP POLICY IF EXISTS "support_tickets_delete_policy" ON public.support_tickets;
CREATE POLICY "support_tickets_delete_policy" ON public.support_tickets
  FOR DELETE USING (public.is_owner());

-- --- 9. سياسات announcements ---
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
CREATE POLICY "announcements_select_policy" ON public.announcements
  FOR SELECT USING (is_published = true OR public.is_owner());

DROP POLICY IF EXISTS "announcements_insert_policy" ON public.announcements;
CREATE POLICY "announcements_insert_policy" ON public.announcements
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "announcements_update_policy" ON public.announcements;
CREATE POLICY "announcements_update_policy" ON public.announcements
  FOR UPDATE USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "announcements_delete_policy" ON public.announcements;
CREATE POLICY "announcements_delete_policy" ON public.announcements
  FOR DELETE USING (public.is_owner());

-- --- 10. سياسات announcement_reads ---
DROP POLICY IF EXISTS "announcement_reads_select_policy" ON public.announcement_reads;
CREATE POLICY "announcement_reads_select_policy" ON public.announcement_reads
  FOR SELECT USING (user_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "announcement_reads_insert_policy" ON public.announcement_reads;
CREATE POLICY "announcement_reads_insert_policy" ON public.announcement_reads
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "announcement_reads_update_policy" ON public.announcement_reads;
CREATE POLICY "announcement_reads_update_policy" ON public.announcement_reads
  FOR UPDATE USING (user_id = auth.uid() OR public.is_owner())
  WITH CHECK (user_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "announcement_reads_delete_policy" ON public.announcement_reads;
CREATE POLICY "announcement_reads_delete_policy" ON public.announcement_reads
  FOR DELETE USING (user_id = auth.uid() OR public.is_owner());

-- --- 11. سياسات system_settings (حماية الإعدادات الحساسة) ---
DROP POLICY IF EXISTS "system_settings_public_select_policy" ON public.system_settings;
CREATE POLICY "system_settings_public_select_policy" ON public.system_settings
  FOR SELECT USING (key = 'login_banner' OR public.is_owner());

DROP POLICY IF EXISTS "system_settings_owner_insert_policy" ON public.system_settings;
CREATE POLICY "system_settings_owner_insert_policy" ON public.system_settings
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "system_settings_owner_update_policy" ON public.system_settings;
CREATE POLICY "system_settings_owner_update_policy" ON public.system_settings
  FOR UPDATE USING (public.is_owner())
  WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "system_settings_owner_delete_policy" ON public.system_settings;
CREATE POLICY "system_settings_owner_delete_policy" ON public.system_settings
  FOR DELETE USING (public.is_owner());

-- --- 12. سياسات audit_logs (Append-Only محكم) ---
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR public.is_owner());

-- ملاحظة: لا توجد سياسات UPDATE أو DELETE لـ audit_logs لضمان بقائها غير قابلة للتعديل أو الحذف
