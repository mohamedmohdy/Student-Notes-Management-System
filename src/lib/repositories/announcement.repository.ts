import { supabase, supabaseAdmin } from '../supabase';
import { Announcement, AnnouncementType } from '../types';
import { toNum, toBool } from './base';

export const AnnouncementRepository = {
  getAll: async (filters?: { isPublished?: boolean; search?: string }): Promise<Announcement[]> => {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        announcement_reads(count)
      `)
      .order('created_at', { ascending: false });

    if (filters?.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished);
    }
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      is_published: toNum(a.is_published),
      expires_at: a.expires_at,
      created_at: a.created_at,
      updated_at: a.updated_at,
      reads_count: a.announcement_reads?.[0]?.count || 0,
    }));
  },

  getAllForOwner: async (filters?: { isPublished?: boolean; search?: string }): Promise<Announcement[]> => {
    return AnnouncementRepository.getAll(filters);
  },

  getActiveForTeacher: async (userId: string, client?: any): Promise<Announcement[]> => {
    const db = client || supabase;
    const [annRes, readsRes] = await Promise.all([
      db
        .from('announcements')
        .select('id, title, content, type, is_published, expires_at, created_at, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      db
        .from('announcement_reads')
        .select('announcement_id, is_read, is_hidden')
        .eq('user_id', userId),
    ]);

    const annData = annRes.data || [];
    const readsData = readsRes.data || [];
    const readsMap = new Map<string, any>(readsData.map((r: any) => [r.announcement_id, r]));

    return annData
      .filter((a: any) => {
        const read = readsMap.get(a.id) as any;
        return !read || !toBool(read.is_hidden);
      })
      .map((a: any) => {
        const read = readsMap.get(a.id) as any;
        return {
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.type,
          is_published: toNum(a.is_published),
          expires_at: a.expires_at,
          created_at: a.created_at,
          updated_at: a.updated_at,
          is_read: read ? toNum(read.is_read) : 0,
          is_hidden: read ? toNum(read.is_hidden) : 0,
        };
      });
  },

  findById: async (id: string): Promise<Announcement | null> => {
    return AnnouncementRepository.getById(id);
  },

  getById: async (id: string): Promise<Announcement | null> => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      ...data,
      is_published: toNum(data.is_published),
    };
  },

  create: async (data: { title: string; content: string; type: AnnouncementType; is_published?: boolean; expires_at?: string }): Promise<Announcement> => {
    const db = supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const isPublished = data.is_published !== false;

    const { data: inserted, error } = await db
      .from('announcements')
      .insert({
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type,
        is_published: isPublished,
        expires_at: data.expires_at || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !inserted) throw error || new Error('Failed to create announcement');
    return {
      ...inserted,
      is_published: toNum(inserted.is_published),
    };
  },

  update: async (id: string, data: { title?: string; content?: string; type?: AnnouncementType; is_published?: boolean; expires_at?: string }): Promise<Announcement | null> => {
    const db = supabaseAdmin || supabase;
    const now = new Date().toISOString();
    const updatePayload: any = { updated_at: now };

    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.content !== undefined) updatePayload.content = data.content.trim();
    if (data.type !== undefined) updatePayload.type = data.type;
    if (data.is_published !== undefined) updatePayload.is_published = data.is_published;
    if (data.expires_at !== undefined) updatePayload.expires_at = data.expires_at || null;

    const { data: updated, error } = await db
      .from('announcements')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !updated) return null;
    return {
      ...updated,
      is_published: toNum(updated.is_published),
    };
  },

  delete: async (id: string): Promise<boolean> => {
    const db = supabaseAdmin || supabase;
    const { error } = await db.from('announcements').delete().eq('id', id);
    return !error;
  },

  togglePublish: async (id: string): Promise<Announcement | null> => {
    const current = await AnnouncementRepository.getById(id);
    if (!current) return null;
    const newStatus = current.is_published !== 1;
    return AnnouncementRepository.update(id, { is_published: newStatus });
  },

  markAsRead: async (announcementId: string, userId: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase.from('announcement_reads').upsert({
      announcement_id: announcementId,
      user_id: userId,
      is_read: true,
      read_at: now,
      created_at: now,
    }, { onConflict: 'announcement_id,user_id' });
  },

  markAsHidden: async (announcementId: string, userId: string): Promise<void> => {
    const now = new Date().toISOString();
    await supabase.from('announcement_reads').upsert({
      announcement_id: announcementId,
      user_id: userId,
      is_hidden: true,
      hidden_at: now,
      created_at: now,
    }, { onConflict: 'announcement_id,user_id' });
  },
};
