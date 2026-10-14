"use client";

/**
 * Tiny toast: success (role=status) or error (role=alert). Auto-dismiss handled by parent.
 * @param {{toast: {message: string, kind: string}|null, onDismiss: () => void}} props
 */
export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.kind === "error";
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
      <div
        role={isError ? "alert" : "status"}
        className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 text-sm font-semibold shadow-lg"
      >
        <span
          aria-hidden="true"
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${isError ? "bg-red-500" : "bg-emerald-500"}`}
        />
        <span className={`break-words ${isError ? "text-red-900" : "text-zinc-900"}`}>{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 rounded px-1 leading-none font-bold text-zinc-600 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
