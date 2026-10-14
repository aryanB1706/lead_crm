"use client";

import { useState } from "react";

/**
 * New note + optional follow-up form. Converts local datetime to UTC ISO.
 * Clears itself on successful submit; shows inline errors.
 * @param {{onSubmit: (body: {note: string, follow_up_at?: string|null}) => Promise<void>, saving: boolean, error: string}} props
 */
export default function DiscussionForm({ onSubmit, saving, error }) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [localError, setLocalError] = useState("");

  const canSubmit = note.trim().length > 0 && !saving;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLocalError("");
    /** @type {{note: string, follow_up_at?: string|null}} */
    const body = { note: note.trim() };
    if (followUp) {
      const asDate = new Date(followUp);
      if (Number.isNaN(asDate.getTime())) {
        setLocalError("Invalid follow-up date.");
        return;
      }
      body.follow_up_at = asDate.toISOString();
    }
    try {
      await onSubmit(body);
      setNote("");
      setFollowUp("");
    } catch (err) {
      setLocalError(err?.message || "Failed to save note");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t-2 border-zinc-200 pt-3">
      <label className="block text-sm font-semibold text-zinc-900">
        <span className="mb-1 block">New note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          required
          placeholder="What was discussed?"
          className="w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        />
      </label>
      <label className="block text-sm font-semibold text-zinc-900">
        <span className="mb-1 block">Follow-up <span className="font-normal text-zinc-600">(optional)</span></span>
        <input
          type="datetime-local"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          className="w-full rounded-lg border-2 border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        />
      </label>
      {localError || error ? (
        <p role="alert" className="text-sm text-red-600">{localError || error}</p>
      ) : null}
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {saving ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
