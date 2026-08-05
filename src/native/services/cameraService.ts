import { NativePlatform } from '../platform';

export interface CameraOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  source?: 'CAMERA' | 'PHOTOS';
}

export interface CameraPhotoResult {
  webPath?: string;
  base64String?: string;
  format?: string;
}

/**
 * CameraService
 * Provides camera capture abstractions with native Capacitor fallback to Web File Picker or getUserMedia.
 */
export class CameraService {
  /** Check if camera feature is available */
  static isAvailable(): boolean {
    if (NativePlatform.isNative()) return true;
    return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  }

  /** Capture a photo using Camera */
  static async capturePhoto(options: CameraOptions = {}): Promise<CameraPhotoResult> {
    const quality = options.quality ?? 90;

    if (NativePlatform.isNative()) {
      console.log(`[CameraService] Native Camera Capture [${NativePlatform.getPlatform()}] with quality ${quality}`);
      // Capacitor Camera plugin integration point
      return { webPath: '', format: 'jpeg' };
    }

    // Web Fallback: HTML File Input with capture attribute
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (options.source !== 'PHOTOS') {
        input.capture = 'environment';
      }

      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const webPath = URL.createObjectURL(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve({
              webPath,
              base64String,
              format: file.type.split('/')[1] || 'jpeg',
            });
          };
          reader.readAsDataURL(file);
        } else {
          reject(new Error('User cancelled camera capture'));
        }
      };

      input.click();
    });
  }
}
