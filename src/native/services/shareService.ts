import { NativePlatform } from '../platform';
import { ClipboardService } from './clipboardService';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * ShareService
 * System native share dialog service with browser Web Share API & Clipboard fallbacks.
 */
export class ShareService {
  /** Check if sharing API is available */
  static canShare(): boolean {
    if (NativePlatform.isNative()) return true;
    return typeof navigator !== 'undefined' && Boolean(navigator.share);
  }

  /** Trigger system native share sheet */
  static async share(options: ShareOptions): Promise<boolean> {
    const { title, text, url } = options;

    if (NativePlatform.isNative()) {
      console.log(`[ShareService] Native Share Sheet [${NativePlatform.getPlatform()}]:`, options);
      return true;
    }

    // Web Share API
    if (this.canShare()) {
      try {
        await navigator.share({
          title: title || 'Vibranium AI',
          text,
          url: url || window.location.href,
        });
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // User cancelled
        console.warn('[ShareService] Web Share API error, falling back to Clipboard:', err);
      }
    }

    // Fallback: Copy link/text to clipboard
    const shareContent = [title, text, url || window.location.href].filter(Boolean).join('\n');
    return await ClipboardService.writeText(shareContent);
  }
}
