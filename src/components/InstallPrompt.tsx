import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (iosDevice && !isStandalone) {
      setIsIOS(true);
      const hasDismissed = localStorage.getItem('vibranium_pwa_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('vibranium_pwa_dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('vibranium_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-[#141517] border border-indigo-500/30 rounded-2xl p-4 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shrink-0 shadow-md">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[10px] flex items-center justify-center">
              <Download className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Install Vibranium AI</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isIOS ? 'Tap Share and select "Add to Home Screen"' : 'Install for offline access & faster performance'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          aria-label="Close install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium rounded-lg shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
        </div>
      )}

      {isIOS && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-indigo-300">
          <Share className="w-3.5 h-3.5 shrink-0" />
          <span>Tap <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong></span>
        </div>
      )}
    </div>
  );
}

export default InstallPrompt;
