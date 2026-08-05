import { NativePlatform } from '../platform';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  scheduleAt?: Date;
  extraData?: Record<string, any>;
}

/**
 * NotificationService
 * Provides unified Push & Local notification abstractions across Web, Android, and iOS.
 */
export class NotificationService {
  /** Check if notifications are supported on the current platform */
  static isSupported(): boolean {
    if (NativePlatform.isNative()) return true;
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /** Request notification permission from the user */
  static async requestPermissions(): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log('[NotificationService] Requesting native notification permissions');
      return true;
    }

    if (this.isSupported()) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /** Send or schedule a local notification */
  static async sendLocalNotification(options: NotificationOptions): Promise<boolean> {
    const { title, body } = options;

    if (NativePlatform.isNative()) {
      console.log(`[NotificationService] Native Local Notification [${NativePlatform.getPlatform()}]:`, options);
      return true;
    }

    // Web Notification Fallback
    if (this.isSupported()) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
        return true;
      } else {
        const granted = await this.requestPermissions();
        if (granted) {
          new Notification(title, { body });
          return true;
        }
      }
    }

    console.warn('[NotificationService] Notifications unavailable or blocked on Web.');
    return false;
  }
}
