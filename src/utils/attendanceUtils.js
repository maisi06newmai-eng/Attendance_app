// =============================================================
// TETSO ATTENDANCE — Utility Functions
// Pure calculation functions, no UI dependencies.
// =============================================================

// ─── Attendance Calculations ──────────────────────────────────

/**
 * Calculate attendance percentage for a subject.
 * @param {number} attended - Number of classes attended
 * @param {number} total - Total classes conducted
 * @returns {number} Percentage rounded to 2 decimal places, or 0
 */
export function calcAttendancePercent(attended, total) {
  if (!total || total === 0) return 0;
  return Math.round((attended / total) * 10000) / 100;
}

/**
 * Determine attendance status label.
 * @param {number} percent - Current attendance percentage
 * @param {number} minRequired - Minimum required percentage (default 75)
 * @returns {{ label: string, variant: 'success'|'warning'|'error', className: string }}
 */
export function getAttendanceStatus(percent, minRequired = 75) {
  if (percent >= minRequired + 5) {
    return { label: 'Good', variant: 'success', className: 'badge-success' };
  } else if (percent >= minRequired) {
    return { label: 'At Risk', variant: 'warning', className: 'badge-warning' };
  } else {
    return { label: 'Below Requirement', variant: 'error', className: 'badge-error' };
  }
}

/**
 * Count present and absent from attendance record array.
 * @param {Array} records - Array of attendance records for one subject
 * @returns {{ attended: number, absent: number, total: number }}
 */
export function countAttendance(records) {
  const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  return { attended, absent, total: records.length };
}

/**
 * Get subject-wise attendance summary for a student.
 * @param {Array} subjects - Subject list
 * @param {Array} records - All attendance records
 * @param {string} studentId - Student ID
 * @returns {Array} Enriched subject objects with attendance data
 */
export function getSubjectAttendanceSummary(subjects, records, studentId) {
  return subjects.map((subject) => {
    const subjectRecords = records.filter(
      (r) => r.subjectId === subject.id && r.studentId === studentId
    );
    const { attended, absent } = countAttendance(subjectRecords);
    const total = subject.totalClasses;
    const percent = calcAttendancePercent(attended, total);
    const status = getAttendanceStatus(percent, subject.minAttendancePercent);
    return {
      ...subject,
      attended,
      absent,
      totalConducted: total,
      missed: total - attended,
      percent,
      status,
      records: subjectRecords.sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  });
}

/**
 * Calculate overall attendance across all subjects.
 * @param {Array} subjectSummaries - Result of getSubjectAttendanceSummary
 * @returns {{ totalAttended: number, totalClasses: number, overallPercent: number }}
 */
export function getOverallAttendance(subjectSummaries) {
  const totalAttended = subjectSummaries.reduce((sum, s) => sum + s.attended, 0);
  const totalClasses = subjectSummaries.reduce((sum, s) => sum + s.totalConducted, 0);
  const overallPercent = calcAttendancePercent(totalAttended, totalClasses);
  return { totalAttended, totalClasses, overallPercent };
}

// ─── Attendance Risk Predictor ────────────────────────────────

/**
 * Calculate how many consecutive classes must be attended to reach target.
 * Formula: Let current attended = A, total conducted = T, target % = P.
 * We need (A + x) / (T + x) >= P/100, solving for x:
 *   A + x >= P/100 * (T + x)
 *   A + x >= PT/100 + Px/100
 *   x(1 - P/100) >= PT/100 - A
 *   x >= (PT/100 - A) / (1 - P/100)
 *
 * @param {number} attended - Classes attended so far
 * @param {number} totalConducted - Classes conducted so far
 * @param {number} target - Target percentage (e.g. 75)
 * @returns {{ classesNeeded: number, possible: boolean, message: string }}
 */
export function calcClassesNeededToReachTarget(attended, totalConducted, target = 75) {
  const currentPercent = calcAttendancePercent(attended, totalConducted);
  if (currentPercent >= target) {
    return {
      classesNeeded: 0,
      possible: true,
      message: `Already at ${currentPercent.toFixed(1)}% — above the ${target}% target.`,
      currentPercent,
    };
  }

  const p = target / 100;
  // Edge case: if p === 1 (100%), impossible if any absence exists
  if (p >= 1) {
    return {
      classesNeeded: Infinity,
      possible: false,
      message: `Cannot reach 100% once you have any absence.`,
      currentPercent,
    };
  }

  const numerator = p * totalConducted - attended;
  const denominator = 1 - p;
  const classesNeeded = Math.ceil(numerator / denominator);

  if (classesNeeded <= 0) {
    return { classesNeeded: 0, possible: true, message: `Already at target.`, currentPercent };
  }

  return {
    classesNeeded,
    possible: true,
    message: `Must attend the next ${classesNeeded} consecutive class${classesNeeded !== 1 ? 'es' : ''} without absence.`,
    currentPercent,
  };
}

/**
 * Calculate max absences allowed before falling below target.
 * @param {number} attended - Attended so far
 * @param {number} totalConducted - Total classes so far
 * @param {number} remainingClasses - Expected remaining classes in semester
 * @param {number} target - Target percentage
 * @returns {{ maxCanMiss: number, currentPercent: number }}
 */
export function calcMaxCanMiss(attended, totalConducted, remainingClasses = 20, target = 75) {
  const totalExpected = totalConducted + remainingClasses;
  const minAttended = Math.ceil((target / 100) * totalExpected);
  const maxCanMiss = totalExpected - minAttended - (totalConducted - attended);
  return {
    maxCanMiss: Math.max(0, maxCanMiss),
    currentPercent: calcAttendancePercent(attended, totalConducted),
    totalExpected,
    minAttended,
  };
}

/**
 * Simulate attendance if student attends/misses next N classes.
 * @param {number} attended - Current attended
 * @param {number} total - Current total
 * @param {number} futurePresent - Future classes to attend
 * @param {number} futureMiss - Future classes to miss
 * @returns {{ newPercent: number, newAttended: number, newTotal: number }}
 */
export function simulateAttendance(attended, total, futurePresent, futureMiss) {
  const newAttended = attended + futurePresent;
  const newTotal = total + futurePresent + futureMiss;
  const newPercent = calcAttendancePercent(newAttended, newTotal);
  return { newPercent, newAttended, newTotal };
}

// ─── Geographic / Geofence Calculations ──────────────────────

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate distance between two GPS coordinates using Haversine formula.
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in metres
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Determine geofence status.
 * @param {number} distanceMeters - Distance from campus centre
 * @param {number} radiusMeters - Campus radius
 * @param {number} accuracyMeters - GPS accuracy
 * @returns {'within'|'outside'|'uncertain'} Geofence result
 */
export function getGeofenceStatus(distanceMeters, radiusMeters, accuracyMeters = 0) {
  if (accuracyMeters > 200) return 'uncertain'; // too inaccurate
  if (distanceMeters <= radiusMeters) return 'within';
  return 'outside';
}

/**
 * Detect possible attendance mismatch:
 * Returns true when a record says "absent" but location check says "within campus".
 * Note: Campus presence ≠ proof of classroom attendance.
 * @param {string} recordedStatus - 'present' or 'absent'
 * @param {string} geofenceStatus - 'within' or 'outside'
 * @returns {boolean}
 */
export function detectAttendanceMismatch(recordedStatus, geofenceStatus) {
  return recordedStatus === 'absent' && geofenceStatus === 'within';
}

// ─── Date & Time Utilities ────────────────────────────────────

/** Format date as DD Mon YYYY (e.g., "14 Oct 2024") */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format date as short (e.g., "14 Oct") */
export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Format time as HH:MM AM/PM */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Format datetime string as relative time ("2 hours ago", etc.) */
export function formatRelativeTime(dateTimeStr) {
  if (!dateTimeStr) return '—';
  const d = new Date(dateTimeStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateTimeStr);
}

/** Get day name from day number (0=Sun, 1=Mon...) */
export function getDayName(dayNum, short = false) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return short ? shorts[dayNum] : days[dayNum];
}

