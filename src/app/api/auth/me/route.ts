import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getSessionFromRequest, getVerifiedUser } from '@/lib/auth';
import { getSupabaseUserClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request) || await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const client = getSupabaseUserClient(session.supabaseAccessToken);
    const dbUser = await getVerifiedUser(session.userId, client);
    const user = dbUser || {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      status: session.status,
      must_change_password: session.must_change_password || 0,
    };

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
