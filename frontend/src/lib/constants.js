/**
 * Shared constants + data shapes for LeadFlow.
 * Single place for statuses, colors, and JSDoc typedefs (snake_case everywhere).
 */

/**
 * @typedef {Object} Lead
 * @property {number} id
 * @property {string} name
 * @property {string|null} [company]
 * @property {string|null} [phone]
 * @property {string} status - one of STATUSES
 * @property {string|null} [follow_up_at] - ISO 8601 UTC (Z), nullable
 * @property {string} created_at - ISO 8601 UTC (Z)
 * @property {string} updated_at - ISO 8601 UTC (Z)
 * @property {string|null} [last_note]
 * @property {string|null} [last_discussion_at] - ISO 8601 UTC (Z), nullable
 */

/**
 * @typedef {Object} Discussion
 * @property {number} id
 * @property {number} lead_id
 * @property {string} note
 * @property {string} created_at - ISO 8601 UTC (Z)
 */

/** @type {string[]} Six statuses in canonical order. */
export const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

/**
 * Badge colors per status (Tailwind classes).
 * @type {Object<string, string>}
 */
export const STATUS_COLORS = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-100 text-blue-700",
  Qualified: "bg-amber-100 text-amber-800",
  "Proposal Sent": "bg-purple-100 text-purple-700",
  Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};
