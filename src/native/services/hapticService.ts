import { NativePlatform } from '../platform';

export type HapticStyle = 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'SUCCESS' | 'WARNING' | 'ERROR';

/**
 * HapticService
 * Tactile touch feedback service wrapping Capacitor Haptics and Web Vibration API.
 */
export class HapticService {
  /** Check if haptic feedback is supported */
  static isSupported(): boolean {
    if (NativePlatform.isNative()) return true;
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /** Trigger tactile haptic impact feedback */
  static impact(style: HapticStyle = 'LIGHT'): void {
    if (NativePlatform.isNative()) {
      console.log(`[HapticService] Native Haptic Impact [${NativePlatform.getPlatform()}]: ${style}`);
      return;
    }

    if (this.isSupported()) {
      try {
        switch (style) {
          case 'LIGHT':
            navigator.vibrate(10);
            break;
          case 'MEDIUM':
            navigator.vibrate(20);
            break;
          case 'HEAVY':
            navigator.vibrate(40);
            break;
          case 'SUCCESS':
            navigator.vibrate([10, 30, 20]);
            break;
          case 'WARNING':
            navigator.vibrate([30, 50, 30]);
            break;
          case 'ERROR':
            navigator.vibrate([50, 100, 50, 100, 50]);
            break;
        }
      } catch (e) {
        // Ignore user activation errors
      }
    }
  }

  /** Vibrate device with custom pattern (milliseconds) */
  static vibrate(pattern: number | number[] = 20): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore
      }
    }
  }
}
