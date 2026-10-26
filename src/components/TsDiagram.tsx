import React, { useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  buildTsDiagramViewModel,
  type CombinedCycleResult,
  type StatePointId,
} from '../physics';
import { temperatureToHexColor } from '../scene/animationParams';

interface TsDiagramProps {
  result: CombinedCycleResult;
  fullPage?: boolean;
}

const STATE_IDS: StatePointId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const TsDiagram: React.FC<TsDiagramProps> = ({ result, fullPage = false }) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<StatePointId>(3);

  const diagram = useMemo(() => buildTsDiagramViewModel(result), [result]);
  const activePoint =
    diagram.points.find((pt) => pt.id === hoveredId) ?? diagram.points[0];

  return (
    <section
      className={`panel-card ts-diagram-card ${fullPage ? 'ts-diagram-fullpage' : ''}`}
      aria-label={t.diagram.title}
    >
      <div className="diagram-header">
        <div>
          <span className="inspector-badge">{t.nav.diagram}</span>
          <h2 className="panel-heading">{t.diagram.title}</h2>
        </div>

        <div className="diagram-legend">
          <span className="legend-item">
            <span className="legend-swatch swatch-brayton" />
            {t.diagram.braytonLegend}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-rankine" />
            {t.diagram.rankineLegend}
          </span>
          <span className="legend-item">
            <span className="legend-swatch swatch-dome" />
            {t.diagram.satDomeLegend}
          </span>
        </div>
      </div>

      <div className="ts-canvas-frame">
        <svg
          viewBox={diagram.viewBox}
          className={`ts-svg ${fullPage ? 'ts-svg-fullpage' : ''}`}
          role="img"
          aria-label={t.diagram.title}
        >
          <defs>
            <linearGradient id="brayton-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="rankine-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y ticks */}
          {diagram.yTicks.map((yt) => (
            <g key={yt.label}>
              <line
                x1={diagram.padLeft}
                y1={yt.y}
                x2={diagram.width - diagram.padRight}
                y2={yt.y}
                stroke="rgba(148, 163, 184, 0.14)"
                strokeDasharray="4 4"
              />
              <text
                x={diagram.padLeft - 10}
                y={yt.y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {yt.label}
              </text>
            </g>
          ))}

          {/* X ticks */}
          {diagram.xTicks.map((xt) => (
            <g key={xt.label}>
              <line
                x1={xt.x}
                y1={diagram.padTop}
                x2={xt.x}
                y2={diagram.height - diagram.padBottom}
                stroke="rgba(148, 163, 184, 0.14)"
                strokeDasharray="4 4"
              />
              <text
                x={xt.x}
                y={diagram.height - diagram.padBottom + 16}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {xt.label}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={diagram.padLeft}
            y1={diagram.padTop}
            x2={diagram.padLeft}
            y2={diagram.height - diagram.padBottom}
            stroke="#64748b"
            strokeWidth="1.2"
          />
          <line
            x1={diagram.padLeft}
            y1={diagram.height - diagram.padBottom}
            x2={diagram.width - diagram.padRight}
            y2={diagram.height - diagram.padBottom}
            stroke="#64748b"
            strokeWidth="1.2"
          />

          {/* Axis titles */}
          <text
            x={diagram.width / 2}
            y={diagram.height - 6}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="600"
          >
            {t.diagram.xAxis}
          </text>
          <text
            x={14}
            y={diagram.height / 2}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="12"
            fontWeight="600"
            transform={`rotate(-90 14 ${diagram.height / 2})`}
          >
            {t.diagram.yAxis}
          </text>

          {/* Water Saturation Dome */}
          <path
            d={diagram.domePath}
            fill="rgba(56, 189, 248, 0.07)"
            stroke="#64748b"
            strokeWidth="1.6"
            strokeDasharray="5 3"
          />

          {/* Brayton Cycle Curve */}
          <path
            d={diagram.braytonPath}
            fill="url(#brayton-area-grad)"
            stroke="#f97316"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Rankine Cycle Curve */}
          <path
            d={diagram.rankinePath}
            fill="url(#rankine-area-grad)"
            stroke="#2dd4bf"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />

          {/* Active Point Crosshair */}
          <g stroke="rgba(45, 212, 191, 0.35)" strokeWidth="1" strokeDasharray="3 3">
            <line
              x1={activePoint.x}
              y1={diagram.padTop}
              x2={activePoint.x}
              y2={diagram.height - diagram.padBottom}
            />
            <line
              x1={diagram.padLeft}
              y1={activePoint.y}
              x2={diagram.width - diagram.padRight}
              y2={activePoint.y}
            />
          </g>

          {/* State Points 1-9 */}
          {diagram.points.map((pt) => {
            const isHovered = pt.id === hoveredId;
            return (
              <g
                key={pt.id}
                className="ts-point-group"
                onMouseEnter={() => setHoveredId(pt.id)}
                onClick={() => setHoveredId(pt.id)}
              >
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill="rgba(45, 212, 191, 0.22)"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7.5 : 5.5}
                  fill={temperatureToHexColor(result.states[pt.id].T_K)}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.4 : 1.4}
                />
                <text
                  x={pt.x + 9}
                  y={pt.y - 7}
                  fill="#f8fafc"
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {pt.formatted.idStr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive State Point Selector Strip (1-9) */}
      <div className="ts-state-chips-bar" role="tablist" aria-label={t.statePoints.title}>
        {STATE_IDS.map((id) => {
          const pt = diagram.points.find((p) => p.id === id);
          if (!pt) return null;
          const active = hoveredId === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`equip-chip ${active ? 'equip-chip-active' : ''}`}
              onClick={() => setHoveredId(id)}
            >
              <span
                className="state-dot"
                style={{ backgroundColor: temperatureToHexColor(result.states[id].T_K) }}
              />
              {pt.formatted.idStr} · {t.statePoints.labels[pt.formatted.idStr]}
            </button>
          );
        })}
      </div>

      <div className="ts-tooltip-bar">
        <strong>{t.statePoints.labels[activePoint.formatted.idStr]}</strong>
        <span>
          {t.statePoints.tempK}: <b>{activePoint.formatted.T_K} K</b> (
          {activePoint.formatted.T_C} {t.units.C})
        </span>
        <span>
          {t.statePoints.pressure}: <b>{activePoint.formatted.p_kPa} kPa</b>
        </span>
        <span>
          {t.statePoints.enthalpy}: <b>{activePoint.formatted.h_kJkg} kJ/kg</b>
        </span>
        <span>
          {t.statePoints.entropy}: <b>{activePoint.formatted.s_kJkgK} kJ/(kg·K)</b>
        </span>
        <span>
          {t.statePoints.massFlow}: <b>{activePoint.formatted.mDot_kgs} kg/s</b>
        </span>
      </div>
      <p className="ts-datum-note">{t.diagram.entropyDatumNote}</p>
    </section>
  );
};
