import React, { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  buildCycleViewModel,
  DEFAULT_PARAMETERS,
  solveCombinedCycle,
  type CombinedCycleResult,
  type ComponentId,
  type CycleViewModel,
} from '../physics';

interface CalculationsPlaceholderProps {
  result?: CombinedCycleResult;
  vm?: CycleViewModel;
}

const ORDERED_COMPONENTS: ComponentId[] = [
  'compressor',
  'combustor',
  'gasTurbine',
  'hrsg',
  'steamTurbine',
  'condenser',
  'pump',
  'generator',
];

export const CalculationsPlaceholder: React.FC<CalculationsPlaceholderProps> = ({
  result: propResult,
  vm: propVm,
}) => {
  const { t } = useLanguage();

  const fallbackResult = useMemo(
    () => propResult ?? solveCombinedCycle(DEFAULT_PARAMETERS),
    [propResult],
  );
  const vm = useMemo(
    () => propVm ?? buildCycleViewModel(fallbackResult),
    [propVm, fallbackResult],
  );
  const r = fallbackResult;

  const qInMW = Math.max(1e-3, r.heatInput_MW);
  const wGtMW = Math.max(0, r.gtPower_MW);
  const wStMW = Math.max(0, r.stPower_MW);
  const qCondMW = Math.max(0, r.rankine.condenserHeatRejected_MW);
  const qStackMW = Math.max(0, qInMW - wGtMW - wStMW - qCondMW);

  const pctGt = (wGtMW / qInMW) * 100;
  const pctSt = (wStMW / qInMW) * 100;
  const pctCond = (qCondMW / qInMW) * 100;
  const pctStack = Math.max(0, 100 - pctGt - pctSt - pctCond);

  const p = r.parameters;
  const s = r.states;
  const b = r.brayton;
  const h = r.hrsg;
  const rk = r.rankine;

  const gammaAirExp = ((p.k_air - 1) / p.k_air).toFixed(4);
  const gammaGasExp = ((p.k_gas - 1) / p.k_gas).toFixed(4);

  const braytonSteps = [
    {
      idx: '01',
      title: t.calculations.step1CompIso,
      formula: 'T2s = T1 · rp^((k_a - 1) / k_a)',
      sub: `T2s = ${s[1].T_K.toFixed(2)} · (${p.rp.toFixed(1)})^(${gammaAirExp})`,
      res: `T2s = ${b.T2s_K.toFixed(1)} K (${(b.T2s_K - 273.15).toFixed(1)} °C)`,
    },
    {
      idx: '02',
      title: t.calculations.step2CompAct,
      formula: 'T2 = T1 + (T2s - T1) / η_c  ;  wc = cp,a · (T2 - T1)',
      sub: `T2 = ${s[1].T_K.toFixed(2)} + (${b.T2s_K.toFixed(1)} - ${s[1].T_K.toFixed(2)}) / ${p.eta_comp.toFixed(2)}`,
      res: `T2 = ${s[2].T_K.toFixed(1)} K (${s[2].T_C.toFixed(1)} °C) · wc = ${b.w_comp_kJkg.toFixed(1)} kJ/kg · Wc = ${b.compPower_MW.toFixed(1)} MW`,
    },
    {
      idx: '03',
      title: t.calculations.step3Comb,
      formula: 'q_in = cp,g · (T3 - T2)  ;  Q_in = ṁ_a · q_in  ;  ṁ_f = Q_in / (LHV · η_comb)',
      sub: `q_in = ${p.cp_gas_kJkgK.toFixed(3)} · (${s[3].T_K.toFixed(1)} - ${s[2].T_K.toFixed(1)}) = ${b.q_in_kJkg.toFixed(1)} kJ/kg`,
      res: `Q_in = ${b.heatInput_MW.toFixed(1)} MW · ṁ_fuel = ${b.fuelMassFlow_kgs.toFixed(2)} kg/s (${b.fuelAirRatioPct.toFixed(2)} % F/A)`,
    },
    {
      idx: '04',
      title: t.calculations.step4GtIso,
      formula: 'T4s = T3 · (1 / rp)^((k_g - 1) / k_g)',
      sub: `T4s = ${s[3].T_K.toFixed(1)} · (1 / ${p.rp.toFixed(1)})^(${gammaGasExp})`,
      res: `T4s = ${b.T4s_K.toFixed(1)} K (${(b.T4s_K - 273.15).toFixed(1)} °C)`,
    },
    {
      idx: '05',
      title: t.calculations.step5GtAct,
      formula: 'T4 = T3 - η_GT · (T3 - T4s)  ;  W_GT,net = Wt - Wc',
      sub: `T4 = ${s[3].T_K.toFixed(1)} - ${p.eta_gt.toFixed(2)} · (${s[3].T_K.toFixed(1)} - ${b.T4s_K.toFixed(1)}) = ${s[4].T_K.toFixed(1)} K`,
      res: `W_GT,net = ${b.gtNetPower_MW.toFixed(1)} MW · η_GT = ${(b.gtEfficiency * 100).toFixed(1)} %`,
    },
  ];

  const hrsgSteps = [
    {
      idx: '06',
      title: t.calculations.step6Pinch,
      formula: 'T_g,pinch = T_sat(p8) + ΔT_pinch',
      sub: `T_sat(${(p.p_steam_kPa / 1000).toFixed(1)} MPa) = ${h.T_sat_K.toFixed(1)} K (${h.T_sat_C.toFixed(1)} °C)  →  T_g,pinch = ${h.T_sat_K.toFixed(1)} + ${p.pinch_K.toFixed(1)}`,
      res: `T_g,pinch = ${h.T_gas_pinch_K.toFixed(1)} K · ΔT_pinch = ${h.pinchDiff_K.toFixed(1)} K · ΔT_superheater = ${h.superheaterApproach_K.toFixed(1)} K`,
    },
    {
      idx: '07',
      title: t.calculations.step7SteamFlow,
      formula: 'ṁ_s · (h8 - h_f(p8)) = ṁ_g · cp,g · (T4 - T_g,pinch)',
      sub: `ṁ_s · (${s[8].h_kJkg.toFixed(1)} - ${h.hf_boiler_kJkg.toFixed(1)}) = ${s[4].mDot_kgs.toFixed(1)} · ${p.cp_gas_kJkgK.toFixed(3)} · (${s[4].T_K.toFixed(1)} - ${h.T_gas_pinch_K.toFixed(1)})`,
      res: `ṁ_steam = ${h.steamMassFlow_kgs.toFixed(2)} kg/s`,
    },
    {
      idx: '08',
      title: t.calculations.step8Stack,
      formula: 'Q_HRSG = ṁ_s · (h8 - h7) = ṁ_g · cp,g · (T4 - T5)  ;  η_HRSG = (h4 - h5)/(h4 - h1)',
      sub: `Q_HRSG = ${h.steamMassFlow_kgs.toFixed(2)} · (${s[8].h_kJkg.toFixed(1)} - ${s[7].h_kJkg.toFixed(1)}) / 1000 = ${h.qHrsg_MW.toFixed(1)} MW`,
      res: `T5 = ${s[5].T_K.toFixed(1)} K (${s[5].T_C.toFixed(1)} °C) · Q_HRSG = ${h.qHrsg_MW.toFixed(1)} MW · η_HRSG = ${(h.hrsgEfficiency * 100).toFixed(1)} %`,
    },
  ];

  const rankineSteps = [
    {
      idx: '09',
      title: t.calculations.step9Pump,
      formula: 'w_p = (h7s - h6) / η_p  ;  h7 = h6 + w_p  ;  W_p = ṁ_s · w_p',
      sub: `h6 = ${s[6].h_kJkg.toFixed(1)} kJ/kg, h7s = ${rk.h7s_kJkg.toFixed(1)} kJ/kg  →  w_p = (${rk.h7s_kJkg.toFixed(1)} - ${s[6].h_kJkg.toFixed(1)}) / ${p.eta_pump.toFixed(2)}`,
      res: `h7 = ${s[7].h_kJkg.toFixed(1)} kJ/kg · w_p = ${rk.w_pump_kJkg.toFixed(2)} kJ/kg · W_pump = ${rk.pumpPower_MW.toFixed(2)} MW`,
    },
    {
      idx: '10',
      title: t.calculations.step10St,
      formula: 'h9 = h8 - η_ST · (h8 - h9s)  ;  w_ST = h8 - h9',
      sub: `h8 = ${s[8].h_kJkg.toFixed(1)} kJ/kg, h9s = ${rk.h9s_kJkg.toFixed(1)} kJ/kg  →  h9 = ${s[8].h_kJkg.toFixed(1)} - ${p.eta_st.toFixed(2)} · (${s[8].h_kJkg.toFixed(1)} - ${rk.h9s_kJkg.toFixed(1)})`,
      res: `h9 = ${s[9].h_kJkg.toFixed(1)} kJ/kg (x9 = ${s[9].quality !== null ? (s[9].quality * 100).toFixed(1) + ' %' : 'SH'}) · W_ST,gross = ${rk.stGrossPower_MW.toFixed(1)} MW`,
    },
    {
      idx: '11',
      title: t.calculations.step11Cond,
      formula: 'Q_cond = ṁ_s · (h9 - h6)  ;  W_ST,net = W_ST,gross - W_p  ;  η_ST = W_ST,net / Q_HRSG',
      sub: `Q_cond = ${h.steamMassFlow_kgs.toFixed(2)} · (${s[9].h_kJkg.toFixed(1)} - ${s[6].h_kJkg.toFixed(1)}) / 1000  ;  W_ST,net = ${rk.stGrossPower_MW.toFixed(1)} - ${rk.pumpPower_MW.toFixed(2)}`,
      res: `W_ST,net = ${rk.stNetPower_MW.toFixed(1)} MW · Q_cond = ${rk.condenserHeatRejected_MW.toFixed(1)} MW · η_ST = ${(rk.stEfficiency * 100).toFixed(1)} %`,
    },
    {
      idx: '12',
      title: t.calculations.step12Cc,
      formula: 'η_CC = (W_GT,net + W_ST,net) / Q_in = η_GT + (1 - η_GT) · η_HRSG · η_ST',
      sub: `W_net = ${r.gtPower_MW.toFixed(1)} + ${r.stPower_MW.toFixed(1)} = ${r.netPower_MW.toFixed(1)} MW  ;  η_CC = ${r.netPower_MW.toFixed(1)} / ${r.heatInput_MW.toFixed(1)}`,
      res: `W_net = ${r.netPower_MW.toFixed(1)} MW · η_CC = ${(r.combinedEfficiency * 100).toFixed(2)} % (Law 9: ${(r.combinedEfficiencyLaw9 * 100).toFixed(2)} %)`,
    },
  ];

  const renderStepsGroup = (
    heading: string,
    steps: { idx: string; title: string; formula: string; sub: string; res: string }[],
  ) => (
    <div className="calc-section-block">
      <h3 className="sub-heading">{heading}</h3>
      <div className="calc-steps-grid">
        {steps.map((st) => (
          <article key={st.idx} className="calc-step-card">
            <div className="calc-step-header">
              <span className="calc-step-idx">{st.idx}</span>
              <h4 className="calc-step-title">{st.title}</h4>
            </div>
            <code className="law-formula">{st.formula}</code>
            <div className="law-live-box">
              <div>
                <strong>{t.components.liveCalculation}:</strong> {st.sub}
              </div>
              <div>
                <strong>=</strong> {st.res}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  return (
    <section className="panel-card liquid-glass calc-workbench" aria-label={t.calculations.title}>
      <div className="panel-header-row">
        <span className="inspector-badge">{t.calculations.placeholderBadge}</span>
        <span className="panel-status-tag">
          T3 = {vm.sliders.T3_displayK} K · rp = {vm.sliders.rp_display}
        </span>
      </div>
      <h2 className="panel-heading">{t.calculations.title}</h2>
      <p className="inspector-role">{t.calculations.subtitle}</p>

      {/* Sankey Energy Partition Bar */}
      <div className="sankey-card">
        <div className="sankey-header-row">
          <div>
            <h3 className="sankey-title">{t.calculations.sankeyTitle}</h3>
            <p className="sankey-sub">{t.calculations.sankeySubtitle}</p>
          </div>
          <span className="sankey-qin-pill">
            {t.results.heatInput}: <strong>{qInMW.toFixed(1)} MW</strong> (100%)
          </span>
        </div>

        <div className="sankey-bar" role="img" aria-label={t.calculations.sankeyTitle}>
          <div
            className="sankey-seg sankey-seg-gt"
            style={{ width: `${Math.max(4, pctGt)}%` }}
            title={`${t.calculations.shareGtWork}: ${wGtMW.toFixed(1)} MW (${pctGt.toFixed(1)}%)`}
          >
            <span>{pctGt.toFixed(1)}%</span>
          </div>
          <div
            className="sankey-seg sankey-seg-st"
            style={{ width: `${Math.max(4, pctSt)}%` }}
            title={`${t.calculations.shareStWork}: ${wStMW.toFixed(1)} MW (${pctSt.toFixed(1)}%)`}
          >
            <span>{pctSt.toFixed(1)}%</span>
          </div>
          <div
            className="sankey-seg sankey-seg-cond"
            style={{ width: `${Math.max(4, pctCond)}%` }}
            title={`${t.calculations.shareCondLoss}: ${qCondMW.toFixed(1)} MW (${pctCond.toFixed(1)}%)`}
          >
            <span>{pctCond.toFixed(1)}%</span>
          </div>
          <div
            className="sankey-seg sankey-seg-stack"
            style={{ width: `${Math.max(4, pctStack)}%` }}
            title={`${t.calculations.shareStackLoss}: ${qStackMW.toFixed(1)} MW (${pctStack.toFixed(1)}%)`}
          >
            <span>{pctStack.toFixed(1)}%</span>
          </div>
        </div>

        <div className="sankey-legend-grid">
          <div className="sankey-legend-item">
            <span className="sankey-dot sankey-seg-gt" />
            <div>
              <span className="sankey-leg-label">{t.calculations.shareGtWork}</span>
              <strong className="sankey-leg-val">
                {wGtMW.toFixed(1)} MW ({pctGt.toFixed(1)}%)
              </strong>
            </div>
          </div>
          <div className="sankey-legend-item">
            <span className="sankey-dot sankey-seg-st" />
            <div>
              <span className="sankey-leg-label">{t.calculations.shareStWork}</span>
              <strong className="sankey-leg-val">
                {wStMW.toFixed(1)} MW ({pctSt.toFixed(1)}%)
              </strong>
            </div>
          </div>
          <div className="sankey-legend-item">
            <span className="sankey-dot sankey-seg-cond" />
            <div>
              <span className="sankey-leg-label">{t.calculations.shareCondLoss}</span>
              <strong className="sankey-leg-val">
                {qCondMW.toFixed(1)} MW ({pctCond.toFixed(1)}%)
              </strong>
            </div>
          </div>
          <div className="sankey-legend-item">
            <span className="sankey-dot sankey-seg-stack" />
            <div>
              <span className="sankey-leg-label">{t.calculations.shareStackLoss}</span>
              <strong className="sankey-leg-val">
                {qStackMW.toFixed(1)} MW ({pctStack.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Worked Derivations */}
      {renderStepsGroup(t.calculations.secBrayton, braytonSteps)}
      {renderStepsGroup(t.calculations.secHrsg, hrsgSteps)}
      {renderStepsGroup(t.calculations.secRankine, rankineSteps)}

      {/* Control Volume First-Law Closure Table */}
      <div className="calc-section-block">
        <h3 className="sub-heading">{t.calculations.cvTableTitle}</h3>
        <div className="table-scroll">
          <table className="state-table">
            <thead>
              <tr>
                <th>{t.calculations.colComponent}</th>
                <th>{t.calculations.colHeat}</th>
                <th>{t.calculations.colWork}</th>
                <th>{t.calculations.colDeltaH}</th>
                <th>{t.calculations.colResidual}</th>
              </tr>
            </thead>
            <tbody>
              {ORDERED_COMPONENTS.map((compId) => {
                const eb = r.energyBalances[compId];
                return (
                  <tr key={compId}>
                    <td>
                      <strong>{t.components[compId].name}</strong>
                    </td>
                    <td>{eb.Q_MW.toFixed(2)}</td>
                    <td>{eb.W_MW.toFixed(2)}</td>
                    <td>{eb.deltaH_MW.toFixed(2)}</td>
                    <td>{(eb.closureErrorFraction * 100).toExponential(2)} %</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
