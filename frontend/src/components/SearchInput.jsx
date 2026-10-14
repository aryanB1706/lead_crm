"use client";

import { useEffect, useState } from "react";

/**
 * Search box with 300ms debounce — calls onSearch only after typing pauses.
 * @param {{onSearch: (q: string) => void, placeholder?: string}} props
 */
export default function SearchInput({ onSearch, placeholder = "Search by name…" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const t = setTimeout(() => onSearch(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text, onSearch]);

  return (
    <input
      type="search"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={placeholder}
      aria-label="Search leads by name"
      className="w-full rounded-xl border-2 border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none placeholder:font-normal placeholder:text-zinc-500 focus:border-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    />
  );
}
