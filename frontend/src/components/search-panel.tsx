"use client";

import { type FormEvent, useState } from "react";
import type { SearchResult } from "@/lib/browser-api";

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
    <div className="flex h-full min-h-[32rem] w-full flex-col px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Search the written web
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
          Search page titles and the words written inside every published site.
        </p>

        <form className="mt-8 flex" onSubmit={submit}>
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
            className="min-w-0 flex-1 rounded-l-full border-2 border-r-0 border-[var(--ink)] bg-white px-5 py-3 text-base font-bold outline-none placeholder:font-normal placeholder:text-[var(--muted)] focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={state.status === "loading" || query.trim() === ""}
            className="rounded-r-full border-2 border-[var(--ink)] bg-[var(--signal)] px-6 font-black outline-none focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {state.status === "idle" && (
          <div className="my-auto py-14 text-center text-[var(--muted)]">
            <p className="text-5xl" aria-hidden="true">⌕</p>
            <p className="mt-3 font-bold">The index is ready when you are.</p>
          </div>
        )}

        {state.status === "loading" && (
          <div className="my-auto py-14 text-center">
            <div className="mx-auto mb-5 flex w-fit gap-2" aria-hidden="true">
              <span className="loading-dot" />
              <span className="loading-dot [animation-delay:120ms]" />
              <span className="loading-dot [animation-delay:240ms]" />
            </div>
            <p className="font-bold">Reading every page for “{state.query}”</p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="mt-8 border-l-4 border-[var(--coral)] bg-red-50 px-5 py-4">
            <p className="font-black">Search did not finish</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{state.message}</p>
          </div>
        )}

        {state.status === "ready" && state.results.length === 0 && (
          <div className="my-auto py-14 text-center">
            <p className="text-5xl" aria-hidden="true">∅</p>
            <h2 className="mt-4 text-2xl font-black">No pages mention that</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try a broader word or a different spelling.
            </p>
          </div>
        )}

        {state.status === "ready" && state.results.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-bold text-[var(--muted)]">
              {state.results.length} {state.results.length === 1 ? "page" : "pages"} found
            </p>
            <ol className="divide-y-2 divide-[var(--ink)] border-y-2 border-[var(--ink)]">
              {state.results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(result.address)}
                    className="group grid w-full gap-1 px-2 py-5 text-left outline-none transition-colors hover:bg-[var(--chrome)] focus-visible:bg-[var(--signal)] sm:grid-cols-[1fr_auto] sm:items-end sm:gap-5"
                  >
                    <span>
                      <span className="block text-xl font-black tracking-[-0.02em] group-hover:underline">
                        {result.title}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--muted)]">
                        Written by {result.author.name}
                      </span>
                    </span>
                    <span className="text-sm font-black text-[var(--coral)]">
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
