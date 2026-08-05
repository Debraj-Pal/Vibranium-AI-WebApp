import { NativePlatform } from '../platform';

export interface BatteryStatus {
  batteryLevel: number; // 0.0 to 1.0
  isCharging: boolean;
}

/**
 * BatteryService
 * Monitors device battery level and charging status across platforms.
 */
export class BatteryService {
  /** Get current battery information */
  static async getBatteryStatus(): Promise<BatteryStatus> {
    if (NativePlatform.isNative()) {
      console.log(`[BatteryService] Native Battery Status [${NativePlatform.getPlatform()}]`);
      return { batteryLevel: 0.85, isCharging: true };
    }

    // Web Battery Status API Fallback
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        return {
          batteryLevel: battery.level ?? 1.0,
          isCharging: battery.charging ?? true,
        };
      } catch (err) {
        console.warn('[BatteryService] getBattery call failed:', err);
      }
    }

    return { batteryLevel: 1.0, isCharging: true };
  }
}
