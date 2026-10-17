import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, ChevronDown, ChevronUp, BookOpen, User, Calendar, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/sampleData';
import {
  getSubjectAttendanceSummary, filterSubjectsByStatus,
  sortSubjects, searchSubjects, formatDate, formatPercent, getPeriodLabel
} from '../utils/attendanceUtils';
import AttendanceProgressBar from '../components/common/AttendanceProgressBar';
import { EmptyState } from '../components/common/States';

function SubjectDetailPanel({ subject, onClose }) {
  const recentRecords = subject.records.slice(0, 20);
  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="card-header">
        <div className="card-title">
          <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
          {subject.name} — Attendance Detail
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close detail panel">
          <X size={16} />
        </button>
      </div>
      <div className="card-body">
        <div className="grid grid-3" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Attended', value: subject.attended, color: 'var(--color-success)' },
            { label: 'Absent', value: subject.missed, color: 'var(--color-error)' },
            { label: 'Total', value: subject.totalConducted, color: 'var(--color-text)' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No records found.</td></tr>
              ) : (
                recentRecords.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.date)}</td>
                    <td>{getPeriodLabel(r.period)}</td>
                    <td>
                      <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-error'}`}>
                        {r.status === 'present' ? 'Present' : 'Absent'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({ subject, isSelected, onSelect }) {
  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--color-primary)' : undefined,
        transition: 'all 0.15s ease',
      }}
      onClick={() => onSelect(subject)}
    >
      <div style={{ padding: '1rem' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.2rem' }}>{subject.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{subject.code}</span>
              <span>·</span>
              <User size={11} />
              <span>{subject.teacherName}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '1.5rem', fontWeight: 700,
              color: subject.status.variant === 'error' ? 'var(--color-error)' : subject.status.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)'
            }}>
              {formatPercent(subject.percent)}
            </div>
            <span className={`badge ${subject.status.className}`} style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
              {subject.status.label}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <AttendanceProgressBar
          percent={subject.percent}
          minRequired={subject.minAttendancePercent}
          showLabel={false}
          showTarget
        />

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>✓ {subject.attended} present</span>
          <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>✗ {subject.missed} absent</span>
          <span>of {subject.totalConducted} classes</span>
        </div>

        {/* Expand indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
          {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { state } = useApp();
  const user = state.user;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedSubject, setSelectedSubject] = useState(null);

  const allSummaries = useMemo(() =>
    getSubjectAttendanceSummary(SUBJECTS, state.attendanceRecords, user?.id || 'S001'),
    [state.attendanceRecords, user]
  );

  const displayed = useMemo(() => {
    let result = allSummaries;
    result = searchSubjects(result, search);
    result = filterSubjectsByStatus(result, statusFilter);
    result = sortSubjects(result, sortBy);
    return result;
  }, [allSummaries, search, statusFilter, sortBy]);

  const handleSelectSubject = (subject) => {
    setSelectedSubject((prev) => (prev?.id === subject.id ? null : subject));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Subject-wise attendance records for {user?.course} Semester {user?.semester}</p>
          </div>
          <div className="demo-label">Sample Data</div>
        </div>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div className="input-group" style={{ flex: '1 1 200px', minWidth: 0 }}>
          <Search size={15} className="input-icon-left" />
          <input
            id="subject-search"
            className="form-input has-icon-left"
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          id="status-filter"
          className="form-input form-select"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="success">Good</option>
          <option value="warning">At Risk</option>
          <option value="error">Below Req.</option>
        </select>

        {/* Sort */}
        <select
          id="sort-by"
          className="form-input form-select"
          style={{ width: 'auto', minWidth: 160 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="percent_asc">% Low–High</option>
          <option value="percent_desc">% High–Low</option>
        </select>
      </div>

      {/* Subject Cards */}
      {displayed.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          description="No subjects match your search or filter criteria."
          action={<button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear Filters</button>}
        />
      ) : (
        <div className="grid grid-2" style={{ alignItems: 'start' }}>
          {displayed.map((subject) => (
            <div key={subject.id}>
              <SubjectCard
                subject={subject}
                isSelected={selectedSubject?.id === subject.id}
                onSelect={handleSelectSubject}
              />
              {selectedSubject?.id === subject.id && (
                <SubjectDetailPanel subject={selectedSubject} onClose={() => setSelectedSubject(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
