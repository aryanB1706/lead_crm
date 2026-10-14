"use client";

import { useCallback, useEffect, useState } from "react";
import { addDiscussion, getDiscussions, updateLead } from "../lib/api";
import DiscussionForm from "./DiscussionForm";
import DiscussionTimeline from "./DiscussionTimeline";
import Modal from "./Modal";
import StatusSelect from "./StatusSelect";

/**
 * Lead timeline dialog: header status, history, note form. No page reload.
 * @param {{
 *   lead: import('../lib/constants').Lead,
 *   onClose: () => void,
 *   onLeadUpdated: (lead: import('../lib/constants').Lead) => void,
 *   onNotify?: (message: string, kind?: string) => void
 * }} props
 */
export default function LeadDialog({ lead, onClose, onLeadUpdated, onNotify = () => {} }) {
  const [live, setLive] = useState(lead);
  const [discussions, setDiscussions] = useState(null);
  const [discLoading, setDiscLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [clearing, setClearing] = useState(false);

  const loadDiscussions = useCallback(() => {
    let alive = true;
    setDiscLoading(true);
    getDiscussions(lead.id)
      .then((rows) => alive && setDiscussions(rows))
      .catch(() => alive && setDiscussions(null))
      .finally(() => alive && setDiscLoading(false));
    return () => {
      alive = false;
    };
  }, [lead.id]);

  // Fetch history on open is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loading discussion history
  useEffect(() => loadDiscussions(), [loadDiscussions]);

  async function handleStatus(next) {
    if (next === live.status || statusSaving) return;
    const prev = live;
    setStatusError("");
    setStatusSaving(true);
    // Optimistic: reflect immediately.
    const optimistic = { ...live, status: next };
    setLive(optimistic);
    onLeadUpdated(optimistic);
    try {
      const updated = await updateLead(lead.id, { status: next });
      setLive(updated);
      onLeadUpdated(updated);
      onNotify(`Status updated to ${next}`);
    } catch (e) {
      // Roll back on failure.
      setLive(prev);
      onLeadUpdated(prev);
      const msg = e?.message || "Failed to update status";
      setStatusError(msg);
      onNotify(msg, "error");
    } finally {
      setStatusSaving(false);
    }
  }

  /** @param {{note: string, follow_up_at?: string|null}} body */
  async function handleAddNote(body) {
    setNoteSaving(true);
    setNoteError("");
    try {
      const created = await addDiscussion(lead.id, body);
      setDiscussions((prev) => (prev ? [created, ...prev] : [created]));
      // Update list immediately without reload.
      const updated = {
        ...live,
        follow_up_at: body.follow_up_at ?? live.follow_up_at,
        last_note: created.note,
        last_discussion_at: created.created_at,
      };
      setLive(updated);
      onLeadUpdated(updated);
      onNotify("Note added");
    } catch (e) {
      const msg = e?.message || "Failed to save note";
      setNoteError(msg);
      onNotify(msg, "error");
      throw e;
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleClearFollowUp() {
    if (clearing) return;
    setClearing(true);
    setStatusError("");
    try {
      const updated = await updateLead(lead.id, { follow_up_at: null });
      setLive(updated);
      onLeadUpdated(updated);
      onNotify("Follow-up cleared");
    } catch (e) {
      const msg = e?.message || "Failed to clear follow-up";
      setStatusError(msg);
      onNotify(msg, "error");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Modal onClose={onClose} label={`Lead: ${live.name}`}>
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b-2 border-zinc-200 bg-indigo-50/60 p-4">
          <div className="min-w-0">
            <h2 className="break-words text-xl font-extrabold text-zinc-900">{live.name ?? "Unnamed lead"}</h2>
            <p className="text-sm font-medium text-zinc-700">
              {[live.company, live.phone].filter(Boolean).join(" · ") || "—"}
            </p>
            <div className="mt-2">
              <StatusSelect
                value={live.status}
                onChange={handleStatus}
                saving={statusSaving}
              />
            </div>
            {statusError ? (
              <p role="alert" className="mt-1 text-sm text-red-600">{statusError}</p>
            ) : null}
            {live.follow_up_at ? (
              <p className="mt-2 rounded-lg bg-sky-100 px-2 py-1 text-sm font-semibold text-sky-900">
                Follow-up: {new Date(live.follow_up_at).toLocaleString()}{" "}
                <button
                  type="button"
                  onClick={handleClearFollowUp}
                  disabled={clearing}
                  className="ml-1 font-semibold underline disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  {clearing ? "Clearing…" : "Clear"}
                </button>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-lg px-2 py-1 text-xl leading-none font-bold text-zinc-700 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <DiscussionTimeline discussions={discussions} loading={discLoading} />
          {discussions === null && !discLoading ? (
            <p role="alert" className="text-sm text-red-600">
              Failed to load discussions.{" "}
              <button type="button" className="font-semibold underline focus-visible:outline-2 focus-visible:outline-indigo-600" onClick={loadDiscussions}>
                Retry
              </button>
            </p>
          ) : null}
        </div>

        <div className="p-4 pt-0">
          <DiscussionForm onSubmit={handleAddNote} saving={noteSaving} error={noteError} />
        </div>
      </div>
    </Modal>
  );
}
