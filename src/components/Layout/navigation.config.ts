import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  Clock,
  BarChart3,
  Settings,
  LifeBuoy,
  Megaphone,
  Sliders,
  LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  tourKey?: string;
  badge?: string;
  exact?: boolean;
}

// Teacher Workspace Primary Navigation Items
export const teacherPrimaryNavItems: NavItemConfig[] = [
  { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, tourKey: 'dashboard', exact: true },
  { label: 'دليل الطلاب', href: '/students', icon: Users, tourKey: 'students' },
  { label: 'سجل الملاحظات', href: '/notes', icon: FileText, tourKey: 'notes' },
  { label: 'المتابعات', href: '/follow-ups', icon: Clock, tourKey: 'follow-ups' },
  { label: 'الصفوف والفصول', href: '/grades', icon: GraduationCap, tourKey: 'grades' },
  { label: 'التقارير والتصدير', href: '/reports', icon: BarChart3, tourKey: 'reports' },
];

// Teacher Workspace Secondary / More Navigation Items
export const teacherSecondaryNavItems: NavItemConfig[] = [
  { label: 'الإعدادات والبيانات', href: '/settings', icon: Settings, tourKey: 'settings' },
  { label: 'الدعم الفني', href: '/support', icon: LifeBuoy, tourKey: 'support' },
];

// Teacher Mobile Bottom Navigation Primary Items (Max 4 items + "المزيد")
export const teacherMobileBottomItems: NavItemConfig[] = [
  { label: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'الطلاب', href: '/students', icon: Users },
  { label: 'الملاحظات', href: '/notes', icon: FileText },
  { label: 'المتابعات', href: '/follow-ups', icon: Clock },
];

// Owner Workspace Navigation Items
export const ownerNavItems: NavItemConfig[] = [
  { label: 'لوحة التحكم', href: '/owner', icon: LayoutDashboard, exact: true },
  { label: 'إدارة المعلمين', href: '/owner/teachers', icon: Users },
  { label: 'الإعلانات العامة', href: '/owner/announcements', icon: Megaphone },
  { label: 'إعدادات الدخول', href: '/owner/login-settings', icon: Sliders },
  { label: 'مركز الدعم الفني', href: '/owner/support', icon: LifeBuoy },
];

// Active Route Matcher Helper
export function isRouteActive(currentPath: string, targetHref: string, exact: boolean = false): boolean {
  if (exact || targetHref === '/dashboard' || targetHref === '/owner') {
    return currentPath === targetHref;
  }
  return currentPath === targetHref || currentPath.startsWith(targetHref + '/');
}
