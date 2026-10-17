import React, { useState } from 'react';
import { User, Mail, BookOpen, Settings, Sun, Moon, Bell, MapPin, RotateCcw, LogOut, Shield, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../components/common/ConfirmationDialog';

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0', borderBottom: '1px solid var(--color-border)', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
          {description && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{description}</div>}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--color-primary)' : 'var(--color-border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease', flexShrink: 0
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </button>
  );
}

export default function ProfilePage() {
  const { state, dispatch, logout, showToast } = useApp();
  const navigate = useNavigate();
  const user = state.user;
  const isDark = state.theme === 'dark';
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notifPref, setNotifPref] = useState({ attendance: true, corrections: true, warnings: true, announcements: false });

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_DEMO_DATA' });
    showToast('Demo data has been reset.', 'info', 'Reset Complete');
    setShowResetConfirm(false);
  };

  if (!user) return null;

  const isTeacher = user.role === 'teacher';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile &amp; Settings</h1>
        <p className="page-subtitle">Manage your account preferences and application settings</p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="avatar-lg" style={{ background: user.avatarColor || 'var(--color-primary)' }}>
              {user.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.2rem' }}>{user.name}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-primary">{isTeacher ? user.designation : `${user.course} Semester ${user.semester}`}</span>
                <span className="badge badge-muted">A.Y. {user.academicYear || '2024-25'}</span>
                <span className="badge badge-gold">Demo Account</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {[
                  { icon: Mail, label: isTeacher ? 'Email' : 'Email', value: user.email },
                  { icon: User, label: isTeacher ? 'Employee ID' : 'Roll Number', value: user.rollNo || user.id },
                  { icon: BookOpen, label: isTeacher ? 'Department' : 'Course', value: isTeacher ? user.department : user.course },
                  { icon: Shield, label: isTeacher ? 'Role' : 'Student ID', value: isTeacher ? 'Teacher' : user.id },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <item.icon size={14} style={{ color: 'var(--color-text-muted)', marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: '1rem' }}>
            <Info size={14} className="alert-icon" />
            <span style={{ fontSize: '0.8rem' }}>
              This is a demo profile with fictional data. In a real deployment, profile information would be
              managed by the college's student information system with secure authentication.
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><Settings size={15} /> Appearance</div>
        </div>
        <div className="card-body">
          <SettingRow icon={isDark ? Moon : Sun} label="Dark Mode" description="Switch between light and dark appearance">
            <Toggle
              id="dark-mode-toggle"
              checked={isDark}
              onChange={(v) => dispatch({ type: 'SET_THEME', payload: v ? 'dark' : 'light' })}
            />
          </SettingRow>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><Bell size={15} /> Notification Preferences</div>
          <div className="demo-label">UI Only</div>
        </div>
        <div className="card-body">
          <div className="alert alert-warning" style={{ marginBottom: '0.875rem' }}>
            <Info size={13} className="alert-icon" />
            <span style={{ fontSize: '0.8rem' }}>Push notifications require backend infrastructure. These settings affect in-app demo notifications only.</span>
          </div>
          <SettingRow icon={BookOpen} label="Attendance Updates" description="When attendance is marked for a class">
            <Toggle id="notif-attendance" checked={notifPref.attendance} onChange={(v) => setNotifPref(p => ({...p, attendance: v}))} />
          </SettingRow>
          <SettingRow icon={Bell} label="Correction Request Updates" description="Status changes to your correction requests">
            <Toggle id="notif-corrections" checked={notifPref.corrections} onChange={(v) => setNotifPref(p => ({...p, corrections: v}))} />
          </SettingRow>
          <SettingRow icon={Bell} label="Attendance Warnings" description="When attendance drops below threshold">
            <Toggle id="notif-warnings" checked={notifPref.warnings} onChange={(v) => setNotifPref(p => ({...p, warnings: v}))} />
          </SettingRow>
        </div>
      </div>

      {/* Location Settings */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><MapPin size={15} /> Location Settings</div>
        </div>
        <div className="card-body">
          <div className="alert alert-info" style={{ marginBottom: '0.875rem' }}>
            <MapPin size={13} className="alert-icon" />
            <span style={{ fontSize: '0.8rem' }}>
              Location access is requested only when you manually tap "Verify My Location". No background tracking occurs.
              You can revoke location permission in your browser settings at any time.
            </span>
          </div>
          <SettingRow icon={MapPin} label="How to Manage Location Permission" description="Control location access in browser settings">
            <button className="btn btn-secondary btn-sm" onClick={() => window.open('chrome://settings/content/location', '_blank').catch(() => showToast('Open browser Settings > Privacy > Location to manage permissions.', 'info'))}>
              Browser Settings
            </button>
          </SettingRow>
        </div>
      </div>

      {/* App Info */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div className="card-title"><Info size={15} /> About Tetso Attendance</div>
        </div>
        <div className="card-body">
          {[
            ['Application', 'Tetso Attendance'],
            ['Version', '1.0.0 (Demo)'],
            ['Project Type', 'BCA Group Project'],
            ['College', 'Tetso College, Nagaland, India'],
            ['Technology', 'React + Vite + JavaScript'],
            ['Backend', 'Not connected (frontend demo only)'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card">
        <div className="card-header">
          <div className="card-title" style={{ color: 'var(--color-error)' }}>Account Actions</div>
        </div>
        <div className="card-body">
          <SettingRow icon={RotateCcw} label="Reset Demo Data" description="Restore all sample data to its original state">
            <button id="reset-demo-btn" className="btn btn-secondary btn-sm" onClick={() => setShowResetConfirm(true)}>
              Reset
            </button>
          </SettingRow>
          <SettingRow icon={LogOut} label="Sign Out" description="Return to the login screen">
            <button id="sign-out-btn" className="btn btn-danger btn-sm" onClick={() => setShowSignOutConfirm(true)}>
              Sign Out
            </button>
          </SettingRow>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access the application."
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        variant="danger"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
      <ConfirmationDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data"
        message="This will reset all sample data (notifications, correction requests) to the original state. Your changes in this session will be lost."
        confirmLabel="Reset Now"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
