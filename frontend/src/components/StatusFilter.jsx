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
            className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              active
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                : "border-zinc-300 bg-white text-zinc-800 hover:border-indigo-400 hover:text-indigo-700"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
