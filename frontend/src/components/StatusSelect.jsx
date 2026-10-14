"use client";

import { STATUSES } from "../lib/constants";

/**
 * Status dropdown with saving state.
 * @param {{value: string, onChange: (s: string) => void, disabled?: boolean, saving?: boolean}} props
 */
export default function StatusSelect({ value, onChange, disabled, saving }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
      <span>Status</span>
      <select
        value={value}
        disabled={disabled || saving}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Lead status"
        className="rounded-lg border-2 border-zinc-300 bg-white px-2 py-1 text-sm font-semibold text-zinc-900 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {saving ? <span className="text-xs font-medium text-indigo-700">Saving…</span> : null}
    </label>
  );
}
