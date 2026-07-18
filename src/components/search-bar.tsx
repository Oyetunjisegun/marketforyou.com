"use client";

import { Search, Sparkles, Mic, Camera, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSearchSuggestions } from "@/lib/api";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion fetch. This is the seam for AI-powered autocomplete.
  useEffect(() => {
    if (!q.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setSuggestions(await getSearchSuggestions(q));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(value: string) {
    const term = value.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      submit(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className ?? ""}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="h-4.5 w-4.5 shrink-0 text-muted" style={{ width: 18, height: 18 }} />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for anything…"
          role="combobox"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={open}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search">
            <X className="h-4 w-4 text-muted hover:text-foreground" />
          </button>
        )}
        <span className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            aria-label="Voice search"
            title="Voice search (coming soon)"
            className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-primary"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Image search"
            title="Image search (coming soon)"
            className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-primary"
          >
            <Camera className="h-4 w-4" />
          </button>
        </span>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          role="listbox"
        >
          <li className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI suggestions
          </li>
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button
                type="button"
                onClick={() => submit(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                  i === active ? "bg-surface-2 text-primary" : "text-foreground"
                }`}
              >
                <Search className="h-4 w-4 text-muted" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
