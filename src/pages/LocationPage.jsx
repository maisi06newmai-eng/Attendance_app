import React, { useState, useCallback } from 'react';
import { MapPin, Navigation, AlertTriangle, CheckCircle, XCircle, RefreshCw, Info, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS, CAMPUS_CONFIG } from '../data/sampleData';
import {
  haversineDistance, getGeofenceStatus, detectAttendanceMismatch,
  formatDate, formatPercent
} from '../utils/attendanceUtils';
import { useNavigate } from 'react-router-dom';

// ─── Demo Simulation Options ──────────────────────────────────
const DEMO_LOCATIONS = {
  within: {
    label: '📍 Simulate: Inside Campus',
    lat: CAMPUS_CONFIG.latitude + 0.001,
    lng: CAMPUS_CONFIG.longitude + 0.001,
    accuracy: 15,
  },
  outside: {
    label: '🏠 Simulate: Outside Campus',
    lat: CAMPUS_CONFIG.latitude + 0.02,
    lng: CAMPUS_CONFIG.longitude + 0.02,
    accuracy: 20,
  },
};

const STATUS_CONFIG = {
  idle: { label: 'Not Verified', icon: MapPin, iconClass: 'unknown', color: 'var(--color-text-muted)' },
  loading: { label: 'Verifying Location...', icon: Navigation, iconClass: 'pending', color: 'var(--color-warning)' },
  within: { label: 'Within Campus Area', icon: CheckCircle, iconClass: 'within', color: 'var(--color-success)' },
  outside: { label: 'Outside Campus Area', icon: XCircle, iconClass: 'outside', color: 'var(--color-error)' },
  uncertain: { label: 'Accuracy Too Low', icon: AlertTriangle, iconClass: 'pending', color: 'var(--color-warning)' },
  denied: { label: 'Location Permission Denied', icon: XCircle, iconClass: 'outside', color: 'var(--color-error)' },
  unavailable: { label: 'Location Unavailable', icon: AlertTriangle, iconClass: 'pending', color: 'var(--color-warning)' },
  mismatch: { label: 'Possible Attendance Mismatch!', icon: AlertTriangle, iconClass: 'outside', color: 'var(--color-warning)' },
};

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: valueColor || 'var(--color-text)' }}>{value}</span>
    </div>
  );
}

