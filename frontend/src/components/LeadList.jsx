"use client";

import LeadCard from "./LeadCard";

/**
 * Vertical list of LeadCards.
 * @param {{
 *   leads: import('../lib/constants').Lead[],
 *   onSelect?: (lead: import('../lib/constants').Lead) => void,
 *   now?: Date,
 *   emptyMessage?: string
 * }} props
 */
export default function LeadList({ leads, onSelect, now, emptyMessage = "No leads found." }) {
  if (!leads.length) {
    return <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm font-medium text-zinc-700">{emptyMessage}</p>;
  }
  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onSelect={onSelect} now={now} />
      ))}
    </div>
  );
}
