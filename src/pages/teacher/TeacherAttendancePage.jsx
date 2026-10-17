import React, { useState, useMemo } from 'react';
import { ClipboardCheck, Check, X, Save, AlertTriangle, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUBJECTS, CLASS_STUDENTS, generateDemoClassAttendance } from '../../data/sampleData';
import { formatDate } from '../../utils/attendanceUtils';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';

export default function TeacherAttendancePage() {
  const { state, dispatch, showToast } = useApp();
  const user = state.user;

  const teacherSubjects = SUBJECTS.filter((s) => user?.subjects?.includes(s.id));

  const [selectedSubject, setSelectedSubject] = useState(teacherSubjects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState(() => generateDemoClassAttendance());
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const presentPercent = Math.round((presentCount / attendance.length) * 100);

  const toggleStatus = (studentId) => {
    setSaved(false);
    setAttendance((prev) =>
      prev.map((a) =>
        a.studentId === studentId
          ? { ...a, status: a.status === 'present' ? 'absent' : 'present' }
          : a
      )
    );
  };

  const markAll = (status) => {
    setSaved(false);
    setAttendance((prev) => prev.map((a) => ({ ...a, status })));
  };

  const handleSave = () => {
    attendance.forEach((a) => {
      dispatch({
        type: 'UPDATE_ATTENDANCE_RECORD',
        payload: {
          subjectId: selectedSubject,
          studentId: a.studentId,
          date: selectedDate,
          period: 1,
          status: a.status,
          markedBy: user?.id,
        },
      });
    });
    setSaved(true);
    setShowConfirm(false);
    showToast(`Attendance saved for ${attendance.length} students.`, 'success', 'Attendance Saved');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Mark Attendance</h1>
            <p className="page-subtitle">Record class attendance for your assigned subjects</p>
          </div>
          <div className="demo-label">Demo — Changes in App State Only</div>
        </div>
      </div>

      {/* Selector Row */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="ta-subject">Subject</label>
              <select
                id="ta-subject"
                className="form-input form-select"
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setSaved(false); }}
              >
                {teacherSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="ta-date">Class Date</label>
              <input
                id="ta-date"
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSaved(false); }}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <Users size={15} style={{ color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{attendance.length} students</span>
            </div>
            <span className="badge badge-success">✓ {presentCount} Present</span>
            <span className="badge badge-error">✗ {absentCount} Absent</span>
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Class attendance: <strong>{presentPercent}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Mark All Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button id="mark-all-present" className="btn btn-success btn-sm" onClick={() => markAll('present')}>
          <Check size={14} /> Mark All Present
        </button>
        <button id="mark-all-absent" className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>
          <X size={14} /> Mark All Absent
        </button>
        <div style={{ flex: 1 }} />
        <button
          id="save-attendance"
          className={`btn ${saved ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowConfirm(true)}
          disabled={saved}
        >
          <Save size={14} />
          {saved ? 'Saved ✓' : 'Save Attendance'}
        </button>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><ClipboardCheck size={15} /> Student List — {formatDate(selectedDate)}</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Roll No.</th>
                <th>Student Name</th>
                <th>Status</th>
                <th>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => (
                <tr key={a.studentId} style={{ background: a.status === 'absent' ? 'rgba(180,35,24,0.03)' : undefined }}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                  <td><code style={{ fontSize: '0.78rem' }}>{a.rollNo}</code></td>
                  <td style={{ fontWeight: 500 }}>{a.studentName}</td>
                  <td>
                    <span className={`badge ${a.status === 'present' ? 'badge-success' : 'badge-error'}`}>
                      {a.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className={`mark-btn mark-present ${a.status === 'present' ? 'active' : ''}`}
                        onClick={() => a.status !== 'present' && toggleStatus(a.studentId)}
                        aria-label={`Mark ${a.studentName} present`}
                        title="Present"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className={`mark-btn mark-absent ${a.status === 'absent' ? 'active' : ''}`}
                        onClick={() => a.status !== 'absent' && toggleStatus(a.studentId)}
                        aria-label={`Mark ${a.studentName} absent`}
                        title="Absent"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <div className="alert alert-warning" style={{ border: 'none', padding: '0.5rem 0', background: 'none' }}>
            <AlertTriangle size={13} className="alert-icon" />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Demo: Attendance is saved to application state only. Real deployment requires secure backend integration with role-based permissions.
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmationDialog
        isOpen={showConfirm}
        title="Save Attendance"
        message={`Save attendance for ${attendance.length} students in ${SUBJECTS.find(s => s.id === selectedSubject)?.name || selectedSubject} on ${formatDate(selectedDate)}? Present: ${presentCount}, Absent: ${absentCount}.`}
        confirmLabel="Save Attendance"
        cancelLabel="Review Again"
        variant="primary"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
