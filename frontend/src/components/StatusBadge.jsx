import { STATUS_COLORS } from "../lib/constants";

/**
 * Colored status pill.
 * @param {{status: string}} props
 */
export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "border-zinc-300 bg-zinc-100 text-zinc-900";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${color}`}
    >
      {status}
    </span>
  );
}
