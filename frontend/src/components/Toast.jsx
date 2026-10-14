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
        className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded px-3 py-2 text-sm shadow-lg ${
          isError ? "bg-red-600 text-white" : "bg-zinc-900 text-white"
        }`}
      >
        <span className="break-words">{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 rounded px-1 leading-none hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
