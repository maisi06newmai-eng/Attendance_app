import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, MapPin, FileEdit, TrendingUp, MoreHorizontal, ClipboardCheck, CheckSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const STUDENT_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/attendance', label: 'Attendance', icon: BookOpen },
  { to: '/location', label: 'Verify', icon: MapPin },
  { to: '/corrections', label: 'Requests', icon: FileEdit },
  { to: '/insights', label: 'Insights', icon: TrendingUp },
];

const TEACHER_ITEMS = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/attendance', label: 'Mark', icon: ClipboardCheck },
  { to: '/teacher/corrections', label: 'Reviews', icon: CheckSquare },
];

export default function MobileNav({ isTeacher = false }) {
  const { unreadCount } = useApp();
  const items = isTeacher ? TEACHER_ITEMS : STUDENT_ITEMS;

  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/teacher' || item.to === '/dashboard'}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
