import React, { useId } from 'react';

interface BadgeMedalProps {
  badgeId: string;
  unlocked: boolean;
  size?: number;
}

interface MedalTheme {
  ribbonLeft: string;
  ribbonRight: string;
  ribbonFold: string;
  rimLight: string;
  rimMid: string;
  rimDark: string;
  enamelTop: string;
  enamelBottom: string;
  emblem: string;
  emblemAccent: string;
}

const MEDAL_THEMES: Record<string, MedalTheme> = {
  first_step: {
    ribbonLeft: '#2563eb',
    ribbonRight: '#1d4ed8',
    ribbonFold: '#1e3a8a',
    rimLight: '#f6c38f',
    rimMid: '#cd7f32',
    rimDark: '#7c4314',
    enamelTop: '#1e293b',
    enamelBottom: '#0f172a',
    emblem: '#fde68a',
    emblemAccent: '#60a5fa',
  },
  momentum_7: {
    ribbonLeft: '#0284c7',
    ribbonRight: '#0369a1',
    ribbonFold: '#0c4a6e',
    rimLight: '#f8fafc',
    rimMid: '#cbd5e1',
    rimDark: '#64748b',
    enamelTop: '#0f172a',
    enamelBottom: '#082f49',
    emblem: '#38bdf8',
    emblemAccent: '#facc15',
  },
  iron_will_30: {
    ribbonLeft: '#dc2626',
    ribbonRight: '#b91c1c',
    ribbonFold: '#7f1d1d',
    rimLight: '#e2e8f0',
    rimMid: '#94a3b8',
    rimDark: '#334155',
    enamelTop: '#18181b',
    enamelBottom: '#09090b',
    emblem: '#fbbf24',
    emblemAccent: '#f87171',
  },
  priority_crusher: {
    ribbonLeft: '#e11d48',
    ribbonRight: '#be123c',
    ribbonFold: '#881337',
    rimLight: '#fef08a',
    rimMid: '#eab308',
    rimDark: '#a16207',
    enamelTop: '#450a0a',
    enamelBottom: '#1c070b',
    emblem: '#fef08a',
    emblemAccent: '#fb7185',
  },
  architect_50: {
    ribbonLeft: '#059669',
    ribbonRight: '#047857',
    ribbonFold: '#064e3b',
    rimLight: '#f1f5f9',
    rimMid: '#cbd5e1',
    rimDark: '#475569',
    enamelTop: '#064e3b',
    enamelBottom: '#022c22',
    emblem: '#6ee7b7',
    emblemAccent: '#fde047',
  },
  centurion_100: {
    ribbonLeft: '#7c3aed',
    ribbonRight: '#5b21b6',
    ribbonFold: '#3b0764',
    rimLight: '#fef9c3',
    rimMid: '#f59e0b',
    rimDark: '#92400e',
    enamelTop: '#2e1065',
    enamelBottom: '#170936',
    emblem: '#fef08a',
    emblemAccent: '#c4b5fd',
  },
};

const LOCKED_THEME: MedalTheme = {
  ribbonLeft: '#94a3b8',
  ribbonRight: '#64748b',
  ribbonFold: '#475569',
  rimLight: '#cbd5e1',
  rimMid: '#94a3b8',
  rimDark: '#475569',
  enamelTop: '#334155',
  enamelBottom: '#1e293b',
  emblem: '#94a3b8',
  emblemAccent: '#64748b',
};