/** Get month name */
export function getMonthName(monthNum, short = false) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const shorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return short ? shorts[monthNum] : months[monthNum];
}

/** Check if a date string is today */
export function isToday(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/** Get calendar days for a month (including padding for week alignment) */
export function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days = [];
  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, month: month - 1, year, isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, month, year, isCurrentMonth: true });
  }
  // Next month padding to complete grid (6 rows × 7 cols)
  const totalCells = Math.ceil(days.length / 7) * 7;
  let nextDay = 1;
  while (days.length < totalCells) {
    days.push({ day: nextDay++, month: month + 1, year, isCurrentMonth: false });
  }
  return days;
}

/** Format a percentage safely */
export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

// ─── Filtering / Sorting ──────────────────────────────────────

/** Filter records by month and year */
export function filterRecordsByMonth(records, year, month) {
  return records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** Filter records by subject */
export function filterRecordsBySubject(records, subjectId) {
  if (!subjectId || subjectId === 'all') return records;
  return records.filter((r) => r.subjectId === subjectId);
}

/** Filter subjects by status */
export function filterSubjectsByStatus(subjects, status) {
  if (!status || status === 'all') return subjects;
  return subjects.filter((s) => s.status.variant === status);
}

/** Sort subjects */
export function sortSubjects(subjects, sortBy) {
  const sorted = [...subjects];
  switch (sortBy) {
    case 'percent_asc': return sorted.sort((a, b) => a.percent - b.percent);
    case 'percent_desc': return sorted.sort((a, b) => b.percent - a.percent);
    case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
    default: return sorted;
  }
}

/** Search subjects by name or code */
export function searchSubjects(subjects, query) {
  if (!query) return subjects;
  const q = query.toLowerCase();
  return subjects.filter(
    (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
  );
}

// ─── Greeting ─────────────────────────────────────────────────
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Initials from name ───────────────────────────────────────
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Period label ─────────────────────────────────────────────
export function getPeriodLabel(period) {
  const labels = { 1: '1st Period', 2: '2nd Period', 3: '3rd Period', 4: '4th Period', 5: '5th Period' };
  return labels[period] || `Period ${period}`;
}

// ─── Status badge config ──────────────────────────────────────
export function getCorrectionStatusConfig(status) {
  const configs = {
    pending: { label: 'Pending', className: 'badge-warning', color: 'var(--color-warning)' },
    under_review: { label: 'Under Review', className: 'badge-info', color: 'var(--color-info)' },
    approved: { label: 'Approved', className: 'badge-success', color: 'var(--color-success)' },
    rejected: { label: 'Rejected', className: 'badge-error', color: 'var(--color-error)' },
  };
  return configs[status] || configs.pending;
}

export function getNotificationIcon(type) {
  const icons = {
    attendance_marked_present: '✅',
    attendance_marked_absent: '❌',
    attendance_warning: '⚠️',
    correction_submitted: '📝',
    correction_approved: '✅',
    correction_rejected: '❌',
    mismatch_detected: '📍',
    announcement: '📣',
    upcoming_class: '🔔',
  };
  return icons[type] || '🔔';
}
