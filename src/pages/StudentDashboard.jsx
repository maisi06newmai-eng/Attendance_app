import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarCheck, AlertTriangle, TrendingUp, Clock,
  ChevronRight, MapPin, FileEdit, Bell, CheckCircle, XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS, TIMETABLE } from '../data/sampleData';
import {
  getSubjectAttendanceSummary, getOverallAttendance,
  getGreeting, formatDate, formatTime, formatPercent, getDayName
} from '../utils/attendanceUtils';
import AttendanceProgressBar from '../components/common/AttendanceProgressBar';

// ─── Stat Card Component ──────────────────────────────────────
function StatCard({ value, label, sub, iconBg, icon: Icon, iconColor }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

// ─── Subject Quick Card ───────────────────────────────────────
function SubjectQuickCard({ subject, onClick }) {
  return (
    <div
      className="card"
      style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
      onClick={onClick}
    >
      <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subject.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
            {subject.code} · {subject.attended}/{subject.totalConducted} classes
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <AttendanceProgressBar percent={subject.percent} minRequired={subject.minAttendancePercent} showLabel={false} height={5} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: subject.status.variant === 'error' ? 'var(--color-error)' : subject.status.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
            {formatPercent(subject.percent)}
          </div>
          <span className={`badge ${subject.status.className}`} style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
            {subject.status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Today's Class Card ───────────────────────────────────────
function TodayClassCard({ cls }) {
  const isBreak = cls.type === 'break';
  if (isBreak) return null;

  const now = new Date();
  const [startH, startM] = cls.startTime.split(':').map(Number);
  const [endH, endM] = cls.endTime.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isCurrent = nowMins >= startMins && nowMins < endMins;
  const isPast = nowMins >= endMins;

  return (
    <div className={`timetable-period ${isCurrent ? 'current' : ''}`} style={{ opacity: isPast ? 0.7 : 1 }}>
      <div className="timetable-time">
        <div>{formatTime(cls.startTime)}</div>
        <div style={{ fontSize: '0.68rem' }}>–{formatTime(cls.endTime)}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div className="timetable-subject">{cls.subjectName}</div>
        <div className="timetable-meta">{cls.teacherName} · {cls.room}</div>
      </div>
      {isCurrent && (
        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Now</span>
      )}
      {cls.type === 'lab' && (
        <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Lab</span>
      )}
    </div>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────
function ActivityItem({ record, subjects }) {
  const subject = subjects.find((s) => s.id === record.subjectId);
  const isPresent = record.status === 'present';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isPresent ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {isPresent
          ? <CheckCircle size={15} style={{ color: 'var(--color-success)' }} />
          : <XCircle size={15} style={{ color: 'var(--color-error)' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subject?.name || 'Unknown Subject'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{formatDate(record.date)}</div>
      </div>
      <span className={`badge ${isPresent ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.65rem' }}>
        {isPresent ? 'Present' : 'Absent'}
      </span>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function StudentDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const user = state.user;

  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const todayDateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Calculate attendance
  const subjectSummaries = useMemo(() =>
    getSubjectAttendanceSummary(SUBJECTS, state.attendanceRecords, user?.id || 'S001'),
    [state.attendanceRecords, user]
  );

  const overall = useMemo(() => getOverallAttendance(subjectSummaries), [subjectSummaries]);

  const atRiskSubjects = subjectSummaries.filter((s) => s.status.variant !== 'success');

  // Today's timetable
  const todayClasses = TIMETABLE.filter((c) => c.day === todayDay && c.type !== 'break');

  // Recent attendance (last 8 records across all subjects)
  const recentRecords = useMemo(() => {
    return [...state.attendanceRecords]
      .filter((r) => r.studentId === user?.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [state.attendanceRecords, user]);

  const pendingRequests = state.correctionRequests.filter(
    (r) => r.studentId === user?.id && (r.status === 'pending' || r.status === 'under_review')
  );

  const unreadNotifs = state.notifications.filter((n) => !n.read);

  return (
    <div>
      {/* Greeting Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {todayDateStr}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-gold">{user?.course} — Sem {user?.semester}</span>
            <span className="badge badge-muted">Roll: {user?.rollNo}</span>
          </div>
        </div>

        {/* Alerts */}
        {atRiskSubjects.length > 0 && (
          <div className="alert alert-warning" style={{ marginTop: '0.875rem' }}>
            <AlertTriangle size={16} className="alert-icon" />
            <div>
              <div className="alert-title">Attendance Warning</div>
              <div style={{ fontSize: '0.8rem' }}>
                {atRiskSubjects.filter(s => s.status.variant === 'error').length} subject(s) are below the 75% requirement.{' '}
                <button onClick={() => navigate('/insights')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', textDecoration: 'underline', fontSize: 'inherit' }}>
                  View Insights →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard
          value={`${overall.overallPercent.toFixed(1)}%`}
          label="Overall Attendance"
          sub={`${overall.totalAttended} of ${overall.totalClasses} classes`}
          icon={TrendingUp}
          iconBg="rgba(101,0,7,0.08)"
          iconColor="var(--color-primary)"
        />
        <StatCard
          value={overall.totalClasses}
          label="Total Classes"
          sub="All subjects combined"
          icon={CalendarCheck}
          iconBg="rgba(26,95,168,0.1)"
          iconColor="var(--color-info)"
        />
        <StatCard
          value={overall.totalAttended}
          label="Classes Attended"
          sub={`${overall.totalClasses - overall.totalAttended} absent`}
          icon={CheckCircle}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success)"
        />
        <StatCard
          value={SUBJECTS.length}
          label="Subjects Enrolled"
          sub={`${atRiskSubjects.filter(s => s.status.variant === 'error').length} need attention`}
          icon={BookOpen}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning)"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>
        {/* Left Column */}
        <div>
          {/* Subject Overview */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <div className="card-title">
                <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                Subject Attendance
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/attendance')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ padding: '0.75rem 1rem' }}>
              {subjectSummaries.map((subject) => (
                <SubjectQuickCard
                  key={subject.id}
                  subject={subject}
                  onClick={() => navigate('/attendance')}
                />
              ))}
            </div>
          </div>

          {/* Today's Timetable */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                Today's Classes
                <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{getDayName(todayDay)}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/timetable')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                Full Timetable <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ padding: '0.75rem 1rem' }}>
              {todayClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No classes scheduled today.
                </div>
              ) : (
                todayClasses.map((cls) => <TodayClassCard key={cls.id} cls={cls} />)
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div style={{ padding: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => navigate('/location')} style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
                  <MapPin size={16} /> Verify My Location
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/corrections')} style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
                  <FileEdit size={16} /> Report Attendance Issue
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/insights')} style={{ justifyContent: 'flex-start', gap: '0.6rem' }}>
                  <TrendingUp size={16} /> View Insights
                </button>
              </div>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <FileEdit size={16} style={{ color: 'var(--color-warning)' }} />
                  Pending Requests
                </div>
                <span className="badge badge-warning">{pendingRequests.length}</span>
              </div>
              <div style={{ padding: '0.5rem 1rem' }}>
                {pendingRequests.slice(0, 3).map((r) => (
                  <div key={r.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }} onClick={() => navigate('/corrections')} className="cursor-pointer">
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.subjectName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{formatDate(r.date)} · {r.status === 'under_review' ? 'Under Review' : 'Pending'}</div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/corrections')} style={{ width: '100%', marginTop: '0.5rem' }}>
                  View All →
                </button>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Activity</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>
                History
              </button>
            </div>
            <div style={{ padding: '0 1rem' }}>
              {recentRecords.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
                  No recent records.
                </div>
              ) : (
                recentRecords.map((r) => (
                  <ActivityItem key={r.id} record={r} subjects={SUBJECTS} />
                ))
              )}
            </div>
          </div>

          {/* Notifications */}
          {unreadNotifs.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Bell size={15} style={{ color: 'var(--color-primary)' }} />
                  Notifications
                </div>
                <span className="badge badge-primary">{unreadNotifs.length} new</span>
              </div>
              <div style={{ padding: '0.5rem 1rem' }}>
                {unreadNotifs.slice(0, 3).map((n) => (
                  <div key={n.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem', lineHeight: 1.5 }}>
                      {n.message.slice(0, 70)}{n.message.length > 70 ? '...' : ''}
                    </div>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')} style={{ width: '100%', marginTop: '0.5rem' }}>
                  View All →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive fix for small screens */}
      <style>{`
        @media (max-width: 900px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
