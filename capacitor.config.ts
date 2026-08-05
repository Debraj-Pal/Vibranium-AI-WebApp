import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Vibranium AI - Capacitor Cross-Platform Configuration
 * 
 * Designed for Android, iOS, Vercel Web deployment & Capacitor Native builds.
 * Preserves web functionality while enabling native device features (Camera, Haptics, Storage, Status Bar).
 */
const config: CapacitorConfig = {
  appId: 'com.vibranium.ai',
  appName: 'Vibranium AI',
  webDir: 'dist',
  
  // Mobile Server & Scheme settings
  server: {
    // Force HTTPS scheme on mobile WebViews for secure origin, Web Crypto & Firebase compatibility
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
  },

  // Android Native Platform Specifics
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#0a0a0a',
  },

  // iOS Native Platform Specifics
  ios: {
    backgroundColor: '#0a0a0a',
    contentInset: 'always',
    allowsLinkPreview: false,
  },

  // Native Plugin Configurations (Ready for Capacitor Plugins)
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#6366f1',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
