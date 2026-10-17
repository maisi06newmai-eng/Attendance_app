import React, { useMemo } from 'react';
import { BookOpen, Users, CheckSquare, ClipboardList, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUBJECTS, CLASS_STUDENTS } from '../../data/sampleData';
import { getSubjectAttendanceSummary, getOverallAttendance, formatPercent, getGreeting } from '../../utils/attendanceUtils';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const user = state.user;

  const teacherSubjects = SUBJECTS.filter((s) => user?.subjects?.includes(s.id));
  const pendingReviews = state.correctionRequests.filter((r) => r.status === 'pending' || r.status === 'under_review');
  const allSummaries = useMemo(() =>
    getSubjectAttendanceSummary(SUBJECTS, state.attendanceRecords, 'S001'),
    [state.attendanceRecords]
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700 }}>{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{today}</p>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-gold">{user?.designation}</span>
          <span className="badge badge-muted">{user?.department}</span>
          <span className="badge badge-primary">{teacherSubjects.length} Subject{teacherSubjects.length !== 1 ? 's' : ''} Assigned</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '1.25rem' }}>
        {[
          { value: teacherSubjects.length, label: 'My Subjects', icon: BookOpen, iconBg: 'rgba(101,0,7,0.08)', iconColor: 'var(--color-primary)' },
          { value: CLASS_STUDENTS.length, label: 'Students (Demo Class)', icon: Users, iconBg: 'var(--color-info-bg)', iconColor: 'var(--color-info)' },
          { value: pendingReviews.length, label: 'Pending Reviews', icon: CheckSquare, iconBg: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)' },
          { value: state.correctionRequests.filter(r => r.status === 'approved').length, label: 'Approved Requests', icon: ClipboardList, iconBg: 'var(--color-success-bg)', iconColor: 'var(--color-success)' },
        ].map((item) => (
          <div key={item.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: item.iconBg }}>
              <item.icon size={20} style={{ color: item.iconColor }} />
            </div>
            <div className="stat-card-value">{item.value}</div>
            <div className="stat-card-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* My Subjects */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BookOpen size={15} style={{ color: 'var(--color-primary)' }} /> My Subjects</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/attendance')}>Mark Attendance →</button>
          </div>
          <div style={{ padding: '0 1rem' }}>
            {teacherSubjects.map((s) => {
              const summary = allSummaries.find((x) => x.id === s.id);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.code} · {s.totalClasses} classes</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{s.totalClasses} classes</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>conducted</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Correction Reviews */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><CheckSquare size={15} style={{ color: 'var(--color-warning)' }} /> Pending Reviews</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/corrections')}>View All →</button>
          </div>
          {pendingReviews.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No pending reviews. All caught up!
            </div>
          ) : (
            <div style={{ padding: '0 1rem' }}>
              {pendingReviews.slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => navigate('/teacher/corrections')}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{r.studentName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{r.subjectName} · {r.date}</div>
                  </div>
                  <span className={`badge ${r.status === 'pending' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                    {r.status === 'pending' ? 'Pending' : 'Under Review'}
                  </span>
                </div>
              ))}
              {pendingReviews.length > 5 && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => navigate('/teacher/corrections')}>
                  +{pendingReviews.length - 5} more →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Attendance Overview */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><Users size={15} style={{ color: 'var(--color-primary)' }} /> Demo Student Attendance (Arenla Jamir, S001)</div>
          <div className="demo-label">Sample Data</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Attended</th>
                <th>Total</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allSummaries.map((s) => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.code}</div></td>
                  <td>{s.attended}</td>
                  <td>{s.totalConducted}</td>
                  <td style={{ fontWeight: 700, color: s.status.variant === 'error' ? 'var(--color-error)' : s.status.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {formatPercent(s.percent)}
                  </td>
                  <td><span className={`badge ${s.status.className}`}>{s.status.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
