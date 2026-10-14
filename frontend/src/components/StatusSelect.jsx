"use client";

import { STATUSES } from "../lib/constants";

/**
 * Status dropdown with saving state.
 * @param {{value: string, onChange: (s: string) => void, disabled?: boolean, saving?: boolean}} props
 */
export default function StatusSelect({ value, onChange, disabled, saving }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">Status</span>
      <select
        value={value}
        disabled={disabled || saving}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Lead status"
        className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {saving ? <span className="text-xs text-zinc-500">Saving…</span> : null}
    </label>
  );
}
