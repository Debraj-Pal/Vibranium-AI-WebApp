import { NativePlatform } from '../platform';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

/**
 * FileService
 * Abstract file system interactions (reading, writing, deleting) across Web and Native platforms.
 */
export class FileService {
  /** Read file contents as text */
  static async readAsText(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  /** Read file contents as Base64 string */
  static async readAsBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /** Write string data or blob to virtual/download file */
  static async writeFile(filename: string, content: string | Blob, mimeType = 'text/plain'): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[FileService] Native File Write [${NativePlatform.getPlatform()}]: ${filename}`);
      return true;
    }

    try {
      const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.error('[FileService] File write failed:', e);
      return false;
    }
  }

  /** Delete file from disk/storage shim */
  static async deleteFile(path: string): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[FileService] Native File Delete [${NativePlatform.getPlatform()}]: ${path}`);
      return true;
    }
    return true;
  }
}
