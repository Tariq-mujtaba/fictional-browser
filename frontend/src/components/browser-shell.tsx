"use client";

import {
  type FormEvent,
  type SVGProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { browserApi, type Person } from "@/lib/browser-api";
import {
  hydrateBrowserSession,
  selectCanGoBack,
  selectCanGoForward,
  useBrowserStore,
} from "@/stores/browser-store";

type LoadStatus = "loading" | "ready" | "error";

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
      className="network-map h-auto w-full max-w-[35rem]"
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
        <circle cx="88" cy="93" r="12" fill="var(--signal)" />
        <circle cx="210" cy="57" r="9" fill="var(--paper)" />
        <circle cx="313" cy="124" r="14" fill="var(--coral)" />
        <circle cx="448" cy="80" r="8" fill="var(--paper)" />
        <circle cx="143" cy="216" r="10" fill="var(--paper)" />
        <circle cx="214" cy="175" r="7" fill="var(--paper)" />
        <circle cx="299" cy="243" r="9" fill="var(--signal)" />
        <circle cx="411" cy="215" r="11" fill="var(--paper)" />
      </g>
      <text
        x="313"
        y="132"
        textAnchor="middle"
        fill="var(--ink)"
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

export function BrowserShell() {
  const [people, setPeople] = useState<Person[]>([]);
  const [address, setAddress] = useState("");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const peopleRequestId = useRef(0);
  const peopleAbortController = useRef<AbortController | null>(null);
  const activePersonId = useBrowserStore((session) => session.activePersonId);
  const selectPerson = useBrowserStore((session) => session.selectPerson);
  const canGoBack = useBrowserStore(selectCanGoBack);
  const canGoForward = useBrowserStore(selectCanGoForward);

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
      });

    return () => {
      peopleRequestId.current += 1;
      peopleAbortController.current?.abort();
    };
  }, [acceptPeople]);

  function retryPeople() {
    setLoadStatus("loading");
    setLoadError(null);
    void loadPeople();
  }

  function holdNavigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  const activePerson = people.find(({ id }) => id === activePersonId) ?? null;
  const browserReady = loadStatus === "ready" && activePerson !== null;

  return (
    <main className="min-h-dvh bg-[var(--canvas)] p-3 text-[var(--ink)] sm:p-6 lg:p-8">
      <section className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[96rem] flex-col overflow-hidden rounded-[1.6rem] border-2 border-[var(--ink)] bg-[var(--chrome)] shadow-[8px_8px_0_var(--ink)] sm:min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-4rem)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--ink)] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--coral)] text-sm font-black text-white shadow-[2px_2px_0_var(--ink)]">
              .zz
            </span>
            <div>
              <p className="text-xl font-black leading-none tracking-[-0.04em]">
                Elsewhere
              </p>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                Fictional web browser
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none">
            <span
              className={`size-2.5 shrink-0 rounded-full border border-[var(--ink)] ${
                loadStatus === "error"
                  ? "bg-[var(--coral)]"
                  : loadStatus === "loading"
                    ? "status-pulse bg-[var(--signal)]"
                    : "bg-[var(--online)]"
              }`}
              aria-hidden="true"
            />
            <label htmlFor="active-person" className="sr-only">
              Browse as
            </label>
            <select
              id="active-person"
              value={activePersonId ?? ""}
              onChange={(event) => selectPerson(event.target.value)}
              disabled={loadStatus !== "ready" || people.length === 0}
              className="min-w-0 max-w-52 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-sm font-bold outline-none transition-shadow focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="grid gap-3 border-b-2 border-[var(--ink)] p-3 lg:grid-cols-[auto_minmax(18rem,1fr)_auto] lg:items-center lg:px-5">
          <div className="flex gap-2" aria-label="Page navigation">
            <button
              type="button"
              disabled={!browserReady || !canGoBack}
              className="chrome-button"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              disabled={!browserReady || !canGoForward}
              className="chrome-button"
              aria-label="Go forward"
            >
              <ArrowRightIcon className="size-5" />
            </button>
          </div>

          <form className="flex min-w-0" onSubmit={holdNavigation}>
            <label htmlFor="address" className="sr-only">
              Fictional address
            </label>
            <div className="flex min-w-0 flex-1 items-center rounded-l-full border-2 border-r-0 border-[var(--ink)] bg-[var(--paper)] focus-within:shadow-[0_0_0_3px_var(--focus)]">
              <span className="pl-4 text-xs font-black text-[var(--muted)]" aria-hidden="true">
                ZZ
              </span>
              <input
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={!browserReady}
                autoComplete="off"
                spellCheck="false"
                placeholder="Type an address, like lantern-room.zz"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-bold outline-none placeholder:font-normal placeholder:text-[var(--muted)] disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled
              className="rounded-r-full border-2 border-[var(--ink)] bg-[var(--ink)] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              Go
            </button>
          </form>

          <nav className="flex flex-wrap gap-2" aria-label="Browser tools">
            <button type="button" disabled className="tool-button">
              <SearchIcon className="size-4" />
              Search
            </button>
            <button type="button" disabled className="tool-button">
              <HistoryIcon className="size-4" />
              History
            </button>
            <button type="button" disabled className="tool-button tool-button-primary">
              <PublishIcon className="size-4" />
              Publish
            </button>
          </nav>
        </div>

        <div className="flex min-h-[32rem] flex-1 p-3 sm:p-5">
          <section
            className="relative flex min-h-full w-full overflow-hidden rounded-[1.1rem] border-2 border-[var(--ink)] bg-[var(--paper)]"
            aria-live="polite"
            aria-busy={loadStatus === "loading"}
          >
            {loadStatus === "loading" && (
              <div className="m-auto w-full max-w-md px-8 text-center">
                <div className="mx-auto mb-6 flex w-fit gap-2" aria-hidden="true">
                  <span className="loading-dot" />
                  <span className="loading-dot [animation-delay:120ms]" />
                  <span className="loading-dot [animation-delay:240ms]" />
                </div>
                <h1 className="text-2xl font-black tracking-[-0.03em]">
                  Opening the fictional web
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Looking for the people who can browse this network.
                </p>
              </div>
            )}

            {loadStatus === "error" && (
              <div className="m-auto max-w-md px-8 py-14 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--coral)] text-2xl font-black text-white">
                  !
                </span>
                <h1 className="mt-6 text-2xl font-black tracking-[-0.03em]">
                  The network is out of reach
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {loadError} Check that the API is running, then try again.
                </p>
                <button
                  type="button"
                  onClick={retryPeople}
                  className="mt-6 rounded-full border-2 border-[var(--ink)] bg-[var(--signal)] px-5 py-2.5 text-sm font-black shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] active:translate-y-0"
                >
                  Try again
                </button>
              </div>
            )}

            {loadStatus === "ready" && people.length === 0 && (
              <div className="m-auto max-w-md px-8 py-14 text-center">
                <p className="text-5xl" aria-hidden="true">
                  ◌
                </p>
                <h1 className="mt-4 text-2xl font-black tracking-[-0.03em]">
                  Nobody is here yet
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Run the seed command, then reload this page to choose a person.
                </p>
              </div>
            )}

            {browserReady && (
              <div className="network-grid relative flex w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center sm:px-12">
                <div className="relative z-10 flex w-full flex-col items-center">
                  <NetworkMap />
                  <h1 className="mt-1 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                    A small web with strange corners.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                    {activePerson?.name}, enter a <strong>.zz</strong> address to begin.
                    Every path stays inside this fictional network.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
