import React, { useMemo, useState } from 'react';
import { ComponentInspector } from './components/ComponentInspector';
import { PlantScene3D } from './components/PlantScene3D';
import { ResultsPanel } from './components/ResultsPanel';
import { SliderPanel } from './components/SliderPanel';
import { TsDiagram } from './components/TsDiagram';
import { useLanguage } from './i18n/LanguageContext';
import {
  buildCycleViewModel,
  DEFAULT_PARAMETERS,
  solveCombinedCycle,
  type ComponentId,
} from './physics';

export const App: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  const [T3_K, setT3_K] = useState<number>(DEFAULT_PARAMETERS.T3_K);
  const [rp, setRp] = useState<number>(DEFAULT_PARAMETERS.rp);
  const [selectedComponent, setSelectedComponent] = useState<ComponentId>('gasTurbine');
  const [flowPlaying, setFlowPlaying] = useState<boolean>(true);
  const [sheetExpanded, setSheetExpanded] = useState<boolean>(false);

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
    setSheetExpanded(true);
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-block">
          <h1 className="brand-title">{t.appTitle}</h1>
          <p className="brand-subtitle">{t.appSubtitle}</p>
        </div>

        <div className="header-controls">
          <span className="disclaimer-pill">{t.disclaimer}</span>
          <div className="lang-switcher" role="group" aria-label={t.langSwitch.label}>
            <button
              type="button"
              className={`lang-btn ${lang === 'en' ? 'lang-btn-active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              {t.langSwitch.en}
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === 'fr' ? 'lang-btn-active' : ''}`}
              onClick={() => setLang('fr')}
              aria-pressed={lang === 'fr'}
            >
              {t.langSwitch.fr}
            </button>
          </div>
        </div>
      </header>

      <main className="workspace-grid">
        <div className="main-stage">
          <PlantScene3D
            result={cycleResult}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            flowPlaying={flowPlaying}
            onToggleFlow={() => setFlowPlaying((prev) => !prev)}
          />

          <div className="stage-bottom-grid">
            <TsDiagram result={cycleResult} />
            <ResultsPanel vm={vm} />
          </div>
        </div>

        <aside
          className={`side-panel bottom-sheet ${sheetExpanded ? 'bottom-sheet-expanded' : ''}`}
        >
          <button
            type="button"
            className="bottom-sheet-handle"
            onClick={() => setSheetExpanded((prev) => !prev)}
            aria-expanded={sheetExpanded}
            aria-label={t.components.selectedTitle}
          >
            <span className="sheet-grabber" />
            <span className="sheet-title">{t.components[selectedComponent].name}</span>
          </button>

          <div className="side-panel-scroll">
            <SliderPanel
              result={cycleResult}
              vm={vm}
              onChangeT3={setT3_K}
              onChangeRp={setRp}
            />
            <ComponentInspector
              selectedComponent={selectedComponent}
              result={cycleResult}
              vm={vm}
            />
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <p>{t.disclaimer}</p>
      </footer>
    </div>
  );
};

export default App;
