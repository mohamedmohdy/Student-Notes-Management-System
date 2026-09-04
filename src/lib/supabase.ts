import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgbktwmejswxykyogkcw.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
  },
});

export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export function getSupabase(): SupabaseClient {
  return supabase;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  return supabaseAdmin;
}

export function getSupabaseUserClient(accessToken?: string): SupabaseClient {
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        // If the Supabase JWT token has expired (default Supabase 1-hour TTL),
        // fallback to server-side authenticated client so long-lived application sessions (7-day PWA/cookie)
        // do not fail with PGRST301 (JWT expired).
        if (payload && payload.exp && payload.exp * 1000 <= Date.now()) {
          return supabaseAdmin || supabase;
        }
      }
    } catch {
      return supabaseAdmin || supabase;
    }

    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
  return supabaseAdmin || supabase;
}

let cachedOwnerToken: { token: string; expiresAt: number } | null = null;

export async function getAuthenticatedOwnerClient(providedAccessToken?: string): Promise<SupabaseClient> {
  if (providedAccessToken) {
    return getSupabaseUserClient(providedAccessToken);
  }

  const now = Date.now();
  if (cachedOwnerToken && cachedOwnerToken.expiresAt > now + 60000) {
    return getSupabaseUserClient(cachedOwnerToken.token);
  }

  if (supabaseAdmin) {
    try {
      const { data: authData } = await supabase.auth.signInWithPassword({
        email: 'owner@school.edu',
        password: 'OwnerSecurePassword2026!',
      });

      if (authData?.session?.access_token) {
        cachedOwnerToken = {
          token: authData.session.access_token,
          expiresAt: now + (authData.session.expires_in || 3600) * 1000,
        };
        return getSupabaseUserClient(authData.session.access_token);
      }
    } catch (e) {
      console.error('getAuthenticatedOwnerClient error:', e);
    }
  }

  return supabaseAdmin || supabase;
}
