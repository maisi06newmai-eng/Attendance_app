// =============================================================
// TETSO ATTENDANCE — App Context
// Global state management using React Context + useReducer
// =============================================================
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  DEMO_ACCOUNTS,
  INITIAL_CORRECTION_REQUESTS,
  INITIAL_NOTIFICATIONS,
  ATTENDANCE_RECORDS,
} from '../data/sampleData';

const AppContext = createContext(null);

// ─── Initial State ────────────────────────────────────────────
const initialState = {
  user: null,
  role: null,
  isAuthenticated: false,
  theme: 'light',
  notifications: INITIAL_NOTIFICATIONS,
  correctionRequests: INITIAL_CORRECTION_REQUESTS,
  attendanceRecords: ATTENDANCE_RECORDS,
  sidebarOpen: false,
  toast: null,
};

// ─── Reducer ──────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.user.role,
        isAuthenticated: true,
      };

    case 'LOGOUT':
      return { ...initialState, theme: state.theme };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'SUBMIT_CORRECTION':
      return {
        ...state,
        correctionRequests: [action.payload, ...state.correctionRequests],
        notifications: [
          {
            id: `N${Date.now()}`,
            studentId: action.payload.studentId,
            type: 'correction_submitted',
            title: 'Correction Request Submitted',
            message: `Your correction request for ${action.payload.subjectName} on ${action.payload.date} has been submitted.`,
            subjectId: action.payload.subjectId,
            date: new Date().toISOString().split('T')[0],
            read: false,
            createdAt: new Date().toISOString(),
            link: '/corrections',
          },
          ...state.notifications,
        ],
      };

    case 'UPDATE_CORRECTION_STATUS': {
      const { id, status, teacherComment, reviewedBy } = action.payload;
      return {
        ...state,
        correctionRequests: state.correctionRequests.map((r) =>
          r.id === id
            ? { ...r, status, teacherComment, reviewedBy, reviewedAt: new Date().toISOString() }
            : r
        ),
        notifications: [
          {
            id: `N${Date.now()}`,
            studentId: 'S001',
            type: status === 'approved' ? 'correction_approved' : 'correction_rejected',
            title: status === 'approved' ? 'Correction Request Approved' : 'Correction Request Rejected',
            message: `Your correction request has been ${status} by ${reviewedBy}.`,
            subjectId: null,
            date: new Date().toISOString().split('T')[0],
            read: false,
            createdAt: new Date().toISOString(),
            link: '/corrections',
          },
          ...state.notifications,
        ],
      };
    }

    case 'UPDATE_ATTENDANCE_RECORD': {
      const { subjectId, studentId, date, period, status, markedBy } = action.payload;
      const existing = state.attendanceRecords.findIndex(
        (r) => r.subjectId === subjectId && r.studentId === studentId && r.date === date && r.period === period
      );
      if (existing >= 0) {
        const updated = [...state.attendanceRecords];
        updated[existing] = { ...updated[existing], status, markedBy, markedAt: new Date().toISOString() };
        return { ...state, attendanceRecords: updated };
      }
      return {
        ...state,
        attendanceRecords: [
          ...state.attendanceRecords,
          { id: `${subjectId}-${studentId}-${Date.now()}`, subjectId, studentId, date, period, status, markedBy, markedAt: new Date().toISOString() },
        ],
      };
    }

    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'RESET_DEMO_DATA':
      return { ...initialState, theme: state.theme, user: state.user, role: state.role, isAuthenticated: state.isAuthenticated };

    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (init) => {
    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('tetso_theme') || 'light';
    return { ...init, theme: savedTheme };
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('tetso_theme', state.theme);
  }, [state.theme]);

  // Auto-dismiss toast
  useEffect(() => {
    if (state.toast) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  const showToast = (message, type = 'info', title = '') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type, title, id: Date.now() } });
  };

  const login = (email, password, role) => {
    const accounts = DEMO_ACCOUNTS[role] || [];
    const user = accounts.find(
      (a) => (a.email === email || a.rollNo === email || a.id === email) && a.password === password
    );
    if (user) {
      dispatch({ type: 'LOGIN', payload: { user } });
      return { success: true, user };
    }
    return { success: false, error: 'Invalid credentials. Use the demo accounts shown below.' };
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const unreadCount = state.notifications.filter((n) => !n.read && (!state.user || n.studentId === state.user?.id || !n.studentId)).length;

  return (
    <AppContext.Provider value={{ state, dispatch, showToast, login, logout, unreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
