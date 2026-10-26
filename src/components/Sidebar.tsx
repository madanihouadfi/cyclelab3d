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
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'plant', label: t.nav.plant, icon: <IconPlant /> },
    { id: 'parameters', label: t.nav.parameters, icon: <IconParameters /> },
    { id: 'laws', label: t.nav.laws, icon: <IconLaws /> },
    { id: 'calculations', label: t.nav.calculations, icon: <IconCalculations /> },
    { id: 'diagram', label: t.nav.diagram, icon: <IconDiagram /> },
    { id: 'results', label: t.nav.results, icon: <IconResults /> },
  ];

  return (
    <aside className="sidebar-panel" aria-label={t.nav.ariaLabel}>
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
                <span className="sidebar-nav-label">{item.label}</span>
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
        <strong className="sidebar-footer-title">{t.nav.educationalCardTitle}</strong>
        <p className="sidebar-disclaimer-text">{t.disclaimer}</p>
      </div>
    </aside>
  );
};
