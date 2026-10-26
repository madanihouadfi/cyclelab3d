import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const CycleLabLogo: React.FC = () => {
  const { t } = useLanguage();
  const titleParts = t.appTitle.split(' ');
  const mainWord = titleParts[0] ?? 'CycleLab';
  const subWord = titleParts[1] ?? '3D';
  const cyclePrefix = mainWord.slice(0, 5).toUpperCase();
  const labSuffix = mainWord.slice(5).toUpperCase();

  return (
    <div className="brand-logo-block" aria-label={t.appTitle}>
      <div className="brand-logo-emblem-wrap">
        <svg
          className="brand-logo-svg"
          width="44"
          height="44"
          viewBox="0 0 64 64"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cl-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="cl-brayton-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Outer precision CAD bezel ring */}
          <circle
            cx="32"
            cy="32"
            r="29"
            fill="var(--panel-2)"
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {/* 12 Engineering degree graduations */}
          <g stroke="var(--text-muted)" strokeWidth="1.2" opacity="0.55">
            <line x1="32" y1="3" x2="32" y2="7" />
            <line x1="32" y1="57" x2="32" y2="61" />
            <line x1="3" y1="32" x2="7" y2="32" />
            <line x1="57" y1="32" x2="61" y2="32" />
            <line x1="11.5" y1="11.5" x2="14.3" y2="14.3" />
            <line x1="52.5" y1="11.5" x2="49.7" y2="14.3" />
            <line x1="11.5" y1="52.5" x2="14.3" y2="49.7" />
            <line x1="52.5" y1="52.5" x2="49.7" y2="49.7" />
          </g>

          {/* Upper Brayton Topping Cycle Arc (Hot Gas Path) */}
          <path
            d="M 10 28 A 22 22 0 0 1 53.5 26"
            fill="none"
            stroke="url(#cl-brayton-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <polygon points="55,28 50.5,22.5 56.5,22" fill="#fb923c" />

          {/* Lower Rankine Bottoming Cycle Arc (Steam/Water Path) */}
          <path
            d="M 54 36 A 22 22 0 0 1 10.5 38"
            fill="none"
            stroke="url(#cl-teal-grad)"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <polygon points="9,36 13.5,41.5 7.5,42" fill="#2dd4bf" />

          {/* Inner Stator Shroud Ring */}
          <circle
            cx="32"
            cy="32"
            r="15.5"
            fill="none"
            stroke="var(--text-primary)"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.45"
          />

          {/* 8-Airfoil Axial Turbine Rotor Blades */}
          <g fill="var(--text-primary)" opacity="0.92">
            <path d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z" />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(45 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(90 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(135 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(180 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(225 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(270 32 32)"
            />
            <path
              d="M30.8 32 L29.5 17.5 Q32 16 33.2 18.5 L33.2 32 Z"
              transform="rotate(315 32 32)"
            />
          </g>

          {/* Precision Rotor Hub & Synchronous Shaft Bore */}
          <circle
            cx="32"
            cy="32"
            r="6.2"
            fill="var(--panel)"
            stroke="url(#cl-teal-grad)"
            strokeWidth="2.2"
          />
          <circle cx="32" cy="32" r="2.3" fill="#2dd4bf" />
        </svg>
      </div>

      <div className="brand-logo-text">
        <div className="brand-logo-wordmark">
          <span>{cyclePrefix}</span>
          <strong className="brand-logo-accent">{labSuffix}</strong>
          <span className="brand-logo-badge">{subWord}</span>
        </div>
        <span className="brand-logo-tagline">CCGT ENGINEERING LAB</span>
      </div>
    </div>
  );
};
