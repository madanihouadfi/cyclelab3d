import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export const CalculationsPlaceholder: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="panel-card" aria-label={t.calculations.title}>
      <span className="inspector-badge">{t.calculations.placeholderBadge}</span>
      <h2 className="panel-heading">{t.calculations.title}</h2>
      <p className="inspector-role">{t.calculations.subtitle}</p>
      <div className="law-card">
        <p className="law-explanation">{t.calculations.placeholderBody}</p>
      </div>
    </section>
  );
};
