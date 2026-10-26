import React, { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  evaluateComponentLaws,
  PLANT_COMPONENTS,
  type CombinedCycleResult,
  type ComponentId,
  type CycleViewModel,
} from '../physics';

interface ComponentInspectorProps {
  selectedComponent: ComponentId;
  result: CombinedCycleResult;
  vm: CycleViewModel;
}

export const ComponentInspector: React.FC<ComponentInspectorProps> = ({
  selectedComponent,
  result,
  vm,
}) => {
  const { t } = useLanguage();

  const meta = useMemo(
    () => PLANT_COMPONENTS.find((c) => c.id === selectedComponent) ?? PLANT_COMPONENTS[0],
    [selectedComponent],
  );

  const liveLaws = useMemo(
    () => evaluateComponentLaws(selectedComponent, result),
    [selectedComponent, result],
  );

  const inletState = vm.formattedStates[meta.inletStateId];
  const outletState = vm.formattedStates[meta.outletStateId];

  return (
    <section className="panel-card" aria-label={t.components.selectedTitle}>
      <div className="inspector-header">
        <span className="inspector-badge">{t.components.selectedTitle}</span>
        <h2 className="panel-heading">{t.components[selectedComponent].name}</h2>
        <p className="inspector-role">{t.components[selectedComponent].role}</p>
      </div>

      <div className="inlet-outlet-grid">
        <div className="io-card">
          <h4>
            {t.components.inletState}: {t.statePoints.labels[inletState.idStr]}
          </h4>
          <p>
            {t.statePoints.tempK}: <strong>{inletState.T_K}</strong> ({inletState.T_C} {t.units.C})
          </p>
          <p>
            {t.statePoints.pressure}: <strong>{inletState.p_kPa}</strong>
          </p>
          <p>
            {t.statePoints.enthalpy}: <strong>{inletState.h_kJkg}</strong>
          </p>
          <p>
            {t.statePoints.entropy}: <strong>{inletState.s_kJkgK}</strong>
          </p>
          <p>
            {t.statePoints.massFlow}: <strong>{inletState.mDot_kgs}</strong>
          </p>
        </div>

        <div className="io-card">
          <h4>
            {t.components.outletState}: {t.statePoints.labels[outletState.idStr]}
          </h4>
          <p>
            {t.statePoints.tempK}: <strong>{outletState.T_K}</strong> ({outletState.T_C}{' '}
            {t.units.C})
          </p>
          <p>
            {t.statePoints.pressure}: <strong>{outletState.p_kPa}</strong>
          </p>
          <p>
            {t.statePoints.enthalpy}: <strong>{outletState.h_kJkg}</strong>
          </p>
          <p>
            {t.statePoints.entropy}: <strong>{outletState.s_kJkgK}</strong>
          </p>
          <p>
            {t.statePoints.massFlow}: <strong>{outletState.mDot_kgs}</strong>
          </p>
        </div>
      </div>

      <h3 className="sub-heading">{t.components.lawsHeader}</h3>
      <div className="laws-list">
        {liveLaws.map((law) => {
          const lawText = t.laws[law.dictKey];
          return (
            <article key={law.lawId} className="law-card">
              <h4>{lawText.title}</h4>
              <code className="law-formula">{lawText.formula}</code>
              <p className="law-explanation">{lawText.explanation}</p>
              <div className="law-live-box">
                <span>{t.components.liveCalculation}:</span>
                <code>{law.liveEquation}</code>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
