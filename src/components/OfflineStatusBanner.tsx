import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { NetworkService } from '../native';

export function OfflineStatusBanner() {
  const [isOffline, setIsOffline] = useState(() => !NetworkService.getStatus().connected);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const unsubscribe = NetworkService.addStatusListener((status) => {
      if (!status.connected) {
        setIsOffline(true);
        setShowReconnected(false);
      } else {
        setIsOffline(false);
        setShowReconnected(true);
        const timer = setTimeout(() => {
          setShowReconnected(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[92%] animate-fadeIn pointer-events-none">
      {isOffline ? (
        <div className="bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 truncate">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">Offline Mode — Using Cached Data</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-[11px] font-bold text-amber-300 underline hover:text-white shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Connection Restored — Back Online</span>
        </div>
      )}
    </div>
  );
}

export default OfflineStatusBanner;
