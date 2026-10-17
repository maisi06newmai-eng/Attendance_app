import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import { useApp } from '../../context/AppContext';

export default function AppLayout({ isTeacher = false }) {
  const { state, dispatch } = useApp();

  const closeSidebar = () => dispatch({ type: 'CLOSE_SIDEBAR' });

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${state.sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${state.sidebarOpen ? 'open' : ''}`} aria-label="Main navigation">
        <Sidebar isTeacher={isTeacher} onNavigate={closeSidebar} />
      </aside>

      {/* Main Content */}
      <div className="app-main">
        <Header isTeacher={isTeacher} />
        <main className="app-content" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav isTeacher={isTeacher} />
    </div>
  );
}
