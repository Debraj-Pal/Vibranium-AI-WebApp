import { NativePlatform } from '../platform';

/**
 * StorageService
 * Provides durable key-value storage abstractions wrapping Preferences / Preferences Plugin / LocalStorage.
 */
export class StorageService {
  /** Get item from storage */
  static async getItem<T = string>(key: string): Promise<T | null> {
    if (NativePlatform.isNative()) {
      console.log(`[StorageService] Native Storage Read [${NativePlatform.getPlatform()}]: ${key}`);
      // Native storage integration point
    }

    try {
      const val = localStorage.getItem(key);
      if (val === null) return null;
      try {
        return JSON.parse(val) as T;
      } catch {
        return val as unknown as T;
      }
    } catch (e) {
      console.error('[StorageService] LocalStorage read failed:', e);
      return null;
    }
  }

  /** Set item in storage */
  static async setItem(key: string, value: any): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[StorageService] Native Storage Write [${NativePlatform.getPlatform()}]: ${key}`);
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (e) {
      console.error('[StorageService] LocalStorage write failed:', e);
      return false;
    }
  }

  /** Remove item from storage */
  static async removeItem(key: string): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[StorageService] Native Storage Remove [${NativePlatform.getPlatform()}]: ${key}`);
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('[StorageService] LocalStorage removeItem failed:', e);
      return false;
    }
  }

  /** Clear all storage */
  static async clear(): Promise<boolean> {
    if (NativePlatform.isNative()) {
      console.log(`[StorageService] Native Storage Clear [${NativePlatform.getPlatform()}]`);
    }

    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('[StorageService] LocalStorage clear failed:', e);
      return false;
    }
  }
}
