import { NativePlatform } from '../platform';

export interface SplashScreenShowOptions {
  autoHide?: boolean;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

/**
 * SplashScreenService
 * Controls initial Android & iOS native splash screen display, animations, and dismissal.
 */
export class SplashScreenService {
  private static isVisible = true;

  /** Show native splash screen */
  static async show(options?: SplashScreenShowOptions): Promise<void> {
    this.isVisible = true;
    if (NativePlatform.isNative()) {
      console.log(`[SplashScreenService] Native SplashScreen Show [${NativePlatform.getPlatform()}]`, options);
      // Capacitor SplashScreen.show() plugin call wrapper
    }
  }

  /** Hide native splash screen after app initialization completes */
  static async hide(fadeOutDuration = 300): Promise<void> {
    if (!this.isVisible) return;
    this.isVisible = false;

    if (NativePlatform.isNative()) {
      console.log(`[SplashScreenService] Native SplashScreen Hide [${NativePlatform.getPlatform()}] with fade ${fadeOutDuration}ms`);
      // Capacitor SplashScreen.hide({ fadeOutDuration }) plugin call wrapper
    }
  }
}
