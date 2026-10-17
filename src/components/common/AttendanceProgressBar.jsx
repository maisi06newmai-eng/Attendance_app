import React from 'react';
import { formatPercent } from '../../utils/attendanceUtils';

/**
 * AttendanceProgressBar
 * Displays a labelled progress bar with percentage and status colour.
 */
export default function AttendanceProgressBar({
  percent,
  minRequired = 75,
  showLabel = true,
  showTarget = false,
  height = 8,
  style = {},
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent || 0));

  let colorClass = 'success';
  if (clampedPercent < minRequired) colorClass = 'error';
  else if (clampedPercent < minRequired + 5) colorClass = 'warning';

  return (
    <div style={style}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Attendance</span>
          <span style={{ fontWeight: 700, color: colorClass === 'error' ? 'var(--color-error)' : colorClass === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {formatPercent(percent)}
          </span>
        </div>
      )}
      <div className="progress-bar-wrap" style={{ height }}>
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${clampedPercent}%` }}
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Attendance: ${formatPercent(percent)}`}
        />
      </div>
      {showTarget && (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Target: {minRequired}%
        </div>
      )}
    </div>
  );
}
