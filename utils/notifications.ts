import { Bill } from '../types';

export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
}

export const getNotificationStatus = (): NotificationStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'default' };
  }
  return {
    supported: true,
    permission: Notification.permission
  };
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  } catch (error) {
    console.warn('Native notification failed, using simulated fallback:', error);
    return null;
  }
};

export const checkAndNotifyUpcomingBills = (bills: Bill[]): Bill[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgentBills: Bill[] = [];

  bills.forEach(bill => {
    if (bill.isPaid) return;
    const dueDate = new Date(bill.dueDate + 'T00:00:00');
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Menos de 2 dias para o vencimento (vence hoje, amanhã ou depois, ou vencida)
    if (diffDays <= 2) {
      urgentBills.push(bill);

      // Check if already notified recently
      const storageKey = `notified_bill_${bill.id}_${bill.dueDate}`;
      const lastNotified = localStorage.getItem(storageKey);
      const isToday = lastNotified === today.toISOString().split('T')[0];

      if (!isToday) {
        const formattedAmount = bill.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const timeText = diffDays < 0 
          ? `venceu há ${Math.abs(diffDays)} dia(s)` 
          : diffDays === 0 
          ? 'vence HOJE' 
          : diffDays === 1 
          ? 'vence AMANHÃ' 
          : `vence em ${diffDays} dias`;

        sendBrowserNotification(`Conta próxima do vencimento: ${bill.description}`, {
          body: `A conta "${bill.description}" de ${formattedAmount} ${timeText}! Não se esqueça de pagar.`,
          tag: `bill-${bill.id}`,
          requireInteraction: true
        });

        localStorage.setItem(storageKey, today.toISOString().split('T')[0]);
      }
    }
  });

  return urgentBills;
};
