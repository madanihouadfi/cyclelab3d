import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { CombinedCycleResult, CycleViewModel } from '../physics';

interface SliderPanelProps {
  result: CombinedCycleResult;
  vm: CycleViewModel;
  onChangeT3: (t3: number) => void;
  onChangeRp: (rp: number) => void;
}

export const SliderPanel: React.FC<SliderPanelProps> = ({
  result,
  vm,
  onChangeT3,
  onChangeRp,
}) => {
  const { t } = useLanguage();
  const { sliders, fixedParams } = vm;

  return (
    <section className="panel-card" aria-label={t.sliders.title}>
      <h2 className="panel-heading">{t.sliders.title}</h2>

      {!result.ok && result.error && (
        <div className="error-banner" role="alert">
          <strong>{t.errors.title}</strong>
          <p>{t.errors[result.error.code]}</p>
        </div>
      )}

      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="slider-t3">{t.sliders.titLabel}</label>
          <span className="slider-value">
            {sliders.T3_displayK} {t.units.K} ({sliders.T3_displayC} {t.units.C})
          </span>
        </div>
        <input
          id="slider-t3"
          type="range"
          min={sliders.T3_min}
          max={sliders.T3_max}
          step={sliders.T3_step}
          value={sliders.T3_value}
          onChange={(e) => onChangeT3(Number(e.target.value))}
          className="range-input"
        />
      </div>

      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="slider-rp">{t.sliders.rpLabel}</label>
          <span className="slider-value">{sliders.rp_display}</span>
        </div>
        <input
          id="slider-rp"
          type="range"
          min={sliders.rp_min}
          max={sliders.rp_max}
          step={sliders.rp_step}
          value={sliders.rp_value}
          onChange={(e) => onChangeRp(Number(e.target.value))}
          className="range-input"
        />
      </div>

      <details className="fixed-params-details">
        <summary>{t.sliders.fixedParamsTitle}</summary>
        <ul className="fixed-params-list">
          <li>
            <span>{t.sliders.etaComp}</span>
            <strong>
              {fixedParams.etaComp} {t.units.percent}
            </strong>
          </li>
          <li>
            <span>{t.sliders.etaGt}</span>
            <strong>
              {fixedParams.etaGt} {t.units.percent}
            </strong>
          </li>
          <li>
            <span>{t.sliders.etaSt}</span>
            <strong>
              {fixedParams.etaSt} {t.units.percent}
            </strong>
          </li>
          <li>
            <span>{t.sliders.etaPump}</span>
            <strong>
              {fixedParams.etaPump} {t.units.percent}
            </strong>
          </li>
          <li>
            <span>{t.sliders.etaComb}</span>
            <strong>
              {fixedParams.etaComb} {t.units.percent}
            </strong>
          </li>
          <li>
            <span>{t.sliders.lhv}</span>
            <strong>
              {fixedParams.lhvKJkg} {t.units.kJkg}
            </strong>
          </li>
          <li>
            <span>{t.sliders.steamPress}</span>
            <strong>
              {fixedParams.steamPressMPa} {t.units.MPa}
            </strong>
          </li>
          <li>
            <span>{t.sliders.steamTemp}</span>
            <strong>
              {fixedParams.steamTempC} {t.units.C}
            </strong>
          </li>
          <li>
            <span>{t.sliders.condPress}</span>
            <strong>
              {fixedParams.condPressKPa} {t.units.kPa}
            </strong>
          </li>
          <li>
            <span>{t.sliders.pinchPoint}</span>
            <strong>
              {fixedParams.pinchK} {t.units.K}
            </strong>
          </li>
          <li>
            <span>{t.sliders.airMassFlow}</span>
            <strong>
              {fixedParams.airMassFlow} {t.units.kgs}
            </strong>
          </li>
        </ul>
      </details>
    </section>
  );
};
