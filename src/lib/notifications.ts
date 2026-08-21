// Notification & Mobile Reminder Manager

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Notification permission error:', err);
    return false;
  }
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        dir: 'rtl',
        lang: 'ar',
        ...options,
      });
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}

export function checkAndNotifyUrgentFollowUps(followUps: any[]) {
  if (!Array.isArray(followUps) || followUps.length === 0) return;

  const urgentCount = followUps.filter((f) => f.status === 'pending').length;
  if (urgentCount > 0 && typeof window !== 'undefined') {
    const lastNotified = localStorage.getItem('last_followup_notified_date');
    const todayStr = new Date().toISOString().split('T')[0];

    if (lastNotified !== todayStr) {
      sendLocalNotification('تنبيه المتابعات اليومية ⏰', {
        body: `أستاذنا الفاضل: لديك ${urgentCount} طلاب يتطلب وضعهم متابعة اليوم. اضغط للمتابعة.`,
      });
      localStorage.setItem('last_followup_notified_date', todayStr);
    }
  }
}
