import { NativePlatform } from '../platform';
import { HapticService } from './hapticService';

export interface BackButtonHandlerContext {
  isModalOpen?: boolean;
  isSidebarOpen?: boolean;
  activeModule?: string;
  closeModal?: () => void;
  closeSidebar?: () => void;
  navigateToModule?: (module: string) => void;
}

/**
 * BackButtonService
 * Manages physical Android hardware back button press stack hierarchy (Closing modals -> closing drawer -> home screen -> double back exit).
 */
export class BackButtonService {
  private static lastBackPressTime = 0;
  private static removeNativeListener: (() => void) | null = null;

  /** Register global back button listener */
  static registerHandler(contextGetter: () => BackButtonHandlerContext): void {
    if (NativePlatform.isAndroid()) {
      console.log('[BackButtonService] Registering Android Hardware Back Button listener');
      // Capacitor App.addListener('backButton', () => ...) wrapper
    }

    // Web Escape key fallback for closing modals/sidebars
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.handleBackPress(contextGetter());
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      this.removeNativeListener = () => window.removeEventListener('keydown', handleKeyDown);
    }
  }

  /** Unregister listener */
  static unregister(): void {
    if (this.removeNativeListener) {
      this.removeNativeListener();
      this.removeNativeListener = null;
    }
  }

  /** Handle back press priority stack */
  static handleBackPress(ctx: BackButtonHandlerContext): boolean {
    // 1. If any modal is open, close it
    if (ctx.isModalOpen && ctx.closeModal) {
      HapticService.impact('LIGHT');
      ctx.closeModal();
      return true;
    }

    // 2. If mobile sidebar drawer is open, close it
    if (ctx.isSidebarOpen && ctx.closeSidebar) {
      HapticService.impact('LIGHT');
      ctx.closeSidebar();
      return true;
    }

    // 3. If on secondary module (Settings, Search, Translator), return to Chat
    if (ctx.activeModule && ctx.activeModule !== 'chat' && ctx.navigateToModule) {
      HapticService.impact('LIGHT');
      ctx.navigateToModule('chat');
      return true;
    }

    // 4. Double tap within 2 seconds on home chat page triggers exit alert on Android
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      console.log('[BackButtonService] Exiting App on Android');
      if (NativePlatform.isNative()) {
        // Capacitor App.exitApp()
      }
      return true;
    } else {
      this.lastBackPressTime = now;
      HapticService.impact('MEDIUM');
      return false;
    }
  }
}
