import React, { useMemo, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  buildTsDiagramViewModel,
  type CombinedCycleResult,
  type StatePointId,
} from '../physics';

interface TsDiagramProps {
  result: CombinedCycleResult;
}

export const TsDiagram: React.FC<TsDiagramProps> = ({ result }) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<StatePointId>(3);

  const diagram = useMemo(() => buildTsDiagramViewModel(result), [result]);
  const activePoint =
    diagram.points.find((pt) => pt.id === hoveredId) ?? diagram.points[0];

  return (
    <section className="panel-card" aria-label={t.diagram.title}>
      <div className="diagram-header">
        <h2 className="panel-heading">{t.diagram.title}</h2>
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

      <svg
        viewBox={diagram.viewBox}
        className="ts-svg"
        role="img"
        aria-label={t.diagram.title}
      >
        {/* Grid lines and Y ticks */}
        {diagram.yTicks.map((yt) => (
          <g key={yt.label}>
            <line
              x1={diagram.padLeft}
              y1={yt.y}
              x2={diagram.width - diagram.padRight}
              y2={yt.y}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
            <text
              x={diagram.padLeft - 8}
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
              stroke="#1e293b"
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
          stroke="#475569"
        />
        <line
          x1={diagram.padLeft}
          y1={diagram.height - diagram.padBottom}
          x2={diagram.width - diagram.padRight}
          y2={diagram.height - diagram.padBottom}
          stroke="#475569"
        />

        {/* Axis titles */}
        <text
          x={diagram.width / 2}
          y={diagram.height - 8}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
        >
          {t.diagram.xAxis}
        </text>
        <text
          x={14}
          y={diagram.height / 2}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="12"
          transform={`rotate(-90 14 ${diagram.height / 2})`}
        >
          {t.diagram.yAxis}
        </text>

        {/* Water Saturation Dome */}
        <path
          d={diagram.domePath}
          fill="rgba(56, 189, 248, 0.08)"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeDasharray="5 3"
        />

        {/* Brayton Cycle Curve */}
        <path
          d={diagram.braytonPath}
          fill="rgba(249, 115, 22, 0.1)"
          stroke="#f97316"
          strokeWidth="2.4"
        />

        {/* Rankine Cycle Curve */}
        <path
          d={diagram.rankinePath}
          fill="rgba(56, 189, 248, 0.14)"
          stroke="#38bdf8"
          strokeWidth="2.4"
        />

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
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 7 : 5}
                fill={pt.formatted.colorHex}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2.2 : 1.2}
              />
              <text
                x={pt.x + 8}
                y={pt.y - 6}
                fill="#f8fafc"
                fontSize="11"
                fontWeight="bold"
              >
                {pt.formatted.idStr}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="ts-tooltip-bar">
        <strong>{t.statePoints.labels[activePoint.formatted.idStr]}</strong>
        <span>
          {t.statePoints.tempK}: {activePoint.formatted.T_K} ({activePoint.formatted.T_C}{' '}
          {t.units.C})
        </span>
        <span>
          {t.statePoints.pressure}: {activePoint.formatted.p_kPa}
        </span>
        <span>
          {t.statePoints.enthalpy}: {activePoint.formatted.h_kJkg}
        </span>
        <span>
          {t.statePoints.entropy}: {activePoint.formatted.s_kJkgK}
        </span>
      </div>
    </section>
  );
};
