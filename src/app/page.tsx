import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const user = await getCurrentUser();

  if (user) {
    const role = (user.role || '').toUpperCase();
    if (role === 'OWNER' || role === 'ADMIN') {
      redirect('/owner');
    } else if (user.status === 'pending') {
      redirect('/pending-activation');
    } else if (user.status === 'disabled') {
      redirect('/account-disabled');
    } else if (user.must_change_password === 1) {
      redirect('/change-password');
    } else {
      redirect('/dashboard');
    }
  }

  redirect('/login');
}
