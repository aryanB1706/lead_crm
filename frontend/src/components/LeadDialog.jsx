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
 *   onLeadUpdated: (lead: import('../lib/constants').Lead) => void
 * }} props
 */
export default function LeadDialog({ lead, onClose, onLeadUpdated }) {
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
    } catch (e) {
      // Roll back on failure.
      setLive(prev);
      onLeadUpdated(prev);
      setStatusError(e?.message || "Failed to update status");
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
    } catch (e) {
      const msg = e?.message || "Failed to save note";
      setNoteError(msg);
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
    } catch (e) {
      setStatusError(e?.message || "Failed to clear follow-up");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Modal onClose={onClose} label={`Lead: ${live.name}`}>
      <div className="flex max-h-[90vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4">
          <div>
            <h2 className="text-lg font-semibold">{live.name}</h2>
            <p className="text-sm text-zinc-500">
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
              <p className="mt-2 text-sm text-zinc-600">
                Follow-up: {new Date(live.follow_up_at).toLocaleString()}{" "}
                <button
                  type="button"
                  onClick={handleClearFollowUp}
                  disabled={clearing}
                  className="ml-1 underline disabled:opacity-50"
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
            className="rounded px-2 py-1 text-xl leading-none hover:bg-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <DiscussionTimeline discussions={discussions} loading={discLoading} />
          {discussions === null && !discLoading ? (
            <p role="alert" className="text-sm text-red-600">
              Failed to load discussions.{" "}
              <button type="button" className="underline" onClick={loadDiscussions}>
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
