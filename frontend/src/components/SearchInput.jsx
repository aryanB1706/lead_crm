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
      className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
    />
  );
}
