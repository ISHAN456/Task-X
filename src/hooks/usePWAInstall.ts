import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __txDeferredPrompt?: BeforeInstallPromptEvent | null;
    __txAppInstalled?: boolean;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__txDeferredPrompt ?? null : null
  );
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' ? Boolean(window.__txAppInstalled) : false
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        Boolean(window.__txAppInstalled);
      setIsInstalled(standalone);
    };

    checkStandalone();

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (window.__txDeferredPrompt) {
      setDeferredPrompt(window.__txDeferredPrompt);
    }

    const ua = window.navigator.userAgent;
    const isAppleTouchDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isMSStream = 'MSStream' in window;
    setIsIOS(isAppleTouchDevice && !isMSStream);

    const handleCapturedPrompt = () => {
      if (window.__txDeferredPrompt) {
        setDeferredPrompt(window.__txDeferredPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__txDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__txDeferredPrompt = null;
      window.__txAppInstalled = true;
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('tx-pwa-installable', handleCapturedPrompt);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('tx-pwa-installable', handleCapturedPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    const target = deferredPrompt || window.__txDeferredPrompt;
    if (!target) return false;
    await target.prompt();
    const { outcome } = await target.userChoice;
    if (outcome === 'accepted') {
      window.__txDeferredPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    canInstall: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isInIframe,
    promptInstall,
  };
}
