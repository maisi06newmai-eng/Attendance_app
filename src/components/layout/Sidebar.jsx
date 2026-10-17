import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, CalendarDays, MapPin, FileEdit,
  TrendingUp, Clock, Bell, User, BarChart2, LogOut,
  GraduationCap, ClipboardCheck, CheckSquare, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ─── Student Nav Items ────────────────────────────────────────
const STUDENT_NAV = [
  { group: 'Overview', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { group: 'Attendance', items: [
    { to: '/attendance', label: 'My Attendance', icon: BookOpen },
    { to: '/history', label: 'Attendance History', icon: CalendarDays },
    { to: '/insights', label: 'Attendance Insights', icon: TrendingUp },
  ]},
  { group: 'Features', items: [
    { to: '/location', label: 'Location Verify', icon: MapPin },
    { to: '/corrections', label: 'Correction Requests', icon: FileEdit },
    { to: '/timetable', label: 'Timetable', icon: Clock },
  ]},
  { group: 'Account', items: [
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: true },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
    { to: '/profile', label: 'Profile & Settings', icon: User },
  ]},
];

// ─── Teacher Nav Items ────────────────────────────────────────
const TEACHER_NAV = [
  { group: 'Overview', items: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { group: 'Attendance', items: [
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
    { to: '/teacher/corrections', label: 'Correction Reviews', icon: CheckSquare },
  ]},
  { group: 'Account', items: [
    { to: '/teacher/notifications', label: 'Notifications', icon: Bell, badge: true },
    { to: '/teacher/profile', label: 'Profile & Settings', icon: User },
  ]},
];

export default function Sidebar({ isTeacher = false, onNavigate }) {
  const { state, logout, unreadCount } = useApp();
  const navigate = useNavigate();
  const navItems = isTeacher ? TEACHER_NAV : STUDENT_NAV;
  const user = state.user;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="14" height="17" rx="2" stroke="#D9AD70" strokeWidth="1.5"/>
            <path d="M6 7h8M6 10h8M6 13h5" stroke="#D9AD70" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="17" cy="16" r="4" fill="#287A50"/>
            <path d="M15.5 16l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Tetso Attendance</span>
          <span className="sidebar-brand-tagline">Tetso College · Nagaland</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label={isTeacher ? 'Teacher navigation' : 'Student navigation'}>
        {navItems.map((group) => (
          <div key={group.group}>
            <div className="sidebar-section-label">{group.group}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/teacher' || item.to === '/dashboard'}
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={onNavigate}
                  aria-label={item.label}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="nav-badge" aria-label={`${unreadCount} unread`}>{unreadCount}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate(isTeacher ? '/teacher/profile' : '/profile')}>
          <div className="sidebar-avatar" style={{ background: user?.avatarColor || '#650007' }}>
            {user?.avatar || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{isTeacher ? user?.designation || 'Teacher' : `${user?.course} Sem ${user?.semester}`}</div>
          </div>
          <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
        </div>
        <button className="sidebar-nav-item" onClick={handleLogout} style={{ marginTop: '0.25rem' }} aria-label="Sign out">
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}