export const BadgeMedal: React.FC<BadgeMedalProps> = ({
  badgeId,
  unlocked,
  size = 64,
}) => {
  const uid = useId().replace(/:/g, '');
  const theme = unlocked ? MEDAL_THEMES[badgeId] || MEDAL_THEMES.first_step : LOCKED_THEME;

  const rimGrad = `rim-${uid}`;
  const enamelGrad = `enamel-${uid}`;
  const ribbonGradL = `ribL-${uid}`;
  const ribbonGradR = `ribR-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${
        unlocked ? 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.28)]' : 'opacity-55 grayscale'
      }`}
    >
      <defs>
        <linearGradient id={rimGrad} x1="12" y1="18" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.rimLight} />
          <stop offset="50%" stopColor={theme.rimMid} />
          <stop offset="100%" stopColor={theme.rimDark} />
        </linearGradient>
        <linearGradient id={enamelGrad} x1="32" y1="22" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.enamelTop} />
          <stop offset="100%" stopColor={theme.enamelBottom} />
        </linearGradient>
        <linearGradient id={ribbonGradL} x1="18" y1="4" x2="30" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.ribbonLeft} />
          <stop offset="100%" stopColor={theme.ribbonFold} />
        </linearGradient>
        <linearGradient id={ribbonGradR} x1="46" y1="4" x2="34" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={theme.ribbonRight} />
          <stop offset="100%" stopColor={theme.ribbonFold} />
        </linearGradient>
      </defs>

      {/* Top V-Ribbon Drape */}
      <path d="M16 4H27L32 19H23L16 4Z" fill={`url(#${ribbonGradL})`} />
      <path d="M48 4H37L32 19H41L48 4Z" fill={`url(#${ribbonGradR})`} />
      {/* Center Ribbon Stripe */}
      <path d="M20.5 4H23L28 19H25.5L20.5 4Z" fill="#ffffff" fillOpacity={unlocked ? 0.35 : 0.15} />
      <path d="M43.5 4H41L36 19H38.5L43.5 4Z" fill="#ffffff" fillOpacity={unlocked ? 0.25 : 0.1} />

      {/* Metallic Clasp Bar & Jump Ring */}
      <rect x="25" y="17.5" width="14" height="3.2" rx="1.6" fill={`url(#${rimGrad})`} />
      <circle cx="32" cy="21.5" r="2.2" stroke={`url(#${rimGrad})`} strokeWidth="1.6" />

      {/* Outer Medal Silhouette per Badge */}
      {badgeId === 'centurion_100' ? (
        <>
          {/* Grand 12-point Starburst Rim */}
          <path
            d="M32 21L35.8 23.6L40.3 22.7L42.3 26.8L46.7 28.1L46.5 32.7L49.7 36L47.3 40L48.4 44.5L44.4 46.7L43.3 51.2L38.7 51.2L35.6 54.6L32 52.5L28.4 54.6L25.3 51.2L20.7 51.2L19.6 46.7L15.6 44.5L16.7 40L14.3 36L17.5 32.7L17.3 28.1L21.7 26.8L23.7 22.7L28.2 23.6L32 21Z"
            fill={`url(#${rimGrad})`}
          />
          <circle cx="32" cy="39" r="14.5" fill={`url(#${enamelGrad})`} stroke={theme.rimLight} strokeWidth="1.1" />
        </>
      ) : badgeId === 'iron_will_30' ? (
        <>
          {/* Forged Shielded Octagon Rim */}
          <path
            d="M23 22.5H41L48.5 30V43.5L40 53.5L32 57.5L24 53.5L15.5 43.5V30L23 22.5Z"
            fill={`url(#${rimGrad})`}
          />
          <path
            d="M24.6 25.5H39.4L45.5 31.6V42.4L38.4 50.8L32 54L25.6 50.8L18.5 42.4V31.6L24.6 25.5Z"
            fill={`url(#${enamelGrad})`}
            stroke={theme.rimLight}
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </>
      ) : badgeId === 'architect_50' ? (
        <>
          {/* Precision Hexagon Rim */}
          <path
            d="M32 21.5L47.5 30.2V47.8L32 56.5L16.5 47.8V30.2L32 21.5Z"
            fill={`url(#${rimGrad})`}
          />
          <path
            d="M32 24.8L44.6 31.9V46.1L32 53.2L19.4 46.1V31.9L32 24.8Z"
            fill={`url(#${enamelGrad})`}
            stroke={theme.rimLight}
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          {/* Classic Fluted / Beveled Circular Medallion */}
          <circle cx="32" cy="39" r="18" fill={`url(#${rimGrad})`} />
          <circle
            cx="32"
            cy="39"
            r="15.8"
            stroke={theme.rimDark}
            strokeOpacity="0.4"
            strokeDasharray={badgeId === 'priority_crusher' ? '2.2 2.2' : undefined}
            strokeWidth="1.2"
          />
          <circle cx="32" cy="39" r="14" fill={`url(#${enamelGrad})`} />
        </>
      )}

      {/* Subtle Inner Bezel Ring */}
      <circle
        cx="32"
        cy="39"
        r="12"
        stroke={theme.rimLight}
        strokeOpacity={unlocked ? 0.25 : 0.12}
        strokeWidth="0.8"
        strokeDasharray={unlocked ? undefined : '2 2'}
      />

      {/* Bespoke Central Emblem */}
      {badgeId === 'first_step' && (
        <g>
          {/* Ascending Flag & Spark */}
          <path
            d="M27.5 47V30.5"
            stroke={theme.emblem}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M27.5 31L39.5 34.5L27.5 38.5V31Z"
            fill={theme.emblemAccent}
            stroke={theme.emblem}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M23.5 47H35.5"
            stroke={theme.emblem}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}

      {badgeId === 'momentum_7' && (
        <g>
          {/* Dynamic Kinetic Bolt & Orbit Arc */}
          <path
            d="M23.5 36.5A9 9 0 0 1 40.5 36.5"
            stroke={theme.emblem}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M33.5 29.5L27 39H32L30.5 48.5L37.5 38.5H32.5L33.5 29.5Z"
            fill={theme.emblemAccent}
            stroke={theme.emblem}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </g>
      )}

      {badgeId === 'iron_will_30' && (
        <g>
          {/* Diamond Core & Laurel V */}
          <path
            d="M32 29.5L38.5 37.5L32 46.5L25.5 37.5L32 29.5Z"
            fill={theme.emblemAccent}
            fillOpacity="0.25"
            stroke={theme.emblem}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M29 37.5L31.2 39.8L35.5 35"
            stroke={theme.emblem}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {badgeId === 'priority_crusher' && (
        <g>
          {/* Three-Peak Crown & Facet */}
          <path
            d="M23.5 43.5L25 34L29.5 37.8L32 31.5L34.5 37.8L39 34L40.5 43.5H23.5Z"
            fill={theme.emblem}
            stroke={theme.emblemAccent}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <rect x="24.5" y="45" width="15" height="2.2" rx="1.1" fill={theme.emblemAccent} />
        </g>
      )}

      {badgeId === 'architect_50' && (
        <g>
          {/* Architectural Compass & Keystone */}
          <path
            d="M32 29.5L25.5 46.5M32 29.5L38.5 46.5"
            stroke={theme.emblem}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M26.5 41.5A8 8 0 0 0 37.5 41.5"
            stroke={theme.emblemAccent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="32" cy="30" r="2.2" fill={theme.emblemAccent} />
        </g>
      )}

      {badgeId === 'centurion_100' && (
        <g>
          {/* Laurel Wreath + Twin Star Crest */}
          <path
            d="M23.5 44C21.5 40 22 34.5 25.5 31.5M40.5 44C42.5 40 42 34.5 38.5 31.5"
            stroke={theme.emblemAccent}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M32 30.5L34.2 35.1L39.2 35.8L35.6 39.3L36.5 44.3L32 41.9L27.5 44.3L28.4 39.3L24.8 35.8L29.8 35.1L32 30.5Z"
            fill={theme.emblem}
          />
        </g>
      )}

      {/* Top Specular Gloss Arc when Unlocked */}
      {unlocked && (
        <path
          d="M23 29A13.5 13.5 0 0 1 41 29"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
