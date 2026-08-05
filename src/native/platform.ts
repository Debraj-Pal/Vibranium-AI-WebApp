import { Capacitor } from '@capacitor/core';

/**
 * Native Platform Detection & Capabilities Helper
 * Prepares Vibranium AI for Capacitor Android & iOS native builds while maintaining Web & Vercel deployment.
 */
export const NativePlatform = {
  /** Check if running inside Capacitor native container (Android or iOS) */
  isNative: (): boolean => Capacitor.isNativePlatform(),

  /** Get specific platform name: 'android' | 'ios' | 'web' */
  getPlatform: (): string => Capacitor.getPlatform(),

  /** Check if running on Android device */
  isAndroid: (): boolean => Capacitor.getPlatform() === 'android',

  /** Check if running on iOS device */
  isIOS: (): boolean => Capacitor.getPlatform() === 'ios',

  /** Check if running as Web App (Vercel / Browser) */
  isWeb: (): boolean => Capacitor.getPlatform() === 'web',

  /** Safe Haptic feedback trigger abstraction (falls back gracefully on Web) */
  hapticImpact: async (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'LIGHT') => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Will connect to @capacitor/haptics when installed
        if (navigator.vibrate) {
          navigator.vibrate(style === 'LIGHT' ? 10 : style === 'MEDIUM' ? 25 : 50);
        }
      } catch (e) {
        // Safe silent fail on unsupported devices
      }
    } else if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /** Native share bridge abstraction */
  shareText: async (title: string, text: string, url?: string): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (err) {
        // User cancelled or share API error
        return false;
      }
    }
    return false;
  }
};