export default function LocationPage() {
  const { state, dispatch, showToast } = useApp();
  const navigate = useNavigate();
  const user = state.user;

  const [verifyState, setVerifyState] = useState('idle');
  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [distance, setDistance] = useState(null);
  const [geofence, setGeofence] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSimulated, setIsSimulated] = useState(false);

  // For mismatch check
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [mismatchResult, setMismatchResult] = useState(null);

  const processLocation = useCallback((lat, lng, acc, simulated = false) => {
    const dist = haversineDistance(lat, lng, CAMPUS_CONFIG.latitude, CAMPUS_CONFIG.longitude);
    const fence = getGeofenceStatus(dist, CAMPUS_CONFIG.radiusMeters, acc);

    setCoords({ lat, lng });
    setAccuracy(acc);
    setDistance(Math.round(dist));
    setGeofence(fence);
    setVerifiedAt(new Date().toISOString());
    setIsSimulated(simulated);
    setVerifyState(fence);
    setHistory((prev) => [
      { lat, lng, accuracy: acc, distance: Math.round(dist), geofence: fence, verifiedAt: new Date().toISOString(), simulated },
      ...prev.slice(0, 4),
    ]);

    if (fence === 'within') {
      showToast('You appear to be within the campus area.', 'success', 'Location Verified');
    } else if (fence === 'outside') {
      showToast('You appear to be outside the campus area.', 'warning', 'Outside Campus');
    }
  }, [showToast]);

  const verifyRealLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setVerifyState('unavailable');
      return;
    }
    setVerifyState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        processLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, false);
      },
      (err) => {
        if (err.code === 1) setVerifyState('denied');
        else setVerifyState('unavailable');
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  }, [processLocation]);

  const simulateLocation = useCallback((type) => {
    setVerifyState('loading');
    setTimeout(() => {
      const loc = DEMO_LOCATIONS[type];
      processLocation(loc.lat, loc.lng, loc.accuracy, true);
    }, 1000);
  }, [processLocation]);

  const reset = () => {
    setVerifyState('idle');
    setCoords(null);
    setAccuracy(null);
    setDistance(null);
    setGeofence(null);
    setVerifiedAt(null);
    setMismatchResult(null);
  };

  const checkMismatch = () => {
    if (!selectedSubject || !selectedDate || !geofence) {
      showToast('Please verify location first and select a subject and date.', 'warning');
      return;
    }
    const record = state.attendanceRecords.find(
      (r) => r.subjectId === selectedSubject && r.studentId === user?.id && r.date === selectedDate
    );
    if (!record) {
      setMismatchResult({ found: false });
      return;
    }
    const isMismatch = detectAttendanceMismatch(record.status, geofence);
    setMismatchResult({ found: true, record, isMismatch, geofence });
    if (isMismatch) {
      showToast('Possible attendance mismatch detected! You may submit a correction request.', 'warning', 'Mismatch Detected');
    }
  };

  const statusCfg = STATUS_CONFIG[verifyState] || STATUS_CONFIG.idle;
  const StatusIcon = statusCfg.icon;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Location Verification</h1>
            <p className="page-subtitle">Verify your campus presence to support attendance correction requests</p>
          </div>
          <div className="demo-label">GPS Demo</div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
        <Info size={16} className="alert-icon" />
        <div>
          <div className="alert-title">Privacy Notice</div>
          <div style={{ fontSize: '0.8rem' }}>
            Location is only checked when you tap "Verify". No background tracking occurs.
            Campus presence alone does not prove class attendance — it is supporting evidence only.
            Campus coordinates shown are fictional demo values.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* Verification Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
              Campus Location Check
            </div>
          </div>
          <div className="card-body">
            {/* Status Display */}
            <div className="location-status-card">
              <div className={`location-icon-wrap ${verifyState === 'loading' ? 'pending' : geofence === 'within' ? 'within' : geofence === 'outside' ? 'outside' : 'unknown'}`}>
                {verifyState === 'loading'
                  ? <div className="loading-spinner" style={{ width: 36, height: 36 }} />
                  : <StatusIcon size={36} />
                }
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: statusCfg.color, marginBottom: '0.4rem' }}>
                {statusCfg.label}
              </h2>
              {isSimulated && verifyState !== 'idle' && verifyState !== 'loading' && (
                <span className="demo-label" style={{ margin: '0.25rem auto 0.5rem', display: 'inline-flex' }}>Simulated Result</span>
              )}
              {coords && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                </div>
              )}
            </div>

            {/* Info Rows */}
            {coords && (
              <div style={{ marginTop: '0.75rem' }}>
                <InfoRow label="Distance from Campus Centre" value={`${distance} m`} valueColor={distance <= CAMPUS_CONFIG.radiusMeters ? 'var(--color-success)' : 'var(--color-error)'} />
                <InfoRow label="Permitted Radius" value={`${CAMPUS_CONFIG.radiusMeters} m (demo)`} />
                <InfoRow label="GPS Accuracy" value={`±${accuracy} m`} valueColor={accuracy <= 50 ? 'var(--color-success)' : 'var(--color-warning)'} />
                <InfoRow label="Status" value={geofence === 'within' ? 'Inside Campus' : geofence === 'outside' ? 'Outside Campus' : 'Uncertain'} valueColor={statusCfg.color} />
                {verifiedAt && <InfoRow label="Verified At" value={new Date(verifiedAt).toLocaleTimeString()} />}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                id="verify-location-btn"
                className="btn btn-primary"
                onClick={verifyRealLocation}
                disabled={verifyState === 'loading'}
              >
                <Navigation size={16} />
                {verifyState === 'loading' ? 'Verifying...' : 'Verify My Location (Real GPS)'}
              </button>
              <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>— or simulate for demo —</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button id="sim-inside" className="btn btn-success btn-sm" onClick={() => simulateLocation('within')} disabled={verifyState === 'loading'}>
                  📍 Inside Campus
                </button>
                <button id="sim-outside" className="btn btn-secondary btn-sm" onClick={() => simulateLocation('outside')} disabled={verifyState === 'loading'}>
                  🏠 Outside Campus
                </button>
              </div>
              {coords && (
                <button className="btn btn-ghost btn-sm" onClick={reset}>
                  <RefreshCw size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mismatch Checker */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
              Attendance Mismatch Check
            </div>
            <div className="demo-label">Demo</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              After verifying your location, select a subject and date to check if there is a discrepancy between your location and your recorded attendance.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="mismatch-subject">Subject</label>
              <select
                id="mismatch-subject"
                className="form-input form-select"
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setMismatchResult(null); }}
              >
                <option value="">Select subject...</option>
                {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mismatch-date">Date</label>
              <input
                id="mismatch-date"
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setMismatchResult(null); }}
                max="2024-10-17"
                min="2024-08-01"
              />
            </div>

            <button
              id="check-mismatch-btn"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={checkMismatch}
              disabled={!geofence || !selectedSubject || !selectedDate}
            >
              <AlertTriangle size={15} />
              Check for Mismatch
            </button>

            {!geofence && (
              <div className="alert alert-warning" style={{ marginTop: '0.875rem' }}>
                <Info size={14} className="alert-icon" />
                <span style={{ fontSize: '0.8rem' }}>Please verify your location first.</span>
              </div>
            )}

            {/* Mismatch Result */}
            {mismatchResult && (
              <div style={{ marginTop: '1rem' }}>
                {!mismatchResult.found ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={15} className="alert-icon" />
                    <span style={{ fontSize: '0.8rem' }}>No attendance record found for this subject and date.</span>
                  </div>
                ) : mismatchResult.isMismatch ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={16} className="alert-icon" />
                    <div>
                      <div className="alert-title">⚠ Possible Mismatch Detected</div>
                      <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                        Record shows <strong>Absent</strong>, but your location check shows <strong>Inside Campus</strong>.
                        Note: Campus presence does not prove classroom attendance — the teacher may have had valid reasons.
                        You may submit a correction request if you believe this is an error.
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => navigate('/corrections')}
                      >
                        Submit Correction Request
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <CheckCircle size={15} className="alert-icon" />
                    <div>
                      <div className="alert-title">No Mismatch Found</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        Record shows <strong>{mismatchResult.record.status === 'present' ? 'Present' : 'Absent'}</strong>.
                        {mismatchResult.record.status === 'absent' && ' You were marked absent, and you appear to be outside campus — consistent.'}
                        {mismatchResult.record.status === 'present' && ' Your attendance is already marked as present.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification History */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-header">
            <div className="card-title"><Clock size={15} /> Verification History (This Session)</div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Distance</th>
                    <th>Accuracy</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.verifiedAt).toLocaleTimeString()}</td>
                      <td>
                        <span className={`badge ${h.geofence === 'within' ? 'badge-success' : h.geofence === 'outside' ? 'badge-error' : 'badge-warning'}`}>
                          {h.geofence === 'within' ? 'Inside Campus' : h.geofence === 'outside' ? 'Outside Campus' : 'Uncertain'}
                        </span>
                      </td>
                      <td>{h.distance} m</td>
                      <td>±{h.accuracy} m</td>
                      <td>{h.simulated ? <span className="demo-label">Simulated</span> : 'Real GPS'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Campus Config Info */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><MapPin size={15} /> Campus Configuration (Demo)</div>
        </div>
        <div className="card-body">
          <div className="alert alert-warning" style={{ marginBottom: '0.875rem' }}>
            <Info size={14} className="alert-icon" />
            <span style={{ fontSize: '0.8rem' }}>{CAMPUS_CONFIG.note}</span>
          </div>
          <div>
            <InfoRow label="Campus Name" value={CAMPUS_CONFIG.name} />
            <InfoRow label="Demo Latitude" value={CAMPUS_CONFIG.latitude} />
            <InfoRow label="Demo Longitude" value={CAMPUS_CONFIG.longitude} />
            <InfoRow label="Permitted Radius" value={`${CAMPUS_CONFIG.radiusMeters} metres`} />
          </div>
        </div>
      </div>
    </div>
  );
}
