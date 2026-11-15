import { useEffect } from 'react';
import { APP_ICON_STYLES } from '../constants/taskxData';
import { AppIconId } from '../types/taskx';

export function buildAppIconSvg(iconId: AppIconId): string {
  const style = APP_ICON_STYLES[iconId] || APP_ICON_STYLES.grid;

  if (iconId === 'grid') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${style.bg}"/><rect x="14" y="14" width="15" height="15" rx="4" fill="${style.fg}"/><rect x="35" y="14" width="15" height="15" rx="4" fill="${style.accent}"/><rect x="14" y="35" width="15" height="15" rx="4" fill="${style.fg}" opacity="0.45"/><path d="M36 42l5 5 10-11" fill="none" stroke="${style.fg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  if (iconId === 'obsidian') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${style.bg}"/><circle cx="32" cy="32" r="20" fill="none" stroke="#1e293b" stroke-width="4.5"/><path d="M32 12a20 20 0 1 1-14.14 5.86" fill="none" stroke="${style.accent}" stroke-width="4.5" stroke-linecap="round"/><path d="M25 25l14 14M39 25L25 39" stroke="${style.fg}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="12" r="3" fill="${style.fg}"/></svg>`;
  }

  if (iconId === 'cobalt') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="tx-cobalt-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#tx-cobalt-bg)"/><rect x="14" y="18" width="36" height="32" rx="7" fill="#ffffff" opacity="0.22"/><rect x="14" y="14" width="36" height="30" rx="7" fill="#ffffff" opacity="0.45"/><rect x="14" y="10" width="36" height="28" rx="7" fill="#ffffff"/><path d="M23 24l6 6 12-12" fill="none" stroke="#1d4ed8" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="45" width="24" height="3.5" rx="1.75" fill="${style.accent}"/></svg>`;
  }

  if (iconId === 'emerald') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="tx-em-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#064e3b"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#tx-em-bg)"/><rect x="27" y="10" width="10" height="44" rx="5" transform="rotate(45 32 32)" fill="${style.accent}"/><rect x="27" y="10" width="10" height="44" rx="5" transform="rotate(-45 32 32)" fill="${style.fg}"/><circle cx="32" cy="32" r="4" fill="#064e3b"/></svg>`;
  }

  if (iconId === 'sunset') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="tx-sun-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#9a3412"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#tx-sun-bg)"/><circle cx="32" cy="29" r="13" fill="${style.accent}"/><path d="M12 37h40v4H12zM16 44h32v3.5H16zM22 50.5h20v3H22z" fill="${style.fg}" opacity="0.92"/><path d="M26 28l4.5 4.5L39 24" fill="none" stroke="#9a3412" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // mono: Blueprint Folio
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${style.bg}" stroke="#cbd5e1" stroke-width="2"/><path d="M21 8v48M43 8v48M8 21h48M8 43h48" stroke="#e2e8f0" stroke-width="1.5"/><rect x="43" y="12" width="9" height="9" rx="2.5" fill="${style.accent}"/><path d="M20 22l22 22M42 22L20 44" stroke="${style.fg}" stroke-width="5" stroke-linecap="square"/></svg>`;
}

export function syncAppIconLinks(iconId: AppIconId, themeColor = '#2563eb') {
  if (typeof document === 'undefined') return;

  try {
    localStorage.setItem('taskx_app_icon', iconId);
    localStorage.setItem('taskx_theme_hex', themeColor);
  } catch {
    // ignore storage access issues
  }

  let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.rel = 'icon';
    iconLink.type = 'image/svg+xml';
    document.head.appendChild(iconLink);
  }
  iconLink.href = `/icons/${iconId}.svg`;

  let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!appleLink) {
    appleLink = document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.setAttribute('sizes', '180x180');
    document.head.appendChild(appleLink);
  }
  appleLink.href = `/icons/${iconId}-180.png`;

  const manifestUrl = `/manifests/${iconId}.webmanifest`;
  const manifests = document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]');
  if (manifests.length === 0) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestUrl;
    document.head.appendChild(manifestLink);
  } else {
    manifests.forEach((m, idx) => {
      if (idx === 0) {
        m.href = manifestUrl;
      } else {
        m.remove();
      }
    });
  }

  const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = themeColor;
  }
}

