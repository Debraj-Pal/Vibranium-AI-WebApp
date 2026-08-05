import { NativePlatform } from '../platform';

export interface DeepLinkData {
  url: string;
  path: string;
  params: Record<string, string>;
  sharedText?: string;
  sharedUrl?: string;
}

/**
 * DeepLinkService
 * Handles App Links, Custom Schemes (vibranium://), and Native Android Share Targets.
 */
export class DeepLinkService {
  private static listeners: Array<(data: DeepLinkData) => void> = [];

  /** Initialize deep link listeners */
  static init(): void {
    if (NativePlatform.isNative()) {
      console.log(`[DeepLinkService] Initializing Native App URL Listeners [${NativePlatform.getPlatform()}]`);
      // Capacitor App.addListener('appUrlOpen', (data) => ... ) wrapper
    }

    // Web URL hash or query params listener fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.processCurrentWebUrl();
      });
      this.processCurrentWebUrl();
    }
  }

  /** Process active URL location for deep link parameters */
  private static processCurrentWebUrl(): void {
    const url = window.location.href;
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};

    searchParams.forEach((val, key) => {
      params[key] = val;
    });

    const sharedText = params.text || params.sharedText;
    const sharedUrl = params.url || params.sharedUrl;

    if (Object.keys(params).length > 0 || path !== '/') {
      const data: DeepLinkData = { url, path, params, sharedText, sharedUrl };
      this.notifyListeners(data);
    }
  }

  /** Subscribe to incoming deep links & shared targets */
  static addDeepLinkListener(callback: (data: DeepLinkData) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(data: DeepLinkData): void {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('[DeepLinkService] Listener error:', err);
      }
    });
  }
}
