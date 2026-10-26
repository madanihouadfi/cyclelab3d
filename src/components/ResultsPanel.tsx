import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { CycleViewModel, StatePointId } from '../physics';

interface ResultsPanelProps {
  vm: CycleViewModel;
}

const STATE_IDS: StatePointId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ vm }) => {
  const { t } = useLanguage();
  const { summary, formattedStates } = vm;

  return (
    <section className="panel-card" aria-label={t.results.title}>
      <h2 className="panel-heading">{t.results.title}</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">{t.results.gtPower}</span>
          <strong className="kpi-value">
            {summary.gtPowerMW} {t.units.MW}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">{t.results.stPower}</span>
          <strong className="kpi-value">
            {summary.stPowerMW} {t.units.MW}
          </strong>
        </div>
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label">{t.results.netPower}</span>
          <strong className="kpi-value">
            {summary.netPowerMW} {t.units.MW}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">{t.results.gtEfficiency}</span>
          <strong className="kpi-value">
            {summary.gtEfficiencyPct} {t.units.percent}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">{t.results.stEfficiency}</span>
          <strong className="kpi-value">
            {summary.stEfficiencyPct} {t.units.percent}
          </strong>
        </div>
        <div className="kpi-card kpi-highlight">
          <span className="kpi-label">{t.results.ccEfficiency}</span>
          <strong className="kpi-value">
            {summary.ccEfficiencyPct} {t.units.percent}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">{t.results.fuelMassFlow}</span>
          <strong className="kpi-value">
            {summary.fuelMassFlow} {t.units.kgs}
          </strong>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">{t.results.steamMassFlow}</span>
          <strong className="kpi-value">
            {summary.steamMassFlow} {t.units.kgs}
          </strong>
        </div>
      </div>

      <h3 className="sub-heading">{t.statePoints.title}</h3>
      <div className="table-scroll">
        <table className="state-table">
          <thead>
            <tr>
              <th>{t.statePoints.point}</th>
              <th>{t.statePoints.fluid}</th>
              <th>{t.statePoints.tempK}</th>
              <th>{t.statePoints.tempC}</th>
              <th>{t.statePoints.pressure}</th>
              <th>{t.statePoints.enthalpy}</th>
              <th>{t.statePoints.entropy}</th>
              <th>{t.statePoints.massFlow}</th>
              <th>{t.statePoints.quality}</th>
            </tr>
          </thead>
          <tbody>
            {STATE_IDS.map((id) => {
              const sp = formattedStates[id];
              return (
                <tr key={id}>
                  <td title={t.statePoints.labels[sp.idStr]}>
                    <span
                      className="state-dot"
                      style={{ backgroundColor: sp.colorHex }}
                    />
                    {sp.idStr}
                  </td>
                  <td>{t.statePoints.fluids[sp.fluid]}</td>
                  <td>{sp.T_K}</td>
                  <td>{sp.T_C}</td>
                  <td>{sp.p_kPa}</td>
                  <td>{sp.h_kJkg}</td>
                  <td>{sp.s_kJkgK}</td>
                  <td>{sp.mDot_kgs}</td>
                  <td>{sp.quality}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