export function AppIconHeadSync({
  iconId,
  themeColor,
}: {
  iconId: AppIconId;
  themeColor: string;
}) {
  useEffect(() => {
    syncAppIconLinks(iconId, themeColor);
  }, [iconId, themeColor]);

  return null;
}

export function BrandIcon({
  iconId,
  size = 32,
}: {
  iconId: AppIconId;
  size?: number;
}) {
  const style = APP_ICON_STYLES[iconId] || APP_ICON_STYLES.grid;

  if (iconId === 'grid') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="16" fill={style.bg} />
        <rect x="14" y="14" width="15" height="15" rx="4" fill={style.fg} />
        <rect x="35" y="14" width="15" height="15" rx="4" fill={style.accent} />
        <rect x="14" y="35" width="15" height="15" rx="4" fill={style.fg} opacity="0.45" />
        <path
          d="M36 42l5 5 10-11"
          fill="none"
          stroke={style.fg}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (iconId === 'obsidian') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <rect width="64" height="64" rx="16" fill={style.bg} />
        <circle cx="32" cy="32" r="20" fill="none" stroke="#1e293b" strokeWidth="4.5" />
        <path
          d="M32 12a20 20 0 1 1-14.14 5.86"
          fill="none"
          stroke={style.accent}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M25 25l14 14M39 25L25 39"
          stroke={style.fg}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="32" cy="12" r="3" fill={style.fg} />
      </svg>
    );
  }

  if (iconId === 'cobalt') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="tx-cobalt-ui" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#tx-cobalt-ui)" />
        <rect x="14" y="18" width="36" height="32" rx="7" fill="#ffffff" opacity="0.22" />
        <rect x="14" y="14" width="36" height="30" rx="7" fill="#ffffff" opacity="0.45" />
        <rect x="14" y="10" width="36" height="28" rx="7" fill="#ffffff" />
        <path
          d="M23 24l6 6 12-12"
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="20" y="45" width="24" height="3.5" rx="1.75" fill={style.accent} />
      </svg>
    );
  }

  if (iconId === 'emerald') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="tx-em-ui" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#tx-em-ui)" />
        <rect
          x="27"
          y="10"
          width="10"
          height="44"
          rx="5"
          transform="rotate(45 32 32)"
          fill={style.accent}
        />
        <rect
          x="27"
          y="10"
          width="10"
          height="44"
          rx="5"
          transform="rotate(-45 32 32)"
          fill={style.fg}
        />
        <circle cx="32" cy="32" r="4" fill="#064e3b" />
      </svg>
    );
  }

  if (iconId === 'sunset') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="tx-sun-ui" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#tx-sun-ui)" />
        <circle cx="32" cy="29" r="13" fill={style.accent} />
        <path
          d="M12 37h40v4H12zM16 44h32v3.5H16zM22 50.5h20v3H22z"
          fill={style.fg}
          opacity="0.92"
        />
        <path
          d="M26 28l4.5 4.5L39 24"
          fill="none"
          stroke="#9a3412"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // mono: Blueprint Folio
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="16" fill={style.bg} stroke="#cbd5e1" strokeWidth="2" />
      <path d="M21 8v48M43 8v48M8 21h48M8 43h48" stroke="#e2e8f0" strokeWidth="1.5" />
      <rect x="43" y="12" width="9" height="9" rx="2.5" fill={style.accent} />
      <path
        d="M20 22l22 22M42 22L20 44"
        stroke={style.fg}
        strokeWidth="5"
        strokeLinecap="square"
      />
    </svg>
  );
}
