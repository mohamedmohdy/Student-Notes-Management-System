import { NextRequest, NextResponse } from 'next/server';
import { requireActiveTeacher } from '@/lib/auth';
import { UserRepository } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireActiveTeacher();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const status = await UserRepository.getOnboardingStatus(auth.user.userId);
    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json({ error: 'فشل جلب حالة الجولة التعريفية' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireActiveTeacher();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, version } = body; // action: 'complete' | 'skip' | 'reset'

    if (!action || !['complete', 'skip', 'reset'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const updated = await UserRepository.updateOnboardingStatus(
      auth.user.userId,
      action as 'complete' | 'skip' | 'reset',
      version || 1
    );

    return NextResponse.json({
      success: true,
      status: updated,
      message: action === 'complete' ? 'تم إنهاء الجولة بنجاح' : action === 'skip' ? 'تم تخطي الجولة' : 'تم إعادة تعيين الجولة',
    });
  } catch (error: any) {
    console.error('Error updating onboarding status:', error);
    return NextResponse.json({ error: 'فشل تحديث حالة الجولة التعريفية' }, { status: 500 });
  }
}
