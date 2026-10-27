import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/LanguageContext';
import type { ComponentId } from '../physics';
import type { NavSectionId, ThemeMode } from '../ui/theme';
import { IconGlobe, IconMoon, IconSun } from './Icons';

interface TopBarProps {
  activeSection: NavSectionId;
  selectedComponent: ComponentId;
  theme: ThemeMode;
  onToggleTheme: (next: ThemeMode) => void;
  onResetDefaults: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  selectedComponent,
  theme,
  onToggleTheme,
  onResetDefaults,
}) => {
  const { lang, setLang, t } = useLanguage();

  const sectionLabelMap: Record<NavSectionId, string> = {
    plant: t.nav.plant,
    parameters: t.nav.parameters,
    laws: t.nav.laws,
    calculations: t.nav.calculations,
    diagram: t.nav.diagram,
    results: t.nav.results,
  };

  return (
    <header className="topbar-panel liquid-glass in-down">
      <nav className="breadcrumb-trail" aria-label={t.topbar.breadcrumbAria}>
        <span className="status-live-pill" aria-hidden="true">
          <span className="status-live-dot" />
          50 HZ · SYNC
        </span>
        <span className="crumb-root">{t.appTitle}</span>
        <span className="crumb-sep" aria-hidden="true">
          ›
        </span>
        <span className="crumb-section">{sectionLabelMap[activeSection]}</span>
        <span className="crumb-sep" aria-hidden="true">
          ›
        </span>
        <strong className="crumb-current">{t.components[selectedComponent].name}</strong>
      </nav>

      <div className="topbar-actions">
        {/* Language Dropdown EN / FR */}
        <label className="lang-select-pill" aria-label={t.langSwitch.label}>
          <IconGlobe />
          <select
            className="lang-select-native"
            value={lang}
            aria-label={t.langSwitch.label}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            <option value="en">{t.langSwitch.en}</option>
            <option value="fr">{t.langSwitch.fr}</option>
          </select>
        </label>

        {/* Light / Dark Theme Toggle */}
        <div
          className="theme-toggle-pill"
          role="group"
          aria-label={t.topbar.themeToggleAria}
        >
          <button
            type="button"
            className={`theme-segment-btn ${theme === 'light' ? 'theme-segment-active' : ''}`}
            aria-label={t.topbar.lightMode}
            aria-pressed={theme === 'light'}
            onClick={() => onToggleTheme('light')}
          >
            <IconSun />
          </button>
          <button
            type="button"
            className={`theme-segment-btn ${theme === 'dark' ? 'theme-segment-active' : ''}`}
            aria-label={t.topbar.darkMode}
            aria-pressed={theme === 'dark'}
            onClick={() => onToggleTheme('dark')}
          >
            <IconMoon />
          </button>
        </div>

        {/* White Primary Action Button: Reset to defaults */}
        <button
          type="button"
          className="primary-reset-btn btn-halo"
          onClick={onResetDefaults}
        >
          <span>{t.topbar.resetDefaults}</span>
          <span className="btn-reset-arrow" aria-hidden="true">
            ↺
          </span>
        </button>
      </div>
    </header>
  );
};
