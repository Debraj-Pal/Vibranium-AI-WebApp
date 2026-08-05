import { NativePlatform } from '../platform';
import { APP_CONFIG } from '../../config/constants';

export interface AppInfo {
  name: string;
  version: string;
  build: string;
  bundleId: string;
  platform: string;
}

/**
 * AppVersionService
 * Retrieves application versioning, build metadata, and environment details.
 */
export class AppVersionService {
  /** Get current application metadata */
  static async getAppInfo(): Promise<AppInfo> {
    const platform = NativePlatform.getPlatform();

    if (NativePlatform.isNative()) {
      console.log(`[AppVersionService] Native App Info [${platform}]`);
      return {
        name: APP_CONFIG.name,
        version: APP_CONFIG.version,
        build: '2026.08.01',
        bundleId: 'ai.vibranium.app',
        platform,
      };
    }

    return {
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      build: 'web-1.0.0',
      bundleId: 'ai.vibranium.web',
      platform: 'web',
    };
  }
}
