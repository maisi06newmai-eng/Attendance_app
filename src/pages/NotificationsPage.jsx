import React, { useState, useMemo } from 'react';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRelativeTime, getNotificationIcon } from '../utils/attendanceUtils';
import { EmptyState } from '../components/common/States';
import { useNavigate } from 'react-router-dom';

const NOTIF_TYPE_COLORS = {
  attendance_marked_present: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  attendance_marked_absent: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
  attendance_warning: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  correction_submitted: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  correction_approved: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  correction_rejected: { bg: 'var(--color-error-bg)', color: 'var(--color-error)' },
  mismatch_detected: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  announcement: { bg: 'rgba(101,0,7,0.08)', color: 'var(--color-primary)' },
  upcoming_class: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
};

const FILTER_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'correction', label: 'Corrections' },
  { key: 'warning', label: 'Warnings' },
  { key: 'announcement', label: 'Announcements' },
];

function matchesFilter(notif, filter) {
  if (filter === 'all') return true;
  if (filter === 'attendance') return notif.type.includes('attendance_marked');
  if (filter === 'correction') return notif.type.includes('correction');
  if (filter === 'warning') return notif.type.includes('warning');
  if (filter === 'announcement') return notif.type === 'announcement';
  return true;
}

export default function NotificationsPage() {
  const { state, dispatch, unreadCount } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const user = state.user;

  const allNotifs = useMemo(() =>
    state.notifications
      .filter((n) => !n.studentId || n.studentId === user?.id || !user)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [state.notifications, user]
  );

  const filtered = useMemo(() =>
    allNotifs.filter((n) => matchesFilter(n, filter)),
    [allNotifs, filter]
  );

  const markRead = (id) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  const markAllRead = () => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });

  const handleClick = (notif) => {
    markRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button id="mark-all-read" className="btn btn-secondary btn-sm" onClick={markAllRead}>
              <CheckCheck size={15} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-bar" style={{ marginBottom: '1rem' }}>
        {FILTER_TYPES.map((ft) => (
          <button
            key={ft.key}
            className={`tab-btn ${filter === ft.key ? 'active' : ''}`}
            onClick={() => setFilter(ft.key)}
          >
            {ft.label}
            {ft.key === 'all' && unreadCount > 0 && (
              <span className="badge badge-primary" style={{ marginLeft: '0.35rem', fontSize: '0.62rem' }}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="Nothing here yet. Notifications about attendance and correction requests will appear here."
          />
        ) : (
          filtered.map((n) => {
            const colors = NOTIF_TYPE_COLORS[n.type] || { bg: 'var(--color-bg)', color: 'var(--color-text-muted)' };
            return (
              <div
                key={n.id}
                className={`notif-item ${n.read ? '' : 'unread'}`}
                onClick={() => handleClick(n)}
                role="button"
                tabIndex={0}
                aria-label={`${n.title}. ${n.read ? 'Read' : 'Unread'}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClick(n); }}
              >
                <div className="notif-icon" style={{ background: colors.bg, color: colors.color }}>
                  <span style={{ fontSize: '1rem' }}>{getNotificationIcon(n.type)}</span>
                </div>
                <div className="notif-body">
                  <div className="notif-title" style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                  <div className="notif-desc">{n.message}</div>
                  <div className="notif-time">{formatRelativeTime(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
