"use client";

import {
  type FormEvent,
  type SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  browserApi,
  type ArrivalMethod,
  type BrowseResult,
  type Person,
  type SearchResult,
} from "@/lib/browser-api";
import { parseFictionalAddress } from "@/lib/fictional-address";
import {
  hydrateBrowserSession,
  selectCanGoBack,
  selectCanGoForward,
  useBrowserStore,
  type NavigationDirection,
} from "@/stores/browser-store";
import { HistoryPanel } from "./history-panel";
import { PublishPanel } from "./publish-panel";
import { SearchPanel, type SearchState } from "./search-panel";
import { SiteFrame } from "./site-frame";
import { LoadingOrbit, StateOrb } from "./ui-primitives";

type LoadStatus = "loading" | "ready" | "error";

type BrowserView =
  | { kind: "welcome" }
  | { kind: "loading"; address: string }
  | { kind: "site"; result: Extract<BrowseResult, { outcome: "found" }> }
  | { kind: "not_found"; address: string }
  | { kind: "error"; message: string }
  | { kind: "search"; state: SearchState }
  | { kind: "history" }
  | { kind: "publish" };

type NavigationResolution =
  | { type: "browse"; result: BrowseResult }
  | { type: "search"; query: string; results: SearchResult[] };

function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="2" />
      <path d="m15 15 5 5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 8H2V5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 8a9 9 0 1 1-.4 7M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function PublishIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="2" />
      <path d="M5 13v7h14v-7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function NetworkMap() {
  return (
    <svg
      className="h-auto w-full max-w-[35rem] animate-[map-arrival_650ms_cubic-bezier(0.2,0.75,0.2,1)_both] text-[rgb(73_81_101_/_48%)] drop-shadow-[0_12px_22px_rgb(63_55_176_/_9%)]"
      viewBox="0 0 560 300"
      role="img"
      aria-label="A map of connected fictional sites"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M88 93 210 57l103 67 135-44" />
        <path d="m88 93 55 123 156 27 149-163" />
        <path d="m210 57 4 118 85 68 14-119" />
        <path d="m214 175-71 41M313 124l98 91" />
      </g>
      <g stroke="currentColor" strokeWidth="3">
        <circle cx="88" cy="93" r="12" fill="#d9d5ff" />
        <circle cx="210" cy="57" r="9" fill="var(--paper)" />
        <circle cx="313" cy="124" r="14" fill="var(--accent)" />
        <circle cx="448" cy="80" r="8" fill="var(--paper)" />
        <circle cx="143" cy="216" r="10" fill="var(--paper)" />
        <circle cx="214" cy="175" r="7" fill="var(--paper)" />
        <circle cx="299" cy="243" r="9" fill="#d9d5ff" />
        <circle cx="411" cy="215" r="11" fill="var(--paper)" />
      </g>
      <text
        x="313"
        y="132"
        textAnchor="middle"
        fill="white"
        className="text-[19px] font-black"
      >
        .zz
      </text>
    </svg>
  );
}

function friendlyError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The fictional web could not be reached.";
}

function viewFromBrowseResult(result: BrowseResult): BrowserView {
  return result.outcome === "found"
    ? { kind: "site", result }
    : { kind: "not_found", address: result.address };
}

