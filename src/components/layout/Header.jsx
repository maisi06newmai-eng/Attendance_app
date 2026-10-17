import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/attendance': 'My Attendance',
  '/history': 'Attendance History',
  '/location': 'Location Verification',
  '/corrections': 'Correction Requests',
  '/insights': 'Attendance Insights',
  '/timetable': 'Timetable',
  '/notifications': 'Notifications',
  '/profile': 'Profile & Settings',
  '/reports': 'Attendance Reports',
  '/teacher': 'Teacher Dashboard',
  '/teacher/attendance': 'Mark Attendance',
  '/teacher/corrections': 'Correction Reviews',
  '/teacher/notifications': 'Notifications',
  '/teacher/profile': 'Profile & Settings',
};

export default function Header({ isTeacher = false }) {
  const { state, dispatch, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Tetso Attendance';
  const isDark = state.theme === 'dark';

  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const toggleTheme = () => dispatch({ type: 'SET_THEME', payload: isDark ? 'light' : 'dark' });
  const goToNotifications = () => navigate(isTeacher ? '/teacher/notifications' : '/notifications');

  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <button
          className="header-icon-btn"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          id="sidebar-toggle"
        >
          <Menu size={18} />
        </button>
        <div>
          <div className="header-title">{pageTitle}</div>
          <div className="header-breadcrumb">
            Tetso College &rsaquo; {pageTitle}
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          id="theme-toggle"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          className="header-icon-btn"
          onClick={goToNotifications}
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          id="notifications-btn"
        >
          <Bell size={17} />
          {unreadCount > 0 && <span className="notif-dot" aria-hidden="true" />}
        </button>

        {/* User Avatar */}
        <button
          className="header-icon-btn"
          onClick={() => navigate(isTeacher ? '/teacher/profile' : '/profile')}
          aria-label="Go to profile"
          id="profile-btn"
          style={{
            background: state.user?.avatarColor || 'var(--color-primary)',
            border: 'none',
            color: '#F6F1EA',
            fontWeight: 700,
            fontSize: '0.8rem',
          }}
        >
          {state.user?.avatar || '?'}
        </button>
      </div>
    </header>
  );
}
