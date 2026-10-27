import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { ComponentId } from '../physics';
import type { NavSectionId } from '../ui/theme';
import { CycleLabLogo } from './CycleLabLogo';
import {
  IconCalculations,
  IconDiagram,
  IconLaws,
  IconParameters,
  IconPlant,
  IconResults,
} from './Icons';

interface SidebarProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  selectedComponent: ComponentId;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  selectedComponent,
}) => {
  const { t } = useLanguage();

  const navItems: {
    id: NavSectionId;
    idx: string;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'plant', idx: '01', label: t.nav.plant, icon: <IconPlant /> },
    { id: 'parameters', idx: '02', label: t.nav.parameters, icon: <IconParameters /> },
    { id: 'laws', idx: '03', label: t.nav.laws, icon: <IconLaws /> },
    { id: 'calculations', idx: '04', label: t.nav.calculations, icon: <IconCalculations /> },
    { id: 'diagram', idx: '05', label: t.nav.diagram, icon: <IconDiagram /> },
    { id: 'results', idx: '06', label: t.nav.results, icon: <IconResults /> },
  ];

  return (
    <aside className="sidebar-panel liquid-glass in-blur" aria-label={t.nav.ariaLabel}>
      <CycleLabLogo />

      <nav className="sidebar-nav" role="navigation" aria-label={t.nav.ariaLabel}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectSection(item.id)}
              >
                <span className="sidebar-nav-left">
                  <span className="sidebar-nav-idx" aria-hidden="true">
                    {item.idx}
                  </span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </span>
                <span className="sidebar-nav-icon">{item.icon}</span>
              </button>
              {item.id === 'plant' && (
                <div className="sidebar-nav-child" aria-live="polite">
                  <span>↳ {t.components[selectedComponent].name}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar-footer-card">
        <div className="sidebar-footer-meta" aria-hidden="true">
          <span>IAPWS-IF97</span>
          <span>10 LAWS</span>
        </div>
        <strong className="sidebar-footer-title">{t.nav.educationalCardTitle}</strong>
        <p className="sidebar-disclaimer-text">{t.disclaimer}</p>
      </div>
    </aside>
  );
};
