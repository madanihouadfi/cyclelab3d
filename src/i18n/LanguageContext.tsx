import React, { createContext, useContext, useState } from 'react';
import en from './en.json';
import fr from './fr.json';

export type Language = 'en' | 'fr';
export type Dictionary = typeof en;

const dictionaries: Record<Language, Dictionary> = { en, fr };

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
  t: en,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
