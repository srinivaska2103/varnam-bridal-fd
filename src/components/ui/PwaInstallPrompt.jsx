'use client';

import React, { useState, useEffect } from 'react';
import { Download, Check, X, Smartphone } from 'lucide-react';

/**
 * PwaInstallButton / Prompt Banner
 * Listens for beforeinstallprompt where supported (Chrome, Edge, Android),
 * allows user to trigger install prompt, and cleanly dismisses or hides on install.
 */
export function PwaInstallPrompt({ className = '', variant = 'button' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Successfully registered
        })
        .catch((err) => {
          console.warn('SW registration note:', err?.message || err);
        });
    }

    // 2. Check if already installed (standalone mode)
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true)
    ) {
      setIsInstalled(true);
      return;
    }

    // 3. Detect iOS Safari
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIphoneOrIpad = /iphone|ipad|ipod/.test(userAgent);
      if (isIphoneOrIpad && !window.navigator.standalone) {
        setIsIOS(true);
      }
    }

    // 4. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  // If already running as installed standalone PWA, render nothing
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show button if installation is actually available via prompt or iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  if (variant === 'button') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`animate-jump inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-1.5 bg-gradient-to-r from-[#F97316] via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-extrabold shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all cursor-pointer shrink-0 active:scale-95 ${className}`}
          title="Install VARNAM Bridal Software on your device"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline tracking-tight">Install App</span>
          <span className="hidden min-[400px]:inline sm:hidden tracking-tight">Install</span>
        </button>

        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 text-stone-900 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                <span className="font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  <span>Install on iPhone / iPad</span>
                </span>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="p-1 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-stone-600 leading-relaxed mb-3">
                To install VARNAM Bridal App on iOS:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-stone-700 font-medium mb-4">
                <li>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Variant: Banner
  return (
    <div
      className={`bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-xs ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Download className="w-4 h-4" />
        </div>
        <div className="truncate">
          <p className="font-bold text-stone-900 truncate">Install VARNAM App</p>
          <p className="text-[11px] text-stone-500 truncate">
            Fast studio access directly from your home screen
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
        >
          Install
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-orange-100/50"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

