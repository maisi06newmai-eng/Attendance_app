import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/sampleData';
import {
  getCalendarDays, getMonthName, filterRecordsByMonth,
  filterRecordsBySubject, formatDate, getPeriodLabel
} from '../utils/attendanceUtils';

const TODAY = new Date();

function CalendarView({ year, month, records, subjects }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const days = getCalendarDays(year, month);

  // Build a map: date string → status
  const dateMap = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = { present: 0, absent: 0, records: [] };
      map[r.date].records.push(r);
      if (r.status === 'present') map[r.date].present++;
      else map[r.date].absent++;
    });
    return map;
  }, [records]);

  const getDateClass = (dayObj) => {
    if (!dayObj.isCurrentMonth) return 'other-month';
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    const isToday = dayObj.day === TODAY.getDate() && dayObj.month === TODAY.getMonth() && dayObj.year === TODAY.getFullYear();
    const isSelected = selectedDate === dateStr;
    const data = dateMap[dateStr];
    if (isSelected) return 'selected';
    if (isToday) return 'today';
    if (!data) return '';
    if (data.absent > 0 && data.present > 0) return 'partial';
    if (data.absent > 0) return 'absent';
    if (data.present > 0) return 'present';
    return '';
  };

  const handleDayClick = (dayObj) => {
    if (!dayObj.isCurrentMonth) return;
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const selectedDateRecords = selectedDate ? (dateMap[selectedDate]?.records || []) : [];

  return (
    <div>
      {/* Day headers */}
      <div className="cal-grid" style={{ marginBottom: '0.25rem' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="cal-grid">
        {days.map((dayObj, i) => {
          const cls = getDateClass(dayObj);
          return (
            <button
              key={i}
              className={`cal-day ${cls}`}
              onClick={() => handleDayClick(dayObj)}
              disabled={!dayObj.isCurrentMonth}
              aria-label={`${dayObj.day} ${getMonthName(dayObj.month)} ${dayObj.year}`}
              style={{ background: cls === 'selected' ? 'var(--color-primary)' : undefined }}
            >
              {dayObj.day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        {[
          { cls: 'present', label: 'Present' },
          { cls: 'absent', label: 'Absent' },
          { cls: 'partial', label: 'Mixed' },
          { cls: 'today', label: 'Today' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div
              className={`cal-day ${item.cls}`}
              style={{ width: 16, height: 16, borderRadius: 4, fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Selected Date Detail */}
      {selectedDate && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            {formatDate(selectedDate)}
          </div>
          {selectedDateRecords.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No attendance records for this date.</p>
          ) : (
            selectedDateRecords.map((r) => {
              const sub = subjects.find((s) => s.id === r.subjectId);
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{sub?.name || r.subjectId}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{getPeriodLabel(r.period)}</div>
                  </div>
                  <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
                    {r.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ListView({ records, subjects }) {
  if (records.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>No records found for selected filters.</p>;
  }
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Period</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const sub = subjects.find((s) => s.id === r.subjectId);
            return (
              <tr key={r.id}>
                <td>{formatDate(r.date)}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{sub?.name || r.subjectId}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{sub?.code}</div>
                </td>
                <td>{getPeriodLabel(r.period)}</td>
                <td>
                  <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-error'}`}>
                    {r.status === 'present' ? 'Present' : 'Absent'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  const { state } = useApp();
  const user = state.user;
  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 1)); // Oct 2024
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const allRecords = useMemo(() =>
    state.attendanceRecords.filter((r) => r.studentId === (user?.id || 'S001')),
    [state.attendanceRecords, user]
  );

  const filtered = useMemo(() => {
    let recs = filterRecordsByMonth(allRecords, year, month);
    recs = filterRecordsBySubject(recs, subjectFilter);
    if (statusFilter !== 'all') recs = recs.filter((r) => r.status === statusFilter);
    return recs;
  }, [allRecords, year, month, subjectFilter, statusFilter]);

  const presentCount = filtered.filter((r) => r.status === 'present').length;
  const absentCount = filtered.filter((r) => r.status === 'absent').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Attendance History</h1>
            <p className="page-subtitle">Monthly record of your attendance across all subjects</p>
          </div>
          <div className="demo-label">Sample Data</div>
        </div>
      </div>

      {/* Month Navigator + Controls */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Month Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 160, textAlign: 'center' }}>
              {getMonthName(month)} {year}
            </div>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Summary badges */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge-success">✓ {presentCount} Present</span>
            <span className="badge badge-error">✗ {absentCount} Absent</span>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              id="view-calendar"
              className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar size={14} /> Calendar
            </button>
            <button
              id="view-list"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} /> List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select id="history-subject-filter" className="form-input form-select" style={{ width: 'auto', minWidth: 180 }} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="all">All Subjects</option>
            {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select id="history-status-filter" className="form-input form-select" style={{ width: 'auto', minWidth: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div style={{ padding: '0 1rem 1rem' }}>
          {viewMode === 'calendar' ? (
            <CalendarView year={year} month={month} records={filtered} subjects={SUBJECTS} />
          ) : (
            <ListView records={filtered} subjects={SUBJECTS} />
          )}
        </div>
      </div>
    </div>
  );
}
