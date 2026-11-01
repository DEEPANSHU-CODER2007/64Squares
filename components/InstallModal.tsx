'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // Register service worker if supported
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom trigger to open modal from Navbar / Settings
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('open-install-modal', handleCustomOpen);

    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('64squares_install_dismissed');
    if (!dismissed) {
      // Show prompt smoothly after brief delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1600);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-install-modal', handleCustomOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('64squares_install_dismissed', 'true');
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else {
      // Direct APK download fallback
      triggerApkDownload();
    }
  };

  const triggerApkDownload = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/downloads/64Squares.apk';
    link.download = '64Squares.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  if (!isOpen || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#181B19] border border-[#303831] rounded-3xl p-5 sm:p-6 shadow-2xl text-[#F4F3EA] relative animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#A5ADA5] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#81B64C] to-[#557F39] p-0.5 shadow-lg shadow-[#81B64C]/25 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-[#111412] rounded-[14px] flex items-center justify-center">
              {/* Knight silhouette preview */}
              <div className="w-8 h-8 relative">
                <Image
                  src="/pieces/neo/wn.png"
                  alt="64Squares Knight"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">Install 64Squares</h2>
              <span className="px-1.5 py-0.5 rounded-full bg-[#81B64C]/20 border border-[#81B64C]/40 text-[#81B64C] text-[10px] font-black uppercase">
                APK / App
              </span>
            </div>
            <p className="text-xs text-[#A5ADA5] mt-0.5">Fast mobile chess with 1.5x board & offline AI</p>
          </div>
        </div>

        {/* Highlights Checklist */}
        <div className="space-y-2 py-3 px-3.5 rounded-2xl bg-[#111412]/80 border border-[#272F29] mb-4 text-xs">
          <div className="flex items-center gap-2.5 text-[#E3E8E3]">
            <CheckCircle2 className="w-4 h-4 text-[#81B64C] flex-shrink-0" />
            <span>Edge-to-edge 1.5x larger board on phone</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#E3E8E3]">
            <CheckCircle2 className="w-4 h-4 text-[#81B64C] flex-shrink-0" />
            <span>Instant load time & works offline</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#E3E8E3]">
            <CheckCircle2 className="w-4 h-4 text-[#81B64C] flex-shrink-0" />
            <span>No ads, pure distraction-free chess</span>
          </div>
        </div>

        {/* iOS Notice if browsing from iPhone / iPad */}
        {isIOS ? (
          <div className="p-3 rounded-2xl bg-[#5C8BB0]/15 border border-[#5C8BB0]/30 text-xs text-[#D1E4F4] mb-4 flex items-start gap-2.5">
            <Share2 className="w-4 h-4 text-[#7BB4E2] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">To install on iPhone / iPad:</p>
              <p className="text-[11px] text-[#A5ADA5] mt-0.5">
                Tap Safari&apos;s <span className="text-white font-bold">Share</span> icon, then tap <span className="text-white font-bold">&quot;Add to Home Screen&quot;</span>.
              </p>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Direct APK Download Button (Satisfies user request: apk file download ho aur fir install on system) */}
          <button
            onClick={triggerApkDownload}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#81B64C] to-[#557F39] hover:from-[#8ec954] hover:to-[#5e8c3f] text-[#111412] font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#81B64C]/25 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>{downloadStarted ? 'Downloading 64Squares.apk...' : 'Download APK File (.apk)'}</span>
          </button>

          {/* Browser / Native PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallPwa}
              className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4 text-[#81B64C]" />
              <span>Add to Phone Home Screen (PWA)</span>
            </button>
          )}

          {/* Maybe Later Link */}
          <div className="text-center pt-1">
            <button
              onClick={handleClose}
              className="text-xs text-[#7A857D] hover:text-[#A5ADA5] font-medium transition-colors"
            >
              Continue playing in browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
