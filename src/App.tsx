import React from 'react';
import { useLanguage } from './i18n/LanguageContext';

export const App: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <div role="group" aria-label={t.langSwitch.label}>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            style={{ fontWeight: lang === 'en' ? 'bold' : 'normal', marginRight: '0.5rem', padding: '0.4rem 0.8rem' }}
          >
            {t.langSwitch.en}
          </button>
          <button
            type="button"
            onClick={() => setLang('fr')}
            aria-pressed={lang === 'fr'}
            style={{ fontWeight: lang === 'fr' ? 'bold' : 'normal', padding: '0.4rem 0.8rem' }}
          >
            {t.langSwitch.fr}
          </button>
        </div>
      </header>
      <footer>
        <p>{t.disclaimer}</p>
      </footer>
    </div>
  );
};

export default App;
