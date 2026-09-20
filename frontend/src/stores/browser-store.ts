import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const BROWSER_SESSION_STORAGE_KEY = "fictional-web.browser-session";

export type NavigationEntry =
  | { type: "address"; address: string }
  | { type: "search"; query: string };

export type NavigationDirection = "back" | "forward";

type NavigationOperation<T> = () => Promise<T>;
type TraversalOperation<T> = (entry: NavigationEntry) => Promise<T>;

export type BrowserStore = {
  activePersonId: string | null;
  entries: NavigationEntry[];
  cursor: number;
  selectPerson: (personId: string | null) => void;
  navigate: <T>(
    entry: NavigationEntry,
    operation: NavigationOperation<T>,
  ) => Promise<T>;
  traverse: <T>(
    direction: NavigationDirection,
    operation: TraversalOperation<T>,
  ) => Promise<T | null>;
};

type BrowserSession = Pick<
  BrowserStore,
  "activePersonId" | "entries" | "cursor"
>;

const initialSession: BrowserSession = {
  activePersonId: null,
  entries: [],
  cursor: -1,
};

function targetCursor(
  session: BrowserSession,
  direction: NavigationDirection,
): number | null {
  const nextCursor = session.cursor + (direction === "back" ? -1 : 1);

  return nextCursor >= 0 && nextCursor < session.entries.length
    ? nextCursor
    : null;
}

export const useBrowserStore = create<BrowserStore>()(
  persist(
    (set, get) => ({
      ...initialSession,

      selectPerson(personId) {
        set((session) =>
          session.activePersonId === personId
            ? session
            : { ...initialSession, activePersonId: personId },
        );
      },

      async navigate(entry, operation) {
        const session = get();
        const result = await operation();

        set((current) => {
          if (
            current.activePersonId !== session.activePersonId ||
            current.entries !== session.entries ||
            current.cursor !== session.cursor
          ) {
            return current;
          }

          const entries = [
            ...current.entries.slice(0, current.cursor + 1),
            entry,
          ];

          return { entries, cursor: entries.length - 1 };
        });

        return result;
      },

      async traverse(direction, operation) {
        const session = get();
        const nextCursor = targetCursor(session, direction);

        if (nextCursor === null) {
          return null;
        }

        const result = await operation(session.entries[nextCursor]);

        set((current) =>
          current.activePersonId === session.activePersonId &&
          current.entries === session.entries &&
          current.cursor === session.cursor
            ? { cursor: nextCursor }
            : current,
        );

        return result;
      },
    }),
    {
      name: BROWSER_SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ activePersonId, entries, cursor }) => ({
        activePersonId,
        entries,
        cursor,
      }),
      skipHydration: true,
    },
  ),
);

export function hydrateBrowserSession() {
  return useBrowserStore.persist.rehydrate();
}

export function selectCanGoBack(session: BrowserSession): boolean {
  return targetCursor(session, "back") !== null;
}

export function selectCanGoForward(session: BrowserSession): boolean {
  return targetCursor(session, "forward") !== null;
}
