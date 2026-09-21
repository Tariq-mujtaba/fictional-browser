"use client";

import { type FormEvent, useState } from "react";
import type { SearchResult } from "@/lib/browser-api";
import { LoadingOrbit, StateOrb, fieldControlClass, panelCopyClass, panelHeadingClass, primaryButtonClass } from "./ui-primitives";

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "ready"; query: string; results: SearchResult[] }
  | { status: "error"; query: string; message: string };

type SearchPanelProps = {
  state: SearchState;
  onSearch: (query: string) => void;
  onOpen: (address: string) => void;
};

export function SearchPanel({ state, onSearch, onOpen }: SearchPanelProps) {
  const [query, setQuery] = useState(state.status === "idle" ? "" : state.query);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query);
  }

  return (
    <div className="flex h-full min-h-[32rem] w-full flex-col px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <h1 className={panelHeadingClass}>
          Search the written web
        </h1>
        <p className={`${panelCopyClass} mt-3`}>
          Search page titles and the words written inside every published site.
        </p>

        <form className="mt-8 flex max-w-3xl gap-2" onSubmit={submit}>
          <label htmlFor="web-search" className="sr-only">
            Search query
          </label>
          <input
            id="web-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={state.status === "loading"}
            autoFocus
            placeholder="Try lanterns, weather, or gardens"
            className={`${fieldControlClass} min-w-0 flex-1 px-4 py-3 text-sm font-medium`}
          />
          <button
            type="submit"
            disabled={state.status === "loading" || query.trim() === ""}
            className={`${primaryButtonClass} px-6`}
          >
            Search
          </button>
        </form>

        {state.status === "idle" && (
          <div className="my-auto py-14 text-center text-[var(--muted)]">
            <StateOrb>⌕</StateOrb>
            <p className="mt-5 text-sm font-semibold">The index is ready when you are.</p>
          </div>
        )}

        {state.status === "loading" && (
          <div className="my-auto py-14 text-center">
            <div className="mb-5"><LoadingOrbit /></div>
            <p className="text-sm font-semibold">Reading every page for “{state.query}”</p>
          </div>
        )}

        {state.status === "ready" && state.results.length === 0 && (
          <div className="my-auto py-14 text-center">
            <StateOrb>∅</StateOrb>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">No pages mention that</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try a broader word or a different spelling.
            </p>
          </div>
        )}

        {state.status === "ready" && state.results.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold text-[var(--muted)]">
              {state.results.length} {state.results.length === 1 ? "page" : "pages"} found
            </p>
            <ol className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
              {state.results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(result.address)}
                    className="group grid w-full gap-1 px-5 py-4 text-left outline-none transition-colors hover:bg-[#f8f9fc] focus-visible:bg-[var(--accent-soft)] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-5"
                  >
                    <span>
                      <span className="block text-base font-semibold tracking-[-0.018em] group-hover:text-[var(--accent-deep)]">
                        {result.title}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        Written by {result.author.name}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-[var(--accent-deep)]">
                      {result.address}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
