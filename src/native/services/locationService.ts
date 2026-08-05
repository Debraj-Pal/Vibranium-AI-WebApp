import { NativePlatform } from '../platform';

export interface LocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
}

/**
 * LocationService
 * Unified Geolocation service supporting GPS on Android/iOS and Geolocation API on Web.
 */
export class LocationService {
  /** Check if location services are supported */
  static isAvailable(): boolean {
    if (NativePlatform.isNative()) return true;
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  /** Get current position coordinates */
  static async getCurrentPosition(): Promise<LocationPosition> {
    if (NativePlatform.isNative()) {
      console.log(`[LocationService] Native Geolocation [${NativePlatform.getPlatform()}]`);
    }

    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Geolocation is not supported on this device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          reject(new Error(`Location error: ${err.message}`));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /** Watch live position updates */
  static watchPosition(
    onLocation: (pos: LocationPosition) => void,
    onError?: (err: Error) => void
  ): number | null {
    if (!this.isAvailable()) {
      if (onError) onError(new Error('Geolocation is not supported on this device'));
      return null;
    }

    return navigator.geolocation.watchPosition(
      (pos) => {
        onLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        if (onError) onError(new Error(`Location watch error: ${err.message}`));
      },
      { enableHighAccuracy: true }
    );
  }

  /** Stop watching live position */
  static clearWatch(watchId: number): void {
    if (this.isAvailable() && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }
}
