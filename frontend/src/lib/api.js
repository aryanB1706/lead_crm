/**
 * API client for LeadFlow. One module for all fetch calls.
 * Uses snake_case field names exactly as the backend returns them.
 * @typedef {import('./constants').Lead} Lead
 * @typedef {import('./constants').Discussion} Discussion
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Error carrying HTTP status + backend {"detail"} message. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   */
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  /** @type {any} */
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg =
      data && typeof data.detail === "string"
        ? data.detail
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data;
}

/**
 * List leads with computed last_note / last_discussion_at.
 * @param {{status?: string, search?: string}} [params]
 * @returns {Promise<Lead[]>}
 */
export function getLeads({ status, search } = {}) {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (search) q.set("search", search);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return request(`/api/leads${qs}`);
}

/**
 * @param {{name: string, company?: string|null, phone?: string|null}} body
 * @returns {Promise<Lead>}
 */
export function createLead(body) {
  return request("/api/leads", { method: "POST", body: JSON.stringify(body) });
}

/**
 * @param {number} id
 * @param {{status?: string, name?: string, company?: string|null, phone?: string|null, follow_up_at?: string|null}} body
 * @returns {Promise<Lead>}
 */
export function updateLead(id, body) {
  return request(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * @param {number} leadId
 * @returns {Promise<Discussion[]>}
 */
export function getDiscussions(leadId) {
  return request(`/api/leads/${leadId}/discussions`);
}

/**
 * @param {number} leadId
 * @param {{note: string, follow_up_at?: string|null}} body
 * @returns {Promise<Discussion>}
 */
export function addDiscussion(leadId, body) {
  return request(`/api/leads/${leadId}/discussions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
