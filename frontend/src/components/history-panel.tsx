"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { browserApi, type Visit } from "@/lib/browser-api";
import { LoadingOrbit, StateOrb, panelCopyClass, panelHeadingClass, secondaryButtonClass } from "./ui-primitives";

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
          toast.error("History could not be loaded", {
            description: friendlyError(error),
          });
        }
      });

    return () => controller.abort();
  }, [personId, reload]);

  return (
    <div className="flex h-full min-h-[32rem] w-full flex-col px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        <h1 className={panelHeadingClass}>
          Where you have been
        </h1>
        <p className={`${panelCopyClass} mt-3`}>
          Every arrival is recorded, including repeat visits and paths that led nowhere.
        </p>

        {state.status === "loading" && (
          <div className="my-auto py-14 text-center">
            <div className="mb-5"><LoadingOrbit /></div>
            <p className="text-sm font-semibold">Opening the travel ledger</p>
          </div>
        )}

        {state.status === "error" && (
          <div role="alert" className="my-auto py-14 text-center">
            <StateOrb danger>!</StateOrb>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">History could not be opened</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{state.message}</p>
            <button type="button" onClick={retry} className={`${secondaryButtonClass} mt-5`}>
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.visits.length === 0 && (
          <div className="my-auto py-14 text-center">
            <StateOrb>○</StateOrb>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">No paths taken yet</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Type an address to make the first entry.
            </p>
          </div>
        )}

        {state.status === "ready" && state.visits.length > 0 && (
          <ol className="mt-8 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--line)] bg-white px-5">
            {state.visits.map((visit, index) => (
              <li key={visit.id} className="grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--line)] py-4 last:border-b-0">
                <span className={`mt-1 size-2.5 rounded-full ring-3 ${visit.outcome === "found" ? "bg-[var(--online)] ring-emerald-50" : "bg-[var(--warning)] ring-amber-50"}`} aria-hidden="true" />
                <button type="button" onClick={() => onNavigate(visit.address)} className="grid min-w-0 gap-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-[rgb(103_92_245_/_18%)] sm:grid-cols-[1fr_auto] sm:gap-5">
                  <span>
                    <span className="block truncate text-sm font-semibold hover:text-[var(--accent-deep)]">{visit.address}</span>
                    <span className="block text-sm text-[var(--muted)]">
                      Arrived by {visit.method} · {visit.outcome === "found" ? "site found" : "no site"}
                    </span>
                  </span>
                  <time className="text-xs font-medium text-[var(--muted)]" dateTime={visit.visitedAt}>
                    {formatVisitTime(visit.visitedAt)}
                  </time>
                </button>
                {index < state.visits.length - 1 && <span className="ml-[4px] h-3 w-px bg-[var(--line-strong)]" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
