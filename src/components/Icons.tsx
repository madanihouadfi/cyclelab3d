import React from 'react';

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.85,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const IconPlant: React.FC = () => (
  <svg {...svgProps}>
    <path d="M3 21h18" />
    <path d="M5 21V11l5 3V9l5 3V5h4v16" />
  </svg>
);

export const IconParameters: React.FC = () => (
  <svg {...svgProps}>
    <line x1="4" y1="6" x2="14" y2="6" />
    <line x1="18" y1="6" x2="20" y2="6" />
    <circle cx="16" cy="6" r="2" />
    <line x1="4" y1="12" x2="8" y2="12" />
    <line x1="12" y1="12" x2="20" y2="12" />
    <circle cx="10" cy="12" r="2" />
    <line x1="4" y1="18" x2="15" y2="18" />
    <line x1="19" y1="18" x2="20" y2="18" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

export const IconLaws: React.FC = () => (
  <svg {...svgProps}>
    <path d="M5 4h11l3 3v13H5z" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="13" y2="18" />
  </svg>
);

export const IconCalculations: React.FC = () => (
  <svg {...svgProps}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="10" y2="16" />
    <line x1="14" y1="16" x2="16" y2="16" />
  </svg>
);

export const IconDiagram: React.FC = () => (
  <svg {...svgProps}>
    <path d="M4 4v16h16" />
    <path d="M7 16c2.8-8 6.5-8 10-2" />
    <circle cx="12" cy="10" r="1.5" />
  </svg>
);

export const IconResults: React.FC = () => (
  <svg {...svgProps}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
    <path d="M3 17.5l9 5 9-5" />
  </svg>
);

export const IconFullscreen: React.FC = () => (
  <svg {...svgProps}>
    <path d="M4 9V4h5" />
    <path d="M15 4h5v5" />
    <path d="M20 15v5h-5" />
    <path d="M9 20H4v-5" />
  </svg>
);

export const IconResetCamera: React.FC = () => (
  <svg {...svgProps}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v5h-5" />
  </svg>
);

export const IconPlay: React.FC = () => (
  <svg {...svgProps}>
    <polygon points="7,5 19,12 7,19" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause: React.FC = () => (
  <svg {...svgProps}>
    <line x1="9" y1="6" x2="9" y2="18" strokeWidth="2.4" />
    <line x1="15" y1="6" x2="15" y2="18" strokeWidth="2.4" />
  </svg>
);

export const IconZoomIn: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="11" cy="11" r="6.5" />
    <line x1="20" y1="20" x2="15.8" y2="15.8" />
    <line x1="8.5" y1="11" x2="13.5" y2="11" />
    <line x1="11" y1="8.5" x2="11" y2="13.5" />
  </svg>
);

export const IconZoomOut: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="11" cy="11" r="6.5" />
    <line x1="20" y1="20" x2="15.8" y2="15.8" />
    <line x1="8.5" y1="11" x2="13.5" y2="11" />
  </svg>
);

export const IconSettings: React.FC = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.2 5.2l2 2M16.8 16.8l2 2M5.2 18.8l2-2M16.8 7.2l2-2" />
  </svg>
);

export const IconSun: React.FC = () => (
  <svg {...svgProps} width={15} height={15}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
);

export const IconMoon: React.FC = () => (
  <svg {...svgProps} width={15} height={15}>
    <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a8.5 8.5 0 1 0 10.9 10.9z" />
  </svg>
);

export const IconGlobe: React.FC = () => (
  <svg {...svgProps} width={15} height={15}>
    <circle cx="12" cy="12" r="9" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

export const IconMouse: React.FC = () => (
  <svg {...svgProps} width={14} height={14}>
    <rect x="6" y="3" width="12" height="18" rx="6" />
    <line x1="12" y1="7" x2="12" y2="10" />
  </svg>
);
