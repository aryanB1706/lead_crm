import { STATUS_COLORS } from "../lib/constants";

/**
 * Colored status pill.
 * @param {{status: string}} props
 */
export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
