import React, { useEffect, useMemo, useState } from 'react';
import { CalculationsPlaceholder } from './components/CalculationsPlaceholder';
import { ComponentInspector } from './components/ComponentInspector';
import { PlantScene3D } from './components/PlantScene3D';
import { KpiStripCards, ResultsPanel } from './components/ResultsPanel';
import { Sidebar } from './components/Sidebar';
import { SliderPanel } from './components/SliderPanel';
import { TopBar } from './components/TopBar';
import { TsDiagram } from './components/TsDiagram';
import { useLanguage } from './i18n/LanguageContext';
import {
  buildCycleViewModel,
  DEFAULT_PARAMETERS,
  solveCombinedCycle,
  type ComponentId,
} from './physics';
import type { NavSectionId, ThemeMode, ViewMode } from './ui/theme';

const VALID_SECTIONS: NavSectionId[] = [
  'plant',
  'parameters',
  'laws',
  'calculations',
  'diagram',
  'results',
];

export const App: React.FC = () => {
  const { t } = useLanguage();

  const initialParams = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(),
    [],
  );

  const [theme, setTheme] = useState<ThemeMode>(() =>
    initialParams.get('theme') === 'light' ? 'light' : 'dark',
  );

  const [activeSection, setActiveSection] = useState<NavSectionId>(() => {
    const sec = initialParams.get('section') as NavSectionId | null;
    if (sec && VALID_SECTIONS.includes(sec)) {
      return sec;
    }
    return 'plant';
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const v = initialParams.get('view');
    if (v === 'xray' || v === 'temperature' || v === 'realistic') {
      return v;
    }
    return 'realistic';
  });

  const [T3_K, setT3_K] = useState<number>(DEFAULT_PARAMETERS.T3_K);
  const [rp, setRp] = useState<number>(DEFAULT_PARAMETERS.rp);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId>(() => {
    const focusParam = initialParams.get('focus') as ComponentId | null;
    return focusParam ?? 'gasTurbine';
  });
  const [flowPlaying, setFlowPlaying] = useState<boolean>(true);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(
    () => initialParams.get('sheet') === '1',
  );
  const [showcaseMode, setShowcaseMode] = useState<boolean>(
    () => initialParams.get('showcase') === '1',
  );
  const [resetSignal, setResetSignal] = useState<number>(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const cycleResult = useMemo(
    () =>
      solveCombinedCycle({
        T3_K,
        rp,
      }),
    [T3_K, rp],
  );

  const vm = useMemo(() => buildCycleViewModel(cycleResult), [cycleResult]);

  const handleSelectComponent = (id: ComponentId) => {
    setSelectedComponent(id);
    if (!showcaseMode) {
      setSheetExpanded(true);
    }
  };

  const handleSelectSection = (section: NavSectionId) => {
    setActiveSection(section);
    if (showcaseMode) {
      setShowcaseMode(false);
    }
  };

  const handleResetDefaults = () => {
    setT3_K(DEFAULT_PARAMETERS.T3_K);
    setRp(DEFAULT_PARAMETERS.rp);
    setSelectedComponent('gasTurbine');
    setViewMode('realistic');
    setResetSignal((c) => c + 1);
  };

  const renderCenterWorkspace = () => {
    switch (activeSection) {
      case 'diagram':
        return <TsDiagram result={cycleResult} fullPage />;
      case 'results':
        return <ResultsPanel vm={vm} />;
      case 'laws':
        return (
          <ComponentInspector
            selectedComponent={selectedComponent}
            result={cycleResult}
            vm={vm}
          />
        );
      case 'calculations':
        return <CalculationsPlaceholder />;
      case 'plant':
      case 'parameters':
      default:
        return (
          <PlantScene3D
            result={cycleResult}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            flowPlaying={flowPlaying}
            onToggleFlow={() => setFlowPlaying((prev) => !prev)}
            showcaseMode={showcaseMode}
            onToggleShowcase={() => setShowcaseMode((prev) => !prev)}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            resetSignal={resetSignal}
          />
        );
    }
  };

  const renderRightPanelContent = () => {
    return (
      <>
        <SliderPanel
          result={cycleResult}
          vm={vm}
          onChangeT3={setT3_K}
          onChangeRp={setRp}
        />
        {activeSection !== 'laws' && (
          <ComponentInspector
            selectedComponent={selectedComponent}
            result={cycleResult}
            vm={vm}
          />
        )}
      </>
    );
  };

  const showHeroBanner =
    !showcaseMode && (activeSection === 'plant' || activeSection === 'parameters');

  return (
    <div
      className={`app-shell ${showcaseMode ? 'app-shell-showcase' : ''}`}
      data-theme={theme}
    >
      <div className="page-grain" aria-hidden="true" />

      {!showcaseMode && (
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          selectedComponent={selectedComponent}
        />
      )}

      <div className="center-stage">
        <TopBar
          activeSection={activeSection}
          selectedComponent={selectedComponent}
          theme={theme}
          onToggleTheme={setTheme}
          onResetDefaults={handleResetDefaults}
        />

        {showHeroBanner && (
          <section className="studio-hero-banner liquid-glass in-blur" aria-label={t.appTitle}>
            <div className="studio-hero-copy">
              <div className="studio-eyebrow-row">
                <span className="studio-eyebrow-badge">
                  <span className="studio-pulse-dot" aria-hidden="true" />
                  {t.hero.eyebrow}
                </span>
                <span className="studio-spec-chip">{t.hero.specBadge1}</span>
                <span className="studio-spec-chip">{t.hero.specBadge2}</span>
              </div>
              <h1 className="studio-hero-headline">
                {t.hero.titleLead} <em>{t.hero.titleAccent}</em> {t.hero.titleTrail}
              </h1>
              <p className="studio-hero-sub">{t.hero.subtitle}</p>
            </div>
            <div className="studio-hero-actions">
              <button
                type="button"
                className="studio-btn-ghost"
                onClick={() => handleSelectSection('diagram')}
              >
                <span>{t.hero.ctaDiagram}</span>
                <span className="studio-btn-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
              <button
                type="button"
                className="studio-btn-solid btn-halo"
                onClick={() => setShowcaseMode(true)}
              >
                <span>{t.hero.ctaShowcase}</span>
                <span className="studio-btn-chip" aria-hidden="true">
                  ↗
                </span>
              </button>
            </div>
          </section>
        )}

        {renderCenterWorkspace()}

        {!showcaseMode && <KpiStripCards vm={vm} />}
      </div>

      {!showcaseMode && (
        <aside
          className={`side-panel bottom-sheet in-fade ${sheetExpanded ? 'bottom-sheet-expanded' : ''}`}
          aria-label={t.nav[activeSection]}
        >
          <button
            type="button"
            className="bottom-sheet-handle"
            onClick={() => setSheetExpanded((prev) => !prev)}
            aria-expanded={sheetExpanded}
            aria-label={t.components.selectedTitle}
          >
            <span className="sheet-grabber" />
            <span className="sheet-title">
              {t.nav[activeSection]} · {t.components[selectedComponent].name}
            </span>
          </button>

          <div className="side-panel-scroll">{renderRightPanelContent()}</div>
        </aside>
      )}
    </div>
  );
};

export default App;
