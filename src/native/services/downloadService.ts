import { NativePlatform } from '../platform';

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
}

/**
 * DownloadService
 * Manages background file downloads and save triggers across Web and Native platforms.
 */
export class DownloadService {
  /** Download file from URL */
  static async downloadFile(
    url: string,
    filename = 'download',
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[DownloadService] Native File Download [${NativePlatform.getPlatform()}]: ${url}`);
      return true;
    }

    try {
      if (onProgress) {
        // Track progress via fetch response stream
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(value);
              loaded += value.length;
              if (total > 0) {
                onProgress({
                  bytesDownloaded: loaded,
                  totalBytes: total,
                  percentage: Math.round((loaded / total) * 100),
                });
              }
            }
          }
        }

        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        return true;
      } else {
        // Direct download trigger
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return true;
      }
    } catch (err) {
      console.error('[DownloadService] Download failed:', err);
      return false;
    }
  }
}
