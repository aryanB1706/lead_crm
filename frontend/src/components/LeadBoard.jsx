"use client";

import { useEffect, useState } from "react";
import { ApiError, getLeads } from "../lib/api";
import { timeAgo } from "../lib/time";

/**
 * Thin verification board for Step 4.
 * Full list / filters / dialogs land in later steps.
 */
export default function LeadBoard() {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getLeads()
      .then((rows) => alive && setLeads(rows))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        API error: {error}
      </p>
    );
  }
  if (!leads) return <p className="text-sm text-zinc-500">Loading leads…</p>;

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-600">
        Connected — {leads.length} lead{leads.length === 1 ? "" : "s"} from{" "}
        <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL}</code>
      </p>
      <ul className="divide-y divide-zinc-100 rounded border border-zinc-200 bg-white">
        {leads.slice(0, 5).map((l) => (
          <li key={l.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="font-medium">{l.name}</span>
            <span className="text-zinc-500">
              {l.status} · {timeAgo(l.last_discussion_at || l.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
