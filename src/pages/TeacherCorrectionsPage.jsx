import React, { useState, useMemo } from 'react';
import { FileEdit, Plus, X, Calendar, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/sampleData';
import {
  getCorrectionStatusConfig, formatDate, formatRelativeTime, getPeriodLabel
} from '../utils/attendanceUtils';
import { EmptyState } from '../components/common/States';

// ─── New Correction Request Form ──────────────────────────────
function NewRequestForm({ onClose, onSubmit, attendanceRecords, userId }) {
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('');
  const [reason, setReason] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [errors, setErrors] = useState({});

  const relatedRecord = useMemo(() => {
    if (!subjectId || !date) return null;
    return attendanceRecords.find(
      (r) => r.subjectId === subjectId && r.studentId === userId && r.date === date
    );
  }, [subjectId, date, attendanceRecords, userId]);

  const validate = () => {
    const errs = {};
    if (!subjectId) errs.subjectId = 'Please select a subject.';
    if (!date) errs.date = 'Please select a date.';
    if (!period) errs.period = 'Please select a period.';
    if (!reason.trim() || reason.trim().length < 20) errs.reason = 'Please provide a detailed explanation (at least 20 characters).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const subject = SUBJECTS.find((s) => s.id === subjectId);
    onSubmit({
      subjectId,
      subjectName: subject?.name || subjectId,
      date,
      period: parseInt(period),
      recordedStatus: relatedRecord?.status || 'absent',
      requestedStatus: 'present',
      reason: reason.trim(),
      locationVerified: useLocation,
      locationStatus: useLocation ? 'within_campus' : null,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="cr-subject">Subject *</label>
        <select id="cr-subject" className="form-input form-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select a subject...</option>
          {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
        </select>
        {errors.subjectId && <div className="form-error">{errors.subjectId}</div>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cr-date">Date of Class *</label>
        <input id="cr-date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} min="2024-08-01" max="2024-10-17" />
        {errors.date && <div className="form-error">{errors.date}</div>}
        {relatedRecord && (
          <div className="form-hint">
            Recorded status for this date: <strong style={{ color: relatedRecord.status === 'absent' ? 'var(--color-error)' : 'var(--color-success)' }}>
              {relatedRecord.status === 'absent' ? 'Absent' : 'Present'}
            </strong>
          </div>
        )}
        {date && !relatedRecord && (
          <div className="form-hint" style={{ color: 'var(--color-warning)' }}>No attendance record found for this subject and date in the demo data.</div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cr-period">Class Period *</label>
        <select id="cr-period" className="form-input form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="">Select period...</option>
          {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{getPeriodLabel(p)}</option>)}
        </select>
        {errors.period && <div className="form-error">{errors.period}</div>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="cr-reason">Explanation *</label>
        <textarea
          id="cr-reason"
          className="form-input form-textarea"
          placeholder="Explain why you believe you were present. Include any supporting details (notes taken, assignments submitted, classmates who can confirm, etc.)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        <div className="form-hint">{reason.length}/500 · Minimum 20 characters</div>
        {errors.reason && <div className="form-error">{errors.reason}</div>}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" id="cr-location" checked={useLocation} onChange={(e) => setUseLocation(e.target.checked)} />
          Include location verification result (simulates campus presence check)
        </label>
        <div className="form-hint">For demo: this marks the request as location-verified. In real use, this uses the actual GPS result from the Location Verification page.</div>
      </div>

      <div className="form-group">
        <label className="form-label">Supporting Evidence (Demo Only)</label>
        <div style={{ border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Paperclip size={18} style={{ marginBottom: '0.25rem', display: 'block', margin: '0 auto 0.25rem' }} />
          File upload is available in the demo interface.<br />
          <span style={{ fontSize: '0.72rem' }}>In real deployment, files would be securely uploaded to a server. No actual upload occurs here.</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" id="cr-submit" className="btn btn-primary">Submit Request</button>
      </div>
    </form>
  );
}

// ─── Correction Card ──────────────────────────────────────────
function CorrectionCard({ req, onExpand, isExpanded }) {
  const cfg = getCorrectionStatusConfig(req.status);
  return (
    <div className="correction-card">
      <div className="correction-card-header" onClick={() => onExpand(req.id)} style={{ cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span className={`badge ${cfg.className}`}>{cfg.label}</span>
            {req.locationVerified && <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>📍 Location Verified</span>}
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {req.subjectName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
            {formatDate(req.date)} · {getPeriodLabel(req.period)} · Submitted {formatRelativeTime(req.submittedAt)}
          </div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onExpand(req.id); }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="correction-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>RECORDED STATUS</div>
              <span className={`badge ${req.recordedStatus === 'absent' ? 'badge-error' : 'badge-success'}`}>
                {req.recordedStatus === 'absent' ? 'Absent' : 'Present'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>REQUESTED CORRECTION</div>
              <span className="badge badge-success">Present</span>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', lineHeight: 1.6 }}>
            <strong>Your explanation:</strong> {req.reason}
          </div>

          {req.teacherComment && (
            <div style={{ fontSize: '0.8rem', background: req.status === 'approved' ? 'var(--color-success-bg)' : 'var(--color-error-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', lineHeight: 1.6 }}>
              <strong>Teacher's comment ({req.reviewedBy}):</strong> {req.teacherComment}
            </div>
          )}

          {req.reviewedAt && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Reviewed on {formatDate(req.reviewedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function TeacherCorrectionsPage() {
  const { state, dispatch, showToast } = useApp();
  const user = state.user;
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const myRequests = useMemo(() =>
    state.correctionRequests
      .filter((r) => r.studentId === user?.id)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    [state.correctionRequests, user]
  );

  const filtered = statusFilter === 'all' ? myRequests : myRequests.filter((r) => r.status === statusFilter);

  const handleSubmit = (data) => {
    const req = {
      id: `CR${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      ...data,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      teacherComment: null,
      reviewedAt: null,
      reviewedBy: null,
    };
    dispatch({ type: 'SUBMIT_CORRECTION', payload: req });
    showToast('Correction request submitted successfully!', 'success', 'Request Submitted');
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  // Count by status
  const counts = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
  myRequests.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Correction Requests</h1>
            <p className="page-subtitle">Report attendance discrepancies and track their review status</p>
          </div>
          <button
            id="new-correction-btn"
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={16} />
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        </div>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <div className="card-title"><FileEdit size={16} style={{ color: 'var(--color-primary)' }} /> Submit Correction Request</div>
            <div className="demo-label">Demo Workflow</div>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <Calendar size={14} className="alert-icon" />
              <span style={{ fontSize: '0.8rem' }}>
                Correction requests are for cases where you believe you were present but were marked absent.
                Submitting false requests may have disciplinary consequences. This is a demo — no real records are modified.
              </span>
            </div>
            <NewRequestForm
              onClose={() => setShowForm(false)}
              onSubmit={handleSubmit}
              attendanceRecords={state.attendanceRecords}
              userId={user?.id}
            />
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-4" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
        {[
          { key: 'all', label: 'All', count: myRequests.length, cls: 'badge-muted' },
          { key: 'pending', label: 'Pending', count: counts.pending, cls: 'badge-warning' },
          { key: 'under_review', label: 'Under Review', count: counts.under_review, cls: 'badge-info' },
          { key: 'approved', label: 'Approved', count: counts.approved, cls: 'badge-success' },
        ].map((item) => (
          <button
            key={item.key}
            className={`card ${statusFilter === item.key ? 'border-primary' : ''}`}
            style={{ cursor: 'pointer', padding: '0.75rem', textAlign: 'center', border: statusFilter === item.key ? '2px solid var(--color-primary)' : undefined, background: 'var(--color-surface)' }}
            onClick={() => setStatusFilter(item.key)}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.count}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{item.label}</div>
          </button>
        ))}
      </div>

      {/* Request List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileEdit}
          title="No requests found"
          description={statusFilter === 'all' ? "You haven't submitted any correction requests yet." : `No ${statusFilter.replace('_', ' ')} requests found.`}
          action={<button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Submit First Request</button>}
        />
      ) : (
        filtered.map((req) => (
          <CorrectionCard key={req.id} req={req} onExpand={toggleExpand} isExpanded={expandedId === req.id} />
        ))
      )}
    </div>
  );
}
