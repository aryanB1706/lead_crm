/**
 * Time helpers for LeadFlow. Pure functions using the user's local timezone.
 * All API datetimes are ISO 8601 UTC strings (with Z).
 */

/**
 * "time ago" label for an ISO datetime, e.g. "just now", "5m ago", "3h ago", "2d ago".
 * Returns "—" for null/undefined/invalid.
 * @param {string|null|undefined} iso
 * @param {Date} [now]
 * @returns {string}
 */
export function timeAgo(iso, now = new Date()) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const s = Math.max(0, Math.floor((now - d) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * True if the ISO datetime falls on today's calendar date in local timezone.
 * @param {string|null|undefined} iso
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isToday(iso, now = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * True if the ISO datetime is before the start of today (local timezone).
 * Null/invalid => false (no follow-up means not overdue).
 * @param {string|null|undefined} iso
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isOverdue(iso, now = new Date()) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return d < start;
}
