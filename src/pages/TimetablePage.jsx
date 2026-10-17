import React, { useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { TIMETABLE } from '../data/sampleData';
import { getDayName, formatTime } from '../utils/attendanceUtils';
import { EmptyState } from '../components/common/States';

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon-Fri
const NOW = new Date();
const TODAY_DAY = NOW.getDay();

function PeriodRow({ cls }) {
  const isBreak = cls.type === 'break';
  if (isBreak) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        <div style={{ minWidth: 80 }}>{formatTime(cls.startTime)}</div>
        <div style={{ fontStyle: 'italic' }}>{cls.subjectName}</div>
      </div>
    );
  }

  const [startH, startM] = cls.startTime.split(':').map(Number);
  const [endH, endM] = cls.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const nowMins = NOW.getHours() * 60 + NOW.getMinutes();
  const isCurrent = cls.day === TODAY_DAY && nowMins >= startMins && nowMins < endMins;
  const isPast = cls.day === TODAY_DAY && nowMins >= endMins;

  const typeColors = { lecture: '#E8F0FE', lab: '#FEF3E2' };
  const typeTextColors = { lecture: '#1A5FA8', lab: '#7A4F0E' };

  return (
    <div className={`timetable-period ${isCurrent ? 'current' : ''}`} style={{ opacity: isPast ? 0.65 : 1 }}>
      <div className="timetable-time">
        <div>{formatTime(cls.startTime)}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>– {formatTime(cls.endTime)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="timetable-subject">{cls.subjectName}</div>
        <div className="timetable-meta">
          {cls.teacherName} · {cls.room}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
        {isCurrent && <span className="badge badge-primary" style={{ fontSize: '0.62rem' }}>● Now</span>}
        <span style={{ fontSize: '0.68rem', padding: '0.1em 0.4em', borderRadius: 4, background: typeColors[cls.type] || 'var(--color-bg)', color: typeTextColors[cls.type] || 'var(--color-text-muted)', fontWeight: 600 }}>
          {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
        </span>
      </div>
    </div>
  );
}

function DayColumn({ day, classes, isToday }) {
  const classes_filtered = classes.filter((c) => c.day === day);
  return (
    <div className="week-col">
      <div className={`week-col-header ${isToday ? 'today' : ''}`} style={{ color: isToday ? 'var(--color-primary)' : undefined, fontWeight: isToday ? 700 : undefined }}>
        {getDayName(day, true)}
        {isToday && <div style={{ fontSize: '0.6rem', color: 'var(--color-primary)', marginTop: '1px' }}>Today</div>}
      </div>
      {classes_filtered.filter(c => c.type !== 'break').length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', padding: '0.5rem 0', textAlign: 'center', fontStyle: 'italic' }}>
          No classes
        </div>
      ) : (
        classes_filtered.filter(c => c.type !== 'break').map((cls) => (
          <div key={cls.id} style={{ marginBottom: '0.35rem' }}>
            <div style={{
              padding: '0.4rem 0.5rem',
              background: cls.type === 'lab' ? '#FEF3E2' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
            }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cls.subjectName.split(' ').slice(0, 2).join(' ')}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                {formatTime(cls.startTime)}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>{cls.room}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function TimetablePage() {
  const [view, setView] = useState('day');
  const [selectedDay, setSelectedDay] = useState(TODAY_DAY === 0 || TODAY_DAY === 6 ? 1 : TODAY_DAY);

  const dayClasses = TIMETABLE.filter((c) => c.day === selectedDay).sort((a, b) => {
    const [ah, am] = a.startTime.split(':').map(Number);
    const [bh, bm] = b.startTime.split(':').map(Number);
    return (ah * 60 + am) - (bh * 60 + bm);
  });

  const prevDay = () => setSelectedDay((d) => {
    let next = d - 1; if (next < 1) next = 5; return next;
  });
  const nextDay = () => setSelectedDay((d) => {
    let next = d + 1; if (next > 5) next = 1; return next;
  });

  const hasClasses = dayClasses.filter(c => c.type !== 'break').length > 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Timetable</h1>
            <p className="page-subtitle">BCA Semester 5 — Section A class schedule</p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button id="view-day" className={`btn btn-sm ${view === 'day' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('day')}>Day View</button>
            <button id="view-week" className={`btn btn-sm ${view === 'week' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('week')}>Week View</button>
          </div>
        </div>
      </div>

      {view === 'day' ? (
        <div className="card">
          {/* Day Navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={prevDay}><ChevronLeft size={16} /></button>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getDayName(selectedDay)}
              {selectedDay === TODAY_DAY && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Today</span>}
            </div>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={nextDay}><ChevronRight size={16} /></button>
          </div>

          {/* Day header buttons */}
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
            {WEEKDAYS.map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${selectedDay === d ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedDay(d)}
              >
                {getDayName(d, true)}
                {d === TODAY_DAY && <span style={{ width: 5, height: 5, borderRadius: '50%', background: selectedDay === d ? 'white' : 'var(--color-primary)', display: 'inline-block', marginLeft: 4 }} />}
              </button>
            ))}
          </div>

          <div style={{ padding: '0.75rem 1rem' }}>
            {!hasClasses ? (
              <EmptyState icon={Clock} title="No classes today" description="Enjoy your day off!" />
            ) : (
              dayClasses.map((cls) => <PeriodRow key={cls.id} cls={cls} />)
            )}
          </div>

          {/* Demo note */}
          <div className="card-footer">
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              ⚠ This is a sample timetable for demonstration. Real timetable data requires connection to the college's system.
              Teacher names, room numbers, and timings are fictional.
            </p>
          </div>
        </div>
      ) : (
        // Week View
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Clock size={15} /> Weekly Schedule</div>
            <div className="demo-label">Sample Data</div>
          </div>
          <div style={{ overflow: 'auto' }}>
            <div style={{ display: 'flex', minWidth: 600, padding: '0.75rem' }}>
              {WEEKDAYS.map((day) => (
                <DayColumn key={day} day={day} classes={TIMETABLE} isToday={day === TODAY_DAY} />
              ))}
            </div>
          </div>
          <div className="card-footer">
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Sample timetable — not connected to real college schedule.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
