"use client";

import { isOverdue, timeAgo } from "../lib/time";
import StatusBadge from "./StatusBadge";

/**
 * One lead row. Red highlight when overdue (never for Won/Lost).
 * @param {{lead: import('../lib/constants').Lead, onSelect?: (lead: import('../lib/constants').Lead) => void}} props
 */
export default function LeadCard({ lead, onSelect }) {
  const overdue =
    lead.status !== "Won" &&
    lead.status !== "Lost" &&
    isOverdue(lead.follow_up_at);

  return (
    <button
      type="button"
      onClick={() => onSelect && onSelect(lead)}
      className={`w-full rounded border bg-white px-3 py-2.5 text-left transition-colors hover:border-zinc-400 ${
        overdue ? "border-red-300 bg-red-50" : "border-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">
          {lead.name}
          {lead.company ? (
            <span className="ml-1 font-normal text-zinc-500">· {lead.company}</span>
          ) : null}
        </p>
        <StatusBadge status={lead.status} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
        {lead.last_note || "No discussions yet"}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
        <span>{lead.last_discussion_at ? timeAgo(lead.last_discussion_at) : "—"}</span>
        {overdue ? (
          <span className="rounded bg-red-600 px-1.5 py-0.5 font-medium text-white">
            Overdue
          </span>
        ) : null}
      </div>
    </button>
  );
}
