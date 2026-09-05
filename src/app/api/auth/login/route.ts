import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/db';
import { verifyPassword, createToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { supabase, getSupabaseUserClient } from '@/lib/supabase';
import { rateLimitGuard } from '@/lib/security/rate-limit';
import { parseJsonWithLimit } from '@/lib/security/request-size-limiter';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimitGuard(request, 'AUTH', { action: 'login' });
    if (rateLimitResponse) return rateLimitResponse;

    const { data: body, errorResponse } = await parseJsonWithLimit<{ email?: string; password?: string }>(request, 'AUTH');
    if (errorResponse) return errorResponse;

    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth Sign In first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    let user: any = null;
    let supabaseAccessToken: string | undefined = undefined;

    if (authData?.session && authData.user) {
      supabaseAccessToken = authData.session.access_token;
      const userClient = getSupabaseUserClient(supabaseAccessToken);
      const { data: profile } = await userClient
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profile) {
        user = profile;
      } else {
        user = {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: authData.user.user_metadata?.role || 'TEACHER',
          status: 'active',
          must_change_password: 0,
        };
      }
    } else {
      // 2. Fallback to UserRepository check from public.users
      user = await UserRepository.findByEmail(cleanEmail);
      if (!user) {
        return NextResponse.json(
          { error: authError?.message === 'Email not confirmed' ? 'يرجى تأكيد البريد الإلكتروني أولاً' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
          { status: 401 }
        );
      }

      if (user.password_hash) {
        const isValid = verifyPassword(password, user.password_hash);
        if (!isValid) {
          return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
        }
      } else {
        // Supabase Auth failed and no fallback password_hash exists
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
      }
    }

    // Update last login timestamp
    await UserRepository.updateLastLogin(user.id);

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      must_change_password: user.must_change_password || 0,
      supabaseAccessToken,
    });

    const isOwner = String(user.role).toUpperCase() === 'OWNER';
    let redirectUrl = '/dashboard';

    if (isOwner) {
      redirectUrl = '/owner';
    } else if (user.status === 'pending') {
      redirectUrl = '/pending-activation';
    } else if (user.status === 'disabled') {
      redirectUrl = '/account-disabled';
    } else if (user.must_change_password === 1) {
      redirectUrl = '/change-password';
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        must_change_password: user.must_change_password || 0,
      },
      redirectUrl,
      message: 'تم تسجيل الدخول بنجاح',
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
}
