import React, { useMemo } from 'react';
import { BarChart2, Download, Printer, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/sampleData';
import {
  getSubjectAttendanceSummary, getOverallAttendance,
  formatPercent, formatDate
} from '../utils/attendanceUtils';
import AttendanceProgressBar from '../components/common/AttendanceProgressBar';

export default function ReportsPage() {
  const { state } = useApp();
  const user = state.user;

  const summaries = useMemo(() =>
    getSubjectAttendanceSummary(SUBJECTS, state.attendanceRecords, user?.id || 'S001'),
    [state.attendanceRecords, user]
  );

  const overall = useMemo(() => getOverallAttendance(summaries), [summaries]);

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const headers = ['Subject Code', 'Subject Name', 'Teacher', 'Attended', 'Absent', 'Total', 'Percentage', 'Status'];
    const rows = summaries.map((s) => [
      s.code, s.name, s.teacherName, s.attended, s.missed, s.totalConducted,
      `${s.percent.toFixed(1)}%`, s.status.label
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tetso_attendance_report_${user?.id || 'student'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Attendance Reports</h1>
            <p className="page-subtitle">Summary and export of your attendance records</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }} className="no-print">
            <button id="export-csv" className="btn btn-secondary" onClick={handleCSV}>
              <Download size={15} /> Export CSV
            </button>
            <button id="print-report" className="btn btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="alert alert-info no-print" style={{ marginBottom: '1rem' }}>
        <Info size={14} className="alert-icon" />
        <span style={{ fontSize: '0.8rem' }}>
          This is a sample report generated from demo data. Not an official college document.
          Location coordinates are not included in exported data.
        </span>
      </div>

      {/* Report Header (printable) */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                TETSO ATTENDANCE — DEMO REPORT
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Attendance Summary Report</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Tetso College, Nagaland, India · Academic Year 2024-25
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div>Generated: {today}</div>
              <div className="demo-label" style={{ marginTop: '0.25rem' }}>Sample Report</div>
            </div>
          </div>

          {/* Student Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '1rem', padding: '0.875rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
            {[
              ['Student Name', user?.name || '—'],
              ['Student ID', user?.id || '—'],
              ['Roll Number', user?.rollNo || '—'],
              ['Course', user?.course || '—'],
              ['Semester', `Semester ${user?.semester || '—'}`],
              ['Section', user?.section || 'A'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Summary */}
        <div style={{ padding: '1rem 1.5rem', background: overall.overallPercent >= 75 ? 'var(--color-success-bg)' : 'var(--color-error-bg)' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Overall Attendance</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: overall.overallPercent >= 75 ? 'var(--color-success)' : 'var(--color-error)', lineHeight: 1 }}>
                {formatPercent(overall.overallPercent)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Classes Attended</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{overall.totalAttended} / {overall.totalClasses}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Absences</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-error)' }}>{overall.totalClasses - overall.totalAttended}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Requirement</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>75%</div>
            </div>
            <span className={`badge ${overall.overallPercent >= 75 ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.875rem', padding: '0.4em 0.9em' }}>
              {overall.overallPercent >= 75 ? '✓ Eligible' : '✗ Below Requirement'}
            </span>
          </div>
        </div>
      </div>

      {/* Subject-wise Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><BarChart2 size={15} /> Subject-wise Breakdown</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Attended</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Percentage</th>
                <th>Status</th>
                <th>Attendance Bar</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((s) => (
                <tr key={s.id}>
                  <td><code style={{ fontSize: '0.75rem' }}>{s.code}</code></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.credits} credits</div>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{s.teacherName}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{s.attended}</td>
                  <td style={{ color: 'var(--color-error)', fontWeight: 600 }}>{s.missed}</td>
                  <td>{s.totalConducted}</td>
                  <td style={{ fontWeight: 700, color: s.status.variant === 'error' ? 'var(--color-error)' : s.status.variant === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {formatPercent(s.percent)}
                  </td>
                  <td><span className={`badge ${s.status.className}`}>{s.status.label}</span></td>
                  <td style={{ minWidth: 100 }}>
                    <AttendanceProgressBar percent={s.percent} minRequired={s.minAttendancePercent} showLabel={false} height={6} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--color-bg-secondary)', fontWeight: 700 }}>
                <td colSpan={3}>Total / Overall</td>
                <td style={{ color: 'var(--color-success)' }}>{overall.totalAttended}</td>
                <td style={{ color: 'var(--color-error)' }}>{overall.totalClasses - overall.totalAttended}</td>
                <td>{overall.totalClasses}</td>
                <td style={{ color: overall.overallPercent >= 75 ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {formatPercent(overall.overallPercent)}
                </td>
                <td colSpan={2}>
                  <span className={`badge ${overall.overallPercent >= 75 ? 'badge-success' : 'badge-error'}`}>
                    {overall.overallPercent >= 75 ? 'Eligible' : 'Below Req.'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="card-footer">
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            * This report uses sample data for demonstration. Percentages are calculated from actual demo records.
            Not an official college attendance document. Report period: August 2024 – October 2024.
          </p>
        </div>
      </div>
    </div>
  );
}
