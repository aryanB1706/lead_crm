"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLeads } from "../lib/api";
import { isToday } from "../lib/time";
import AddLeadDialog from "./AddLeadDialog";
import LeadCard from "./LeadCard";
import LeadDialog from "./LeadDialog";
import LeadList from "./LeadList";
import SearchInput from "./SearchInput";
import StatusFilter from "./StatusFilter";
import Toast from "./Toast";

/**
 * Board state + data fetching. Pinned today's follow-ups on top (no duplicates below).
 * Time labels re-evaluate every minute so midnight/timezone rollover stays correct.
 */
export default function LeadBoard() {
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  // Null until mounted (prerender-safe); helpers fall back to current time.
  const [now, setNow] = useState(null);
  const [toast, setToast] = useState(null);

  const onSearch = useCallback((q) => setSearch(q), []);

  const notify = useCallback((message, kind = "success") => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  // Set clock on mount, then re-render every minute so labels stay fresh.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialize client clock after mount (prerender-safe)
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLeadCreated = useCallback(
    (created) => {
      // Insert immediately, respecting the active filter/search.
      const statusOk = status === "All" || created.status === status;
      const searchOk =
        !search || (created.name ?? "").toLowerCase().includes(search.toLowerCase());
      if (statusOk && searchOk) {
        setLeads((prev) => (prev ? [created, ...prev] : [created]));
      }
      notify(`Lead "${created.name}" created`);
      // Open its timeline.
      setSelected(created);
    },
    [status, search, notify]
  );

  const handleLeadUpdated = useCallback((updated) => {
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === updated.id ? updated : l)) : prev
    );
    setSelected((prev) => (prev && prev.id === updated.id ? updated : prev));
  }, []);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getLeads({
      status: status !== "All" ? status : undefined,
      search: search || undefined,
    })
      .then((rows) => alive && setLeads(rows))
      .catch((e) => alive && setError(e?.message || "Failed to load leads"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status, search]);

  // Data fetching on filter/search/retry change is intentional here.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching leads from API
  useEffect(() => load(), [load, retryKey]);

  const { pinned, rest } = useMemo(() => {
    if (!leads) return { pinned: [], rest: [] };
    const at = now ?? undefined;
    const pin = leads
      .filter((l) => isToday(l.follow_up_at, at))
      .sort((a, b) => new Date(a.follow_up_at) - new Date(b.follow_up_at));
    const ids = new Set(pin.map((l) => l.id));
    return { pinned: pin, rest: leads.filter((l) => !ids.has(l.id)) };
  }, [leads, now]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">LeadFlow</h1>
          <p className="text-xs font-medium text-zinc-600">
            {leads ? `${leads.length} lead${leads.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          + Add lead
        </button>
      </div>
      <div className="space-y-2">
        <StatusFilter value={status} onChange={setStatus} />
        <SearchInput onSearch={onSearch} />
      </div>

      {loading && !leads ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading leads">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
          ))}
        </div>
      ) : error && !leads ? (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm">
          <p className="font-semibold text-red-800">Failed to load leads: {error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="mt-2 rounded bg-indigo-600 px-3 py-1.5 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <section aria-label="Today's follow-ups">
              <h2 className="mb-2 text-sm font-extrabold tracking-wide text-amber-900 uppercase">
                ● Today&apos;s follow-ups ({pinned.length})
              </h2>
              <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5">
                {pinned.map((l) => (
                  <div key={l.id}>
                    <LeadCard lead={l} onSelect={setSelected} now={now} />
                    <p className="mt-1 px-1 text-xs text-zinc-600">
                      Follow-up at{" "}
                      {new Date(l.follow_up_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section aria-label="All leads" className={loading ? "opacity-60" : ""}>
            <LeadList
              leads={rest}
              onSelect={setSelected}
              now={now}
              emptyMessage={
                leads && leads.length === 0
                  ? "No leads yet. Add your first lead."
                  : "No leads match your filters."
              }
            />
          </section>
        </>
      )}

      {selected ? (
        <LeadDialog
          key={selected.id}
          lead={selected}
          onClose={() => setSelected(null)}
          onLeadUpdated={handleLeadUpdated}
          onNotify={notify}
        />
      ) : null}

      {showAdd ? (
        <AddLeadDialog
          onClose={() => setShowAdd(false)}
          onCreated={handleLeadCreated}
        />
      ) : null}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
