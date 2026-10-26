import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import type { PipeColorMode, QualityMode } from '../scene/animationParams';
import type { ViewMode } from '../ui/theme';

interface ViewportSettingsProps {
  qualityMode: QualityMode;
  onChangeQuality: (q: QualityMode) => void;
  showScenery: boolean;
  onToggleScenery: () => void;
  pipeColorMode: PipeColorMode;
  onChangePipeColorMode: (m: PipeColorMode) => void;
  viewMode: ViewMode;
}

export const ViewportSettings: React.FC<ViewportSettingsProps> = ({
  qualityMode,
  onChangeQuality,
  showScenery,
  onToggleScenery,
  pipeColorMode,
  onChangePipeColorMode,
  viewMode,
}) => {
  const { t } = useLanguage();

  return (
    <div className="viewport-settings-popover" role="dialog" aria-label={t.viewport.settings}>
      <div className="settings-row">
        <span className="settings-label">{t.animation.qualityLabel}</span>
        <div className="segmented-pill">
          <button
            type="button"
            className={`seg-btn ${qualityMode === 'high' ? 'seg-btn-active' : ''}`}
            onClick={() => onChangeQuality('high')}
          >
            {t.animation.qualityHigh}
          </button>
          <button
            type="button"
            className={`seg-btn ${qualityMode === 'low' ? 'seg-btn-active' : ''}`}
            onClick={() => onChangeQuality('low')}
          >
            {t.animation.qualityLow}
          </button>
        </div>
      </div>

      <div className="settings-row">
        <span className="settings-label">{t.animation.pipeColorModeLabel}</span>
        <div className="segmented-pill">
          <button
            type="button"
            disabled={viewMode === 'temperature'}
            className={`seg-btn ${
              viewMode !== 'temperature' && pipeColorMode === 'service'
                ? 'seg-btn-active'
                : ''
            }`}
            onClick={() => onChangePipeColorMode('service')}
          >
            {t.animation.serviceColors}
          </button>
          <button
            type="button"
            className={`seg-btn ${
              viewMode === 'temperature' || pipeColorMode === 'temperature'
                ? 'seg-btn-active'
                : ''
            }`}
            onClick={() => onChangePipeColorMode('temperature')}
          >
            {t.animation.temperatureColors}
          </button>
        </div>
      </div>

      <div className="settings-row">
        <button
          type="button"
          className={`scenery-toggle-btn ${showScenery ? 'scenery-toggle-active' : ''}`}
          onClick={onToggleScenery}
        >
          {showScenery ? t.animation.sceneryOn : t.animation.sceneryOff}
        </button>
      </div>
    </div>
  );
};
