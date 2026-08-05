import { NativePlatform } from '../platform';

export type StatusBarStyle = 'DARK' | 'LIGHT';

/**
 * StatusBarService
 * Manages Android & iOS status bar appearance, background colors, and navigation bar styling.
 */
export class StatusBarService {
  /** Set status bar style (DARK text/icons or LIGHT text/icons) */
  static async setStyle(style: StatusBarStyle): Promise<void> {
    if (NativePlatform.isNative()) {
      console.log(`[StatusBarService] Native Status Bar Style [${NativePlatform.getPlatform()}]: ${style}`);
      // Capacitor StatusBar.setStyle({ style }) plugin call wrapper
    }

    // Web Meta Tag Theme-Color update
    if (typeof document !== 'undefined') {
      const themeColor = style === 'DARK' ? '#0a0a0a' : '#ffffff';
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.setAttribute('name', 'theme-color');
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', themeColor);
    }
  }

  /** Set status bar background color (Android) */
  static async setBackgroundColor(color: string): Promise<void> {
    if (NativePlatform.isNative()) {
      console.log(`[StatusBarService] Native Status Bar Background [${NativePlatform.getPlatform()}]: ${color}`);
      // Capacitor StatusBar.setBackgroundColor({ color }) plugin call wrapper
    }
  }

  /** Set Android bottom Navigation Bar background color & icon brightness */
  static async setNavigationBarColor(color: string, lightIcons = true): Promise<void> {
    if (NativePlatform.isAndroid()) {
      console.log(`[StatusBarService] Native Navigation Bar Color [Android]: ${color}, lightIcons=${lightIcons}`);
    }
  }

  /** Hide or show status bar on native screens */
  static async setOverlaysWebView(overlay: boolean): Promise<void> {
    if (NativePlatform.isNative()) {
      console.log(`[StatusBarService] Native Overlays WebView: ${overlay}`);
    }
  }
}
