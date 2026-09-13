import { useEffect } from 'react';
import { useContracts } from '@/api/contracts';
import { useUnpaidCostsCount } from '@/api/costs';
import { daysUntil } from '@/lib/format';

const STORAGE_KEY = 'birja_last_reminder_date';

/**
 * Kuniga bir marta: muddati o'tgan/yaqinlashgan shartnomalar va
 * to'lanmagan xarajatlar haqida brauzer bildirishnomasini ko'rsatadi.
 * Email eslatma emas — bu faqat shu brauzer/qurilmada ishlaydi.
 */
export function useDeadlineReminders() {
  const { data: contracts } = useContracts();
  const { data: unpaidCount } = useUnpaidCostsCount();

  useEffect(() => {
    if (!contracts) return;
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    let last: string | null = null;
    try {
      last = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage yo'q bo'lishi mumkin — jim o'tkazib yuboramiz
    }
    if (last === today) return;

    let overdue = 0;
    let dueSoon = 0;
    for (const c of contracts) {
      if (c.status === 'fulfilled' || c.status === 'cancelled') continue;
      const d = daysUntil(c.deadline);
      if (d === null) continue;
      if (d < 0) overdue += 1;
      else if (d <= 7) dueSoon += 1;
    }

    const parts = [
      overdue > 0 ? `${overdue} ta shartnoma muddati o'tgan` : null,
      dueSoon > 0 ? `${dueSoon} ta shartnoma muddati yaqinlashmoqda` : null,
      unpaidCount && unpaidCount > 0
        ? `${unpaidCount} ta xarajat to'lanmagan`
        : null,
    ].filter(Boolean);

    if (parts.length === 0) return;

    const showNotification = () => {
      try {
        new Notification('Birja', {
          body: parts.join(', '),
          icon: '/favicon.svg',
        });
      } catch {
        // ba'zi brauzerlarda Notification konstruktori xato berishi mumkin
      }
    };

    if (Notification.permission === 'granted') {
      try {
        localStorage.setItem(STORAGE_KEY, today);
      } catch {
        // e'tiborsiz qoldiramiz
      }
      showNotification();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          try {
            localStorage.setItem(STORAGE_KEY, today);
          } catch {
            // e'tiborsiz qoldiramiz
          }
          showNotification();
        }
      });
    }
  }, [contracts, unpaidCount]);
}
