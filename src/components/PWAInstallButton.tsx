import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  MonitorDown,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { APP_ICON_STYLES } from '../constants/taskxData';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppIconId } from '../types/taskx';
import { BrandIcon } from './BrandIcon';

interface PWAInstallButtonProps {
  selectedIcon: AppIconId;
  variant?: 'card' | 'header';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  selectedIcon,
  variant = 'card',
}) => {
  const { canInstall, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  if (isInstalled) return null;

  const iconMeta = APP_ICON_STYLES[selectedIcon] || APP_ICON_STYLES.obsidian;

  const handleAction = async () => {
    if (canInstall) {
      await promptInstall();
      return;
    }
    setShowInstructions(true);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={handleAction}
          title={canInstall ? 'Install Task X App' : 'Install Task X in Chrome / Safari'}
          aria-label={canInstall ? 'Install Task X App' : 'Install Task X'}
          className={`min-h-[38px] px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
            canInstall
              ? 'bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] shadow-xs'
              : 'border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          {canInstall ? (
            <Download className="h-3.5 w-3.5" />
          ) : (
            <MonitorDown className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{canInstall ? 'Install App' : 'Install'}</span>
        </button>
      ) : (
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="rounded-xl shadow-xs shrink-0 overflow-hidden">
              <BrandIcon iconId={selectedIcon} size={34} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                Home Screen Preview · {iconMeta.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {canInstall
                  ? 'Ready to install directly from Chrome'
                  : 'Install on Chrome, mobile, or tablet'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="min-h-[38px] px-3.5 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            {canInstall ? (
              <Download className="h-3.5 w-3.5" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            <span>{canInstall ? 'Install App' : 'Install'}</span>
          </button>
        </div>
      )}

      {showInstructions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090B] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <BrandIcon iconId={selectedIcon} size={40} />
                <div>
                  <h3
                    id="pwa-install-title"
                    className="text-base font-bold text-slate-900 dark:text-white"
                  >
                    Install Task X
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Uses {iconMeta.name} app icon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                aria-label="Close instructions"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInIframe ? (
              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <p>
                  Chrome disables app installation inside embedded preview frames. Open Task X in
                  its own browser tab first:
                </p>
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[40px] px-3.5 rounded-xl bg-[var(--tx-accent)] hover:bg-[var(--tx-accent-hover)] text-[var(--tx-accent-fg)] font-semibold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Standalone Tab to Install
                </a>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Once opened in Chrome, click <strong>Install App</strong> in the top bar or the{' '}
                  <strong>Install</strong> icon in Chrome&apos;s address bar.
                </p>
              </div>
            ) : isIOS ? (
              <ol className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Share className="h-4 w-4 text-[var(--tx-accent)] shrink-0" />
                  <span>
                    1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <PlusSquare className="h-4 w-4 text-[var(--tx-accent)] shrink-0" />
                  <span>
                    2. Scroll down and select <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="text-[11px] text-slate-500 dark:text-zinc-400 pl-6">
                  Tip: Re-add the shortcut if you switch your App Icon style in Settings.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li>
                  1. In Chrome desktop, click the <strong>Install</strong> icon in the right side of
                  the address bar, or open Chrome menu (<strong>⋮</strong>) →{' '}
                  <strong>Cast, save, and share → Install Task X</strong>.
                </li>
                <li>
                  2. On Chrome Android / tablet, tap <strong>⋮ → Install app</strong> (or{' '}
                  <strong>Add to Home screen</strong>).
                </li>
                <li className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Your selected <strong>{iconMeta.name}</strong> icon is active in the live app
                  manifest.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="mt-5 w-full min-h-[42px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
