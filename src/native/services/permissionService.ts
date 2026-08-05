import { NativePlatform } from '../platform';

export type PermissionType = 'camera' | 'microphone' | 'photos' | 'location' | 'notifications';

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

/**
 * PermissionService
 * Unified cross-platform permission checker and request manager for Android, iOS, and Web.
 */
export class PermissionService {
  /** Check current permission status for a specified feature */
  static async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    if (NativePlatform.isNative()) {
      console.log(`[PermissionService] Check Native Permission [${NativePlatform.getPlatform()}]: ${type}`);
      return { granted: true, denied: false, prompt: false };
    }

    // Web Permissions API check where available
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && (navigator.permissions as any).query) {
      try {
        let name: any = type;
        if (type === 'photos') name = 'camera';
        if (type === 'notifications') name = 'notifications';

        const status = await (navigator.permissions as any).query({ name });
        return {
          granted: status.state === 'granted',
          denied: status.state === 'denied',
          prompt: status.state === 'prompt',
        };
      } catch (e) {
        // Fallback if permission query fails
      }
    }

    return { granted: true, denied: false, prompt: false };
  }

  /** Request permission from user */
  static async requestPermission(type: PermissionType): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[PermissionService] Request Native Permission [${NativePlatform.getPlatform()}]: ${type}`);
      return true;
    }

    // Web Fallbacks
    if (type === 'notifications') {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
    }

    if (type === 'camera' || type === 'microphone') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'camera',
          audio: type === 'microphone',
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        return false;
      }
    }

    if (type === 'location') {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    return true;
  }
}
