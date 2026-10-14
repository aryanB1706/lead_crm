"use client";

/**
 * Newest-first discussion history with loading + empty states.
 * @param {{discussions: import('../lib/constants').Discussion[]|null, loading: boolean}} props
 */
export default function DiscussionTimeline({ discussions, loading }) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading discussions">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded border border-zinc-200 bg-zinc-100" />
        ))}
      </div>
    );
  }
  if (!discussions || !discussions.length) {
    return <p className="rounded border border-dashed p-4 text-center text-sm font-medium text-zinc-600">No discussions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {discussions.map((d) => (
        <li key={d.id} className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5">
          <p className="text-sm font-normal break-words whitespace-pre-wrap text-zinc-900">{d.note}</p>
          <p className="mt-1 text-xs font-medium text-zinc-700">
            {new Date(d.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
