import React, { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/sampleData';
import {
  getSubjectAttendanceSummary, calcClassesNeededToReachTarget,
  calcMaxCanMiss, simulateAttendance, formatPercent, getAttendanceStatus
} from '../utils/attendanceUtils';
import AttendanceProgressBar from '../components/common/AttendanceProgressBar';
import { useNavigate } from 'react-router-dom';

// ─── SVG Ring ─────────────────────────────────────────────────
function PercentRing({ percent, minRequired = 75, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(100, percent) / 100 * circ;
  const color = percent < minRequired ? 'var(--color-error)' : percent < minRequired + 5 ? 'var(--color-warning)' : 'var(--color-success)';
  const targetFilled = minRequired / 100 * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-secondary)" strokeWidth={8} />
      {/* Target marker */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(184,121,22,0.4)" strokeWidth={2}
        strokeDasharray={`2 ${circ - 2}`} strokeDashoffset={circ - targetFilled} />
      {/* Progress ring */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

// ─── Subject Insight Card ─────────────────────────────────────
function SubjectInsightCard({ subject }) {
  const [attendMore, setAttendMore] = useState(0);
  const [missFuture, setMissFuture] = useState(0);

  const { classesNeeded, message, currentPercent } = calcClassesNeededToReachTarget(
    subject.attended, subject.totalConducted, subject.minAttendancePercent
  );

  const { maxCanMiss } = calcMaxCanMiss(
    subject.attended, subject.totalConducted, 20, subject.minAttendancePercent
  );

  const simulation = useMemo(() =>
    simulateAttendance(subject.attended, subject.totalConducted, attendMore, missFuture),
    [subject.attended, subject.totalConducted, attendMore, missFuture]
  );
  const simStatus = getAttendanceStatus(simulation.newPercent, subject.minAttendancePercent);

  const isGood = subject.status.variant === 'success';
  const isBad = subject.status.variant === 'error';

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-body">
        {/* Top Row: Ring + Info */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <PercentRing percent={subject.percent} minRequired={subject.minAttendancePercent} size={80} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, lineHeight: 1, color: subject.status.variant === 'error' ? 'var(--color-error)' : subject.status.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {formatPercent(subject.percent)}
              </div>
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>{subject.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{subject.code}</div>
            <span className={`badge ${subject.status.className}`}>{subject.status.label}</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.6rem', fontSize: '0.75rem' }}>
              <div style={{ textAlign: 'center', padding: '0.35rem', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-success-text)' }}>
                <div style={{ fontWeight: 700 }}>{subject.attended}</div>
                <div>Present</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.35rem', background: 'var(--color-error-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error-text)' }}>
                <div style={{ fontWeight: 700 }}>{subject.missed}</div>
                <div>Absent</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.35rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}>
                <div style={{ fontWeight: 700 }}>{subject.totalConducted}</div>
                <div>Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Messages */}
        {isBad && (
          <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
            <AlertTriangle size={14} className="alert-icon" />
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Below {subject.minAttendancePercent}% requirement.</strong> {message}
            </div>
          </div>
        )}
        {!isBad && !isGood && (
          <div className="alert alert-warning" style={{ marginBottom: '0.75rem' }}>
            <AlertTriangle size={14} className="alert-icon" />
            <div style={{ fontSize: '0.8rem' }}>
              <strong>At Risk:</strong> You are close to the threshold. You can miss at most {maxCanMiss} more class{maxCanMiss !== 1 ? 'es' : ''} (assuming 20 remaining).
            </div>
          </div>
        )}
        {isGood && (
          <div className="alert alert-success" style={{ marginBottom: '0.75rem' }}>
            <CheckCircle size={14} className="alert-icon" />
            <div style={{ fontSize: '0.8rem' }}>
              Good standing! You can miss up to {maxCanMiss} more class{maxCanMiss !== 1 ? 'es' : ''} (out of estimated 20 remaining) and still meet the requirement.
            </div>
          </div>
        )}

        {/* "What If" Simulator */}
        <div style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <TrendingUp size={13} /> What-If Simulator
            <span className="demo-label" style={{ fontSize: '0.62rem', marginLeft: 'auto' }}>Hypothetical</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Attend next N classes:
              </label>
              <input
                type="number"
                className="form-input"
                style={{ height: 34, fontSize: '0.8rem' }}
                value={attendMore}
                onChange={(e) => setAttendMore(Math.max(0, parseInt(e.target.value) || 0))}
                min={0} max={30}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                Miss next N classes:
              </label>
              <input
                type="number"
                className="form-input"
                style={{ height: 34, fontSize: '0.8rem' }}
                value={missFuture}
                onChange={(e) => setMissFuture(Math.max(0, parseInt(e.target.value) || 0))}
                min={0} max={30}
              />
            </div>
          </div>
          {(attendMore > 0 || missFuture > 0) && (
            <div style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Projected attendance:
              <strong style={{ color: simStatus.variant === 'error' ? 'var(--color-error)' : simStatus.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                {formatPercent(simulation.newPercent)}
              </strong>
              <span className={`badge ${simStatus.className}`} style={{ fontSize: '0.62rem' }}>{simStatus.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                ({simulation.newAttended}/{simulation.newTotal})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function InsightsPage() {
  const { state } = useApp();
  const user = state.user;
  const navigate = useNavigate();

  const summaries = useMemo(() =>
    getSubjectAttendanceSummary(SUBJECTS, state.attendanceRecords, user?.id || 'S001'),
    [state.attendanceRecords, user]
  );

  const atRisk = summaries.filter((s) => s.status.variant !== 'success');
  const sortedByRisk = [...summaries].sort((a, b) => a.percent - b.percent);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Attendance Insights</h1>
            <p className="page-subtitle">Analysis, risk prediction, and what-if simulation for each subject</p>
          </div>
          <div className="demo-label">Hypothetical Projections</div>
        </div>
      </div>

      {/* Summary Alert */}
      {atRisk.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={16} className="alert-icon" />
          <div>
            <div className="alert-title">{atRisk.filter(s => s.status.variant === 'error').length} subject(s) below requirement</div>
            <div style={{ fontSize: '0.8rem' }}>
              {atRisk.map(s => s.name).join(', ')} need immediate attention.
              Visit the <button onClick={() => navigate('/location')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline', fontSize: 'inherit' }}>Location Verification</button> page to check for possible discrepancies.
            </div>
          </div>
        </div>
      )}

      <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
        <Info size={14} className="alert-icon" />
        <div style={{ fontSize: '0.8rem' }}>
          The What-If Simulator shows hypothetical projections based on demo data. These are not official predictions.
          All calculations assume a configurable minimum attendance requirement of 75%.
          Future class count (20) is an estimate.
        </div>
      </div>

      {/* Subject Cards */}
      {sortedByRisk.map((subject) => (
        <SubjectInsightCard key={subject.id} subject={subject} />
      ))}
    </div>
  );
}
