import { RateLimitPolicy, RateLimitPolicyConfig } from './types';

export const RATE_LIMIT_POLICIES: Record<RateLimitPolicy, RateLimitPolicyConfig> = {
  AUTH: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    failStrategy: 'fail-closed',
    description: 'حماية المصادقة وتسجيل الدخول من التخمين المتكرر (Brute Force)',
  },
  TEACHER: {
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute
    failStrategy: 'fail-open',
    description: 'واجهات المعلم الأساسية (الطلاب، الفصول، الملاحظات، المتابعات)',
  },
  AI: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    failStrategy: 'fail-closed',
    description: 'المساعد الذكي والمحلل التربوي (AI Copilot & Analyst)',
  },
  EXPORT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 requests per 5 minutes
    failStrategy: 'fail-closed',
    description: 'تصدير واستيراد البيانات وملفات Excel',
  },
  BACKUP: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per 5 minutes
    failStrategy: 'fail-closed',
    description: 'عمليات إعادة الضبط والتهيئة الشاملة (Reset & Seed)',
  },
  OWNER: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    failStrategy: 'fail-closed',
    description: 'لوحة تحكم مالك المنصة وإدارة المعلمين',
  },
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    failStrategy: 'fail-open',
    description: 'الواجهات العامة المتاحة للزوار (الأسعار وشعار النظام)',
  },
};
