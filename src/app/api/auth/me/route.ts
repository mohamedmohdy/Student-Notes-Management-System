import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRepository } from '@/lib/db';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const user = UserRepository.findById(session.userId);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
