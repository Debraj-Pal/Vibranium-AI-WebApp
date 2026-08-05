import { NativePlatform } from '../platform';
import { NetworkService } from './networkService';

export interface AppState {
  isActive: boolean;
}

/**
 * AppLifecycleService
 * Handles Android & iOS app lifecycle events (Background, Foreground/Resume, State Syncing).
 */
export class AppLifecycleService {
  private static stateListeners: Array<(state: AppState) => void> = [];

  /** Initialize lifecycle tracking */
  static init(): void {
    if (NativePlatform.isNative()) {
      console.log(`[AppLifecycleService] Registering Native App State Listeners [${NativePlatform.getPlatform()}]`);
      // Capacitor App.addListener('appStateChange', (state) => ... )
    }

    // Web visibilitychange fallback
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const isActive = document.visibilityState === 'visible';
        console.log(`[AppLifecycleService] Visibility changed: isActive=${isActive}`);
        
        if (isActive) {
          // Re-check network connectivity on resume
          NetworkService.getStatus();
        }

        this.notifyListeners({ isActive });
      });
    }
  }

  /** Subscribe to app foreground/background state updates */
  static addStateListener(callback: (state: AppState) => void): () => void {
    this.stateListeners.push(callback);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(state: AppState): void {
    this.stateListeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[AppLifecycleService] Listener error:', err);
      }
    });
  }
}