export function BrowserShell() {
  const [people, setPeople] = useState<Person[]>([]);
  const [address, setAddress] = useState("");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<BrowserView>({ kind: "welcome" });
  const peopleRequestId = useRef(0);
  const peopleAbortController = useRef<AbortController | null>(null);
  const navigationRequestId = useRef(0);
  const navigationAbortController = useRef<AbortController | null>(null);
  const activePersonId = useBrowserStore((session) => session.activePersonId);
  const selectPerson = useBrowserStore((session) => session.selectPerson);
  const canGoBack = useBrowserStore(selectCanGoBack);
  const canGoForward = useBrowserStore(selectCanGoForward);
  const navigationCursor = useBrowserStore((session) => session.cursor);

  const acceptPeople = useCallback(
    (nextPeople: Person[]) => {
      const storedPersonId = useBrowserStore.getState().activePersonId;
      const nextPersonId =
        nextPeople.find(({ id }) => id === storedPersonId)?.id ??
        nextPeople[0]?.id ??
        null;

      setPeople(nextPeople);
      selectPerson(nextPersonId);
      setLoadStatus("ready");
    },
    [selectPerson],
  );

  async function loadPeople() {
    const requestId = ++peopleRequestId.current;
    peopleAbortController.current?.abort();
    const controller = new AbortController();
    peopleAbortController.current = controller;

    try {
      const nextPeople = await browserApi.getPeople(controller.signal);

      if (controller.signal.aborted || requestId !== peopleRequestId.current) {
        return;
      }

      acceptPeople(nextPeople);
    } catch (error) {
      if (controller.signal.aborted || requestId !== peopleRequestId.current) {
        return;
      }

      setLoadError(friendlyError(error));
      setLoadStatus("error");
      toast.error("Network unavailable", { description: friendlyError(error) });
    }
  }

  useEffect(() => {
    const requestId = ++peopleRequestId.current;
    const controller = new AbortController();
    peopleAbortController.current = controller;

    void Promise.resolve(hydrateBrowserSession())
      .then(() => browserApi.getPeople(controller.signal))
      .then((nextPeople) => {
        if (controller.signal.aborted || requestId !== peopleRequestId.current) {
          return;
        }

        acceptPeople(nextPeople);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== peopleRequestId.current) {
          return;
        }

        setLoadError(friendlyError(error));
        setLoadStatus("error");
        toast.error("Network unavailable", { description: friendlyError(error) });
      });

    return () => {
      peopleRequestId.current += 1;
      peopleAbortController.current?.abort();
      navigationRequestId.current += 1;
      navigationAbortController.current?.abort();
    };
  }, [acceptPeople]);

  function retryPeople() {
    setLoadStatus("loading");
    setLoadError(null);
    void loadPeople();
  }

  function cancelNavigation() {
    navigationRequestId.current += 1;
    navigationAbortController.current?.abort();
  }

  function changePerson(personId: string) {
    cancelNavigation();
    selectPerson(personId);
    setAddress("");
    setView({ kind: "welcome" });
  }

  function showUtility(kind: "search" | "history" | "publish") {
    cancelNavigation();

    if (kind === "search") {
      setAddress("");
      setView({ kind: "search", state: { status: "idle" } });
      return;
    }

    setView({ kind });
  }

  async function navigateTo(rawAddress: string, method: ArrivalMethod) {
    const normalizedAddress = parseFictionalAddress(rawAddress);

    if (!normalizedAddress) {
      setView({
        kind: "error",
        message:
          "Enter one name ending in .zz. Letters, numbers, and internal hyphens are allowed.",
      });
      toast.error("Address not recognized", {
        description: "Enter one name ending in .zz.",
      });
      return;
    }

    const personId = useBrowserStore.getState().activePersonId;
    if (!personId) {
      return;
    }

    const requestId = ++navigationRequestId.current;
    navigationAbortController.current?.abort();
    const controller = new AbortController();
    navigationAbortController.current = controller;

    setAddress(normalizedAddress);
    setView({ kind: "loading", address: normalizedAddress });

    try {
      const result = await useBrowserStore.getState().navigate(
        { type: "address", address: normalizedAddress },
        () =>
          browserApi.browse(
            { personId, address: normalizedAddress, method },
            controller.signal,
          ),
      );

      if (controller.signal.aborted || requestId !== navigationRequestId.current) {
        return;
      }

      setView(viewFromBrowseResult(result));
    } catch (error) {
      if (controller.signal.aborted || requestId !== navigationRequestId.current) {
        return;
      }

      setView({ kind: "error", message: friendlyError(error) });
      toast.error("Could not open that path", { description: friendlyError(error) });
    }
  }

  async function traverse(direction: NavigationDirection) {
    const personId = useBrowserStore.getState().activePersonId;
    if (!personId) {
      return;
    }

    const requestId = ++navigationRequestId.current;
    navigationAbortController.current?.abort();
    const controller = new AbortController();
    navigationAbortController.current = controller;

    try {
      const result = await useBrowserStore
        .getState()
        .traverse(direction, (entry) => {
          if (entry.type === "search") {
            setAddress("");
            setView({
              kind: "search",
              state: { status: "loading", query: entry.query },
            });

            return browserApi
              .search(entry.query, controller.signal)
              .then<NavigationResolution>((results) => ({
                type: "search",
                query: entry.query,
                results,
              }));
          }

          setAddress(entry.address);
          setView({ kind: "loading", address: entry.address });

          return browserApi
            .browse(
              { personId, address: entry.address, method: direction },
              controller.signal,
            )
            .then<NavigationResolution>((browseResult) => ({
              type: "browse",
              result: browseResult,
            }));
        });

      if (
        result === null ||
        controller.signal.aborted ||
        requestId !== navigationRequestId.current
      ) {
        return;
      }

      setView(
        result.type === "search"
          ? {
              kind: "search",
              state: {
                status: "ready",
                query: result.query,
                results: result.results,
              },
            }
          : viewFromBrowseResult(result.result),
      );
    } catch (error) {
      if (controller.signal.aborted || requestId !== navigationRequestId.current) {
        return;
      }

      setView({ kind: "error", message: friendlyError(error) });
      toast.error("Could not move through history", { description: friendlyError(error) });
    }
  }

  function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigateTo(address, "typed");
  }

  async function searchFor(rawQuery: string) {
    const query = rawQuery.trim();

    if (query === "") {
      setView({
        kind: "search",
        state: {
          status: "error",
          query: "",
          message: "Enter at least one word to search for.",
        },
      });
      toast.error("Enter a search term");
      return;
    }

    const requestId = ++navigationRequestId.current;
    navigationAbortController.current?.abort();
    const controller = new AbortController();
    navigationAbortController.current = controller;

    setView({
      kind: "search",
      state: { status: "loading", query },
    });

    try {
      const results = await useBrowserStore.getState().navigate(
        { type: "search", query },
        () => browserApi.search(query, controller.signal),
      );

      if (controller.signal.aborted || requestId !== navigationRequestId.current) {
        return;
      }

      setView({
        kind: "search",
        state: { status: "ready", query, results },
      });
    } catch (error) {
      if (controller.signal.aborted || requestId !== navigationRequestId.current) {
        return;
      }

      setView({
        kind: "search",
        state: { status: "error", query, message: friendlyError(error) },
      });
      toast.error("Search did not finish", { description: friendlyError(error) });
    }
  }

  const activePerson = people.find(({ id }) => id === activePersonId) ?? null;
  const browserReady = loadStatus === "ready" && activePerson !== null;
  const isNavigating =
    view.kind === "loading" ||
    (view.kind === "search" && view.state.status === "loading");

  return (
    <main className="min-h-dvh bg-transparent p-2 text-[var(--ink)] sm:p-4 xl:p-6">
      <section className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-[100rem] flex-col overflow-hidden rounded-2xl border border-white/80 bg-[var(--chrome)] shadow-[var(--shadow-window)] sm:min-h-[calc(100dvh-2rem)] xl:min-h-[calc(100dvh-3rem)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[linear-gradient(180deg,rgb(255_255_255_/_72%),transparent_75%),var(--chrome)] px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-3">
            <span className="relative isolate grid size-9 place-items-center overflow-hidden rounded-xl text-[0.72rem] font-bold tracking-[-0.04em] text-white before:absolute before:in-1 before:z-[-1] before:rounded-[0.55rem] before:bg-[radial-gradient(circle_at_34%_28%,#a69fff,var(--accent)_58%,var(--accent-deep))] before:shadow-[inset_0_1px_1px_rgb(255_255_255_/_45%)] before:content-['']">
              .zz
            </span>
            <div>
              <p className="text-[0.92rem] font-semibold leading-none tracking-[-0.025em]">
                Elsewhere
              </p>
              <p className="mt-1 text-[0.65rem] font-medium text-[var(--muted)]">
                Fictional web browser
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none">
            <span
              className={`size-2 shrink-0 rounded-full ring-2 ring-white ${
                loadStatus === "error"
                  ? "bg-[var(--danger)]"
                  : loadStatus === "loading"
                    ? "animate-pulse bg-[var(--warning)]"
                    : "bg-[var(--online)]"
              }`}
              aria-hidden="true"
            />
            <span className="sr-only">
              {loadStatus === "error"
                ? "Disconnected"
                : loadStatus === "loading"
                  ? "Connecting"
                  : "Connected"}
            </span>
            <label htmlFor="active-person" className="sr-only">
              Browse as
            </label>
            <select
              id="active-person"
              value={activePersonId ?? ""}
              onChange={(event) => changePerson(event.target.value)}
              disabled={loadStatus !== "ready" || people.length === 0}
              className="min-w-0 max-w-52 rounded-lg border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-semibold text-[#414958] shadow-[var(--shadow-control)] outline-none transition focus:border-[var(--accent)] focus:ring-3 focus:ring-[rgb(103_92_245_/_12%)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadStatus === "loading" && <option>Finding people…</option>}
              {loadStatus === "error" && <option>Disconnected</option>}
              {loadStatus === "ready" && people.length === 0 && (
                <option>No people found</option>
              )}
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  Browsing as {person.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid gap-2 border-b border-[var(--line)] bg-[linear-gradient(180deg,rgb(255_255_255_/_72%),transparent_75%),var(--chrome)] p-2.5 sm:grid-cols-[auto_minmax(16rem,1fr)_auto] sm:items-center sm:px-3">
          <div className="flex gap-1" aria-label="Page navigation">
            <button
              type="button"
              onClick={() => void traverse("back")}
              disabled={!browserReady || isNavigating || !canGoBack}
              className="inline-grid size-10 place-items-center rounded-[0.7rem] border border-transparent text-[#4f5869] outline-none transition-[color,background-color,border-color,transform] hover:border-[var(--line)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => void traverse("forward")}
              disabled={!browserReady || isNavigating || !canGoForward}
              className="inline-grid size-10 place-items-center rounded-[0.7rem] border border-transparent text-[#4f5869] outline-none transition-[color,background-color,border-color,transform] hover:border-[var(--line)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Go forward"
              title="Go forward"
            >
              <ArrowRightIcon className="size-5" />
            </button>
          </div>

          <form className="flex min-w-0 overflow-hidden rounded-xl border border-[var(--line-strong)] bg-white/70 shadow-[var(--shadow-control)] transition-[border-color,box-shadow,background-color] focus-within:border-[rgb(103_92_245_/_62%)] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgb(103_92_245_/_13%),0_4px_14px_rgb(31_38_52_/_8%)]" onSubmit={submitAddress}>
            <label htmlFor="address" className="sr-only">
              Fictional address
            </label>
            <div className="flex min-w-0 flex-1 items-center">
              <span className="ml-3 grid size-5 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-[0.58rem] font-bold text-[var(--accent-deep)]" aria-hidden="true">
                .zz
              </span>
              <input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={!browserReady}
                autoComplete="off"
                spellCheck="false"
                placeholder="Type an address, like lantern-room.zz"
                className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-[0.82rem] font-medium outline-none placeholder:font-normal placeholder:text-[#9098a7] disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!browserReady || isNavigating || address.trim() === ""}
              className="m-1 min-w-12 rounded-lg border border-[var(--line)] bg-[var(--chrome)] px-3 text-xs font-semibold text-[#444c5c] transition-colors hover:border-[var(--line-strong)] hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[rgb(103_92_245_/_24%)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Go
            </button>
          </form>

          <nav className="flex justify-end gap-1" aria-label="Browser tools">
            <button
              type="button"
              onClick={() => showUtility("search")}
              disabled={!browserReady || isNavigating}
              className={`inline-grid size-10 place-items-center rounded-[0.7rem] border text-[#4f5869] outline-none transition-[color,background-color,border-color,transform] hover:border-[var(--line)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 ${view.kind === "search" ? "border-[rgb(103_92_245_/_18%)] bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "border-transparent"}`}
              aria-label="Search"
              aria-pressed={view.kind === "search"}
              title="Search"
            >
              <SearchIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => showUtility("history")}
              disabled={!browserReady || isNavigating}
              className={`inline-grid size-10 place-items-center rounded-[0.7rem] border text-[#4f5869] outline-none transition-[color,background-color,border-color,transform] hover:border-[var(--line)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 ${view.kind === "history" ? "border-[rgb(103_92_245_/_18%)] bg-[var(--accent-soft)] text-[var(--accent-deep)]" : "border-transparent"}`}
              aria-label="History"
              aria-pressed={view.kind === "history"}
              title="History"
            >
              <HistoryIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => showUtility("publish")}
              disabled={!browserReady || isNavigating}
              className={`inline-grid h-10 min-w-10 grid-flow-col place-items-center gap-2 rounded-[0.7rem] border px-3.5 text-[0.8125rem] font-semibold outline-none transition-[color,background-color,border-color,transform] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-35 ${view.kind === "publish" ? "border-[var(--accent-deep)] bg-[var(--accent)] text-white" : "border-[rgb(103_92_245_/_24%)] bg-[var(--accent-soft)] text-[var(--accent-deep)] hover:border-[rgb(103_92_245_/_34%)] hover:bg-[#e5e2ff]"}`}
              aria-pressed={view.kind === "publish"}
              title="Publish a site"
            >
              <PublishIcon className="size-4" />
              Publish
            </button>
          </nav>
        </div>

        <div className="flex min-h-[32rem] flex-1 p-2 sm:p-3">
          <section
            className="relative flex min-h-full w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_1px_2px_rgb(31_38_52_/_8%),0_10px_32px_rgb(31_38_52_/_5%)]"
            aria-live="polite"
            aria-busy={loadStatus === "loading" || isNavigating}
          >
            {isNavigating && <span className="absolute top-0 left-0 z-30 h-0.5 w-[38%] animate-[navigation-progress_1.2s_ease-in-out_infinite] rounded-r-full bg-[linear-gradient(90deg,transparent,var(--accent)_26%,#9a92ff)]" aria-hidden="true" />}
            {loadStatus === "loading" && (
              <div className="m-auto w-full max-w-md px-8 text-center">
                <div className="mb-6"><LoadingOrbit /></div>
                <h1 className="text-2xl font-semibold tracking-[-0.035em]">
                  Opening the fictional web
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Looking for the people who can browse this network.
                </p>
              </div>
            )}

            {loadStatus === "error" && (
              <div className="m-auto max-w-md px-8 py-14 text-center">
                <StateOrb danger>!</StateOrb>
                <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">
                  The network is out of reach
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {loadError} Check that the API is running, then try again.
                </p>
                <button
                  type="button"
                  onClick={retryPeople}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-[1.15rem] text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-control)] outline-none transition-[background-color,border-color,box-shadow,transform] hover:border-[#b5bdca] hover:bg-[#fafbfc] focus-visible:border-[var(--accent)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(103_92_245_/_24%)] active:scale-[.97]"
                >
                  Try again
                </button>
              </div>
            )}

            {loadStatus === "ready" && people.length === 0 && (
              <div className="m-auto max-w-md px-8 py-14 text-center">
                <StateOrb>◌</StateOrb>
                <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">
                  Nobody is here yet
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Run the seed command, then reload this page to choose a person.
                </p>
              </div>
            )}

            {browserReady && view.kind === "welcome" && (
              <div className="network-grid relative flex w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#fbfbfe_100%)] px-6 py-12 text-center sm:px-12">
                <div className="relative z-10 flex w-full flex-col items-center">
                  <NetworkMap />
                  <h1 className="mt-1 max-w-2xl text-3xl font-semibold tracking-[-0.055em] sm:text-5xl">
                    A small web with strange corners.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                    {activePerson?.name}, enter a <strong>.zz</strong> address to begin.
                    Every path stays inside this fictional network.
                  </p>
                </div>
              </div>
            )}

            {browserReady && view.kind === "loading" && (
              <div className="m-auto w-full max-w-md px-8 text-center">
                <div className="mb-6"><LoadingOrbit /></div>
                <h1 className="text-2xl font-semibold tracking-[-0.035em]">
                  Following the path
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Looking for <strong>{view.address}</strong>.
                </p>
              </div>
            )}

            {browserReady && view.kind === "site" && (
              <SiteFrame
                title={view.result.site.title}
                html={view.result.site.html}
                onNavigate={(nextAddress) => void navigateTo(nextAddress, "link")}
              />
            )}

            {browserReady && view.kind === "not_found" && (
              <div className="network-grid relative m-auto flex min-h-full w-full items-center justify-center overflow-hidden px-8 py-14 text-center">
                <div className="relative z-10 max-w-lg">
                  <StateOrb className="!size-16 !text-2xl">?</StateOrb>
                  <h1 className="mt-7 text-3xl font-semibold tracking-[-0.045em]">
                    This path ends here
                  </h1>
                  <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                    <strong>{view.address}</strong> is a valid fictional address,
                    but nobody has published a site there.
                  </p>
                </div>
              </div>
            )}

            {browserReady && view.kind === "error" && (
              <div className="m-auto max-w-lg px-8 py-14 text-center">
                <StateOrb danger>!</StateOrb>
                <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">
                  The path could not be opened
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {view.message} Your Back and Forward path has not changed.
                </p>
              </div>
            )}

            {browserReady && view.kind === "search" && (
              <SearchPanel
                key={`${navigationCursor}:${view.state.status}:${view.state.status === "idle" ? "" : view.state.query}`}
                state={view.state}
                onSearch={(query) => void searchFor(query)}
                onOpen={(resultAddress) =>
                  void navigateTo(resultAddress, "search")
                }
              />
            )}

            {browserReady && view.kind === "history" && activePerson && (
              <HistoryPanel
                personId={activePerson.id}
                onNavigate={(historyAddress) =>
                  void navigateTo(historyAddress, "history")
                }
              />
            )}

            {browserReady && view.kind === "publish" && activePerson && (
              <PublishPanel
                author={activePerson}
                onPublished={(publishedAddress) =>
                  void navigateTo(publishedAddress, "publish")
                }
              />
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
