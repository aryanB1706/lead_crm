"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Shared modal base: backdrop click, Escape, focus trap, scroll lock, aria.
 * @param {{onClose: () => void, label: string, children: React.ReactNode}} props
 */
export default function Modal({ onClose, label, children }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && boxRef.current) {
        const els = boxRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Initial focus into the dialog.
    const t = setTimeout(() => boxRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl outline-none"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
