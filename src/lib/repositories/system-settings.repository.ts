import { supabase, supabaseAdmin } from '../supabase';
import { LoginBannerSettings } from '../types';

export const SystemSettingsRepository = {
  get: async (key: string): Promise<any> => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return null;
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
  },

  set: async (key: string, value: any): Promise<void> => {
    const now = new Date().toISOString();
    const dbClient = supabaseAdmin || supabase;
    await dbClient
      .from('system_settings')
      .upsert({
        key,
        value: typeof value === 'object' ? value : { data: value },
        updated_at: now,
      });
  },

  getLoginBanner: async (): Promise<LoginBannerSettings> => {
    const saved = await SystemSettingsRepository.get('login_banner');
    if (saved) {
      return {
        title: saved.title ?? '🎉 عرض الإطلاق الحصري للمعلمين',
        content: saved.content ?? 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
        priceText: saved.priceText ?? '50 ريال سعودي',
        badgeText: saved.badgeText ?? 'عرض خاص',
        isActive: saved.isActive !== undefined ? Boolean(saved.isActive) : true,
        updatedAt: saved.updatedAt,
      };
    }
    return {
      title: '🎉 عرض الإطلاق الحصري للمعلمين',
      content: 'احصل على التفعيل الكامل للمنظومة لمرة واحدة مدى الحياة بدون أي اشتراكات دورية.',
      priceText: '50 ريال سعودي',
      badgeText: 'عرض خاص',
      isActive: true,
    };
  },

  updateLoginBanner: async (settings: Partial<LoginBannerSettings>): Promise<LoginBannerSettings> => {
    const current = await SystemSettingsRepository.getLoginBanner();
    const updated: LoginBannerSettings = {
      title: settings.title !== undefined ? String(settings.title).trim() : current.title,
      content: settings.content !== undefined ? String(settings.content).trim() : current.content,
      priceText: settings.priceText !== undefined ? String(settings.priceText).trim() : current.priceText,
      badgeText: settings.badgeText !== undefined ? String(settings.badgeText).trim() : current.badgeText,
      isActive: settings.isActive !== undefined ? Boolean(settings.isActive) : current.isActive,
      updatedAt: new Date().toISOString(),
    };
    await SystemSettingsRepository.set('login_banner', updated);
    return updated;
  },
};
