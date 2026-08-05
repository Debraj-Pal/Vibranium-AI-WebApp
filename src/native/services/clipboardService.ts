import { NativePlatform } from '../platform';

/**
 * ClipboardService
 * Provides copy/paste abstraction for text and snippets across Web, Android, and iOS.
 */
export class ClipboardService {
  /** Write text to clipboard */
  static async writeText(text: string): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[ClipboardService] Native Write Text [${NativePlatform.getPlatform()}]`);
      // Capacitor Clipboard integration point
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('[ClipboardService] Navigator clipboard write failed, attempting execCommand fallback');
      }
    }

    // ExecCommand Fallback for legacy browsers or restricted contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (e) {
      console.error('[ClipboardService] Clipboard copy error:', e);
      return false;
    }
  }

  /** Read text from clipboard */
  static async readText(): Promise<string> {
    if (NativePlatform.isNative()) {
      console.log(`[ClipboardService] Native Read Text [${NativePlatform.getPlatform()}]`);
      return '';
    }

    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch (err) {
        console.warn('[ClipboardService] Navigator clipboard read permission denied or unavailable');
      }
    }

    return '';
  }
}
