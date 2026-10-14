"use client";

import { isOverdue, timeAgo } from "../lib/time";
import StatusBadge from "./StatusBadge";

/**
 * One lead row. Strong red treatment when overdue (never for Won/Lost).
 * @param {{
 *   lead: import('../lib/constants').Lead,
 *   onSelect?: (lead: import('../lib/constants').Lead) => void,
 *   now?: Date
 * }} props
 */
export default function LeadCard({ lead, onSelect, now }) {
  // `now` may be null pre-hydration; helpers default to current time (evaluated outside components).
  const at = now ?? undefined;
  const overdue =
    lead.status !== "Won" &&
    lead.status !== "Lost" &&
    isOverdue(lead.follow_up_at, at);

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(lead)}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
        overdue
          ? "border-zinc-200 border-l-4 border-l-red-500 bg-red-50/40 hover:border-zinc-300 hover:border-l-red-600"
          : "border-zinc-200 hover:border-indigo-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-base font-bold text-zinc-900">
          {lead.name ?? "Unnamed lead"}
          {lead.company ? (
            <span className="ml-1.5 font-medium text-zinc-600">· {lead.company}</span>
          ) : null}
        </p>
        <StatusBadge status={lead.status} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm break-words text-zinc-800">
        {lead.last_note || <span className="text-zinc-600 italic">No discussions yet</span>}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-700">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5">
          {lead.last_discussion_at ? timeAgo(lead.last_discussion_at, at) : "—"}
        </span>
        {lead.follow_up_at ? (
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-900">
            Follow-up {new Date(lead.follow_up_at).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        ) : null}
        {overdue ? (
          <span className="rounded bg-red-600 px-2 py-0.5 font-bold tracking-wide text-white uppercase">
            Overdue
          </span>
        ) : null}
      </div>
    </button>
  );
}
