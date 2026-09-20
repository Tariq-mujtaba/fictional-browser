"use client";

import { useCallback, useEffect, useState } from "react";
import { browserApi, type Visit } from "@/lib/browser-api";

type HistoryState =
  | { status: "loading" }
  | { status: "ready"; visits: Visit[] }
  | { status: "error"; message: string };

type HistoryPanelProps = {
  personId: string;
  onNavigate: (address: string) => void;
};

function friendlyError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "History could not be loaded.";
}

function formatVisitTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HistoryPanel({ personId, onNavigate }: HistoryPanelProps) {
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const [reload, setReload] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setReload((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void browserApi
      .getHistory(personId, controller.signal)
      .then((visits) => {
        if (!controller.signal.aborted) {
          setState({ status: "ready", visits });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: "error", message: friendlyError(error) });
        }
      });

    return () => controller.abort();
  }, [personId, reload]);

  return (
    <div className="flex h-full min-h-[32rem] w-full flex-col px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Where you have been
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
          Every arrival is recorded, including repeat visits and paths that led nowhere.
        </p>

        {state.status === "loading" && (
          <div className="my-auto py-14 text-center">
            <div className="mx-auto mb-5 flex w-fit gap-2" aria-hidden="true">
              <span className="loading-dot" />
              <span className="loading-dot [animation-delay:120ms]" />
              <span className="loading-dot [animation-delay:240ms]" />
            </div>
            <p className="font-bold">Opening the travel ledger</p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="my-auto py-14 text-center">
            <h2 className="text-2xl font-black">History could not be opened</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{state.message}</p>
            <button type="button" onClick={retry} className="mt-5 rounded-full border-2 border-[var(--ink)] bg-[var(--signal)] px-5 py-2 font-black">
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.visits.length === 0 && (
          <div className="my-auto py-14 text-center">
            <p className="text-5xl" aria-hidden="true">○</p>
            <h2 className="mt-4 text-2xl font-black">No paths taken yet</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Type an address to make the first entry.
            </p>
          </div>
        )}

        {state.status === "ready" && state.visits.length > 0 && (
          <ol className="mt-8 min-h-0 flex-1 overflow-y-auto border-y-2 border-[var(--ink)] pr-2">
            {state.visits.map((visit, index) => (
              <li key={visit.id} className="grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--canvas)] py-4 last:border-b-0">
                <span className={`mt-1 size-3 rounded-full border-2 border-[var(--ink)] ${visit.outcome === "found" ? "bg-[var(--online)]" : "bg-[var(--signal)]"}`} aria-hidden="true" />
                <button type="button" onClick={() => onNavigate(visit.address)} className="grid min-w-0 gap-1 text-left outline-none focus-visible:shadow-[0_3px_0_var(--focus)] sm:grid-cols-[1fr_auto] sm:gap-5">
                  <span>
                    <span className="block truncate font-black hover:underline">{visit.address}</span>
                    <span className="block text-sm text-[var(--muted)]">
                      Arrived by {visit.method} · {visit.outcome === "found" ? "site found" : "no site"}
                    </span>
                  </span>
                  <time className="text-xs font-bold text-[var(--muted)]" dateTime={visit.visitedAt}>
                    {formatVisitTime(visit.visitedAt)}
                  </time>
                </button>
                {index < state.visits.length - 1 && <span className="ml-[5px] h-3 w-0 border-l-2 border-dotted border-[var(--muted)]" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
