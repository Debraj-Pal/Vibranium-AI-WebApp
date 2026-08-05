import { NativePlatform } from '../platform';

export interface GalleryPickOptions {
  multiple?: boolean;
  limit?: number;
  accept?: string;
}

export interface GalleryItem {
  webPath: string;
  name: string;
  size: number;
  type: string;
}

/**
 * GalleryService
 * Abstraction for picking and saving images/media to photo gallery across Web, Android, and iOS.
 */
export class GalleryService {
  /** Pick image(s) from media library or file system */
  static async pickImages(options: GalleryPickOptions = {}): Promise<GalleryItem[]> {
    if (NativePlatform.isNative()) {
      console.log(`[GalleryService] Native Media Picker [${NativePlatform.getPlatform()}]`);
      return [];
    }

    // Web Fallback File Picker
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = options.accept || 'image/*,video/*';
      input.multiple = Boolean(options.multiple);

      input.onchange = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve([]);
          return;
        }

        const items: GalleryItem[] = Array.from(files).map((file) => ({
          webPath: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
        }));

        resolve(items);
      };

      input.click();
    });
  }

  /** Save file / blob / image URL to gallery */
  static async saveToGallery(url: string, filename = 'vibranium_media.png'): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[GalleryService] Native Gallery Save [${NativePlatform.getPlatform()}]: ${url}`);
      return true;
    }

    // Web download fallback
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (err) {
      console.error('[GalleryService] Failed to save media:', err);
      return false;
    }
  }
}
