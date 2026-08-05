import { NativePlatform } from '../platform';

export interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
}

/**
 * NetworkService
 * Real-time network connectivity and state monitoring across Web and Native platforms.
 */
export class NetworkService {
  /** Get current network connection status */
  static getStatus(): NetworkStatus {
    const connected = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (NativePlatform.isNative()) {
      console.log(`[NetworkService] Native Network status [${NativePlatform.getPlatform()}]: connected=${connected}`);
    }

    let connectionType: NetworkStatus['connectionType'] = 'unknown';
    if (!connected) {
      connectionType = 'none';
    } else if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      const type = (navigator as any).connection.type;
      if (type === 'wifi' || type === 'cellular') {
        connectionType = type;
      }
    }

    return { connected, connectionType };
  }

  /** Add network state change event listener */
  static addStatusListener(callback: (status: NetworkStatus) => void): () => void {
    const handleOnline = () => callback({ connected: true, connectionType: 'wifi' });
    const handleOffline = () => callback({ connected: false, connectionType: 'none' });

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }
}
