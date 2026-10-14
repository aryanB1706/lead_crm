"use client";

import { STATUSES } from "../lib/constants";

/**
 * Chips for All + 6 statuses.
 * @param {{value: string, onChange: (s: string) => void}} props value is "All" or a status
 */
export default function StatusFilter({ value, onChange }) {
  const options = ["All", ...STATUSES];
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
      {options.map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
