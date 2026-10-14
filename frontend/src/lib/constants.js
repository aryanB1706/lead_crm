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
 * Badge colors per status — high-contrast pairs with matching borders.
 * @type {Object<string, string>}
 */
export const STATUS_COLORS = {
  New: "border-sky-300 bg-sky-100 text-sky-900",
  Contacted: "border-blue-300 bg-blue-100 text-blue-900",
  Qualified: "border-amber-400 bg-amber-200 text-amber-950",
  "Proposal Sent": "border-violet-300 bg-violet-100 text-violet-900",
  Won: "border-emerald-300 bg-emerald-100 text-emerald-900",
  Lost: "border-rose-300 bg-rose-100 text-rose-900",
};
