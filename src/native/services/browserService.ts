import { NativePlatform } from '../platform';

export interface OpenUrlOptions {
  windowName?: string;
  toolbarColor?: string;
}

/**
 * BrowserService
 * Handles safe external link navigation via InAppBrowser or external browser tabs.
 */
export class BrowserService {
  /** Open an external web page safely */
  static async openUrl(url: string, options: OpenUrlOptions = {}): Promise<boolean> {
    if (!url) return false;

    if (NativePlatform.isNative()) {
      console.log(`[BrowserService] Native Browser Open [${NativePlatform.getPlatform()}]: ${url}`, options);
      // Capacitor Browser.open({ url, windowName, toolbarColor })
      return true;
    }

    // Web Fallback: window.open with security rel attributes
    try {
      const win = window.open(url, options.windowName || '_blank', 'noopener,noreferrer');
      if (win) win.focus();
      return true;
    } catch (err) {
      console.error('[BrowserService] Failed to open URL on Web:', err);
      return false;
    }
  }

  /** Close in-app browser if active */
  static async close(): Promise<void> {
    if (NativePlatform.isNative()) {
      console.log(`[BrowserService] Native Browser Close [${NativePlatform.getPlatform()}]`);
    }
  }
}
