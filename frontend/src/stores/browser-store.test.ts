import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BROWSER_SESSION_STORAGE_KEY,
  hydrateBrowserSession,
  selectCanGoBack,
  selectCanGoForward,
  useBrowserStore,
  type NavigationEntry,
} from "./browser-store";

const address = (value: string): NavigationEntry => ({
  type: "address",
  address: value,
});

const search = (query: string): NavigationEntry => ({
  type: "search",
  query,
});

const succeeds = async () => undefined;

beforeEach(() => {
  useBrowserStore.setState({
    activePersonId: null,
    entries: [],
    cursor: -1,
  });
  sessionStorage.clear();
});

describe("browserStore", () => {
  it("keeps traversal inside an empty stack", async () => {
    const operation = vi.fn(succeeds);

    expect(selectCanGoBack(useBrowserStore.getState())).toBe(false);
    expect(selectCanGoForward(useBrowserStore.getState())).toBe(false);
    await expect(
      useBrowserStore.getState().traverse("back", operation),
    ).resolves.toBeNull();
    await expect(
      useBrowserStore.getState().traverse("forward", operation),
    ).resolves.toBeNull();
    expect(operation).not.toHaveBeenCalled();
  });

  it("persists and restores the complete browser session", async () => {
    const store = useBrowserStore.getState();
    store.selectPerson("person-1");
    await store.navigate(address("first.zz"), succeeds);

    const persisted = sessionStorage.getItem(BROWSER_SESSION_STORAGE_KEY);
    expect(persisted).toContain('"address":"first.zz"');

    useBrowserStore.setState({
      activePersonId: null,
      entries: [],
      cursor: -1,
    });
    sessionStorage.setItem(BROWSER_SESSION_STORAGE_KEY, persisted!);
    await hydrateBrowserSession();

    expect(useBrowserStore.getState()).toMatchObject({
      activePersonId: "person-1",
      entries: [address("first.zz")],
      cursor: 0,
    });
  });

  it("clears navigation only when the active person changes", async () => {
    const store = useBrowserStore.getState();
    store.selectPerson("person-1");
    await store.navigate(address("first.zz"), succeeds);

    useBrowserStore.getState().selectPerson("person-1");
    expect(useBrowserStore.getState().entries).toEqual([address("first.zz")]);

    useBrowserStore.getState().selectPerson("person-2");
    expect(useBrowserStore.getState()).toMatchObject({
      activePersonId: "person-2",
      entries: [],
      cursor: -1,
    });
  });

  it("moves backward and forward only after successful traversal", async () => {
    const store = useBrowserStore.getState();
    await store.navigate(address("first.zz"), succeeds);
    await useBrowserStore.getState().navigate(address("second.zz"), succeeds);

    expect(selectCanGoBack(useBrowserStore.getState())).toBe(true);
    expect(selectCanGoForward(useBrowserStore.getState())).toBe(false);

    const backOperation = vi.fn(async (entry: NavigationEntry) => entry);
    await useBrowserStore.getState().traverse("back", backOperation);

    expect(backOperation).toHaveBeenCalledWith(address("first.zz"));
    expect(useBrowserStore.getState().cursor).toBe(0);
    expect(selectCanGoBack(useBrowserStore.getState())).toBe(false);
    expect(selectCanGoForward(useBrowserStore.getState())).toBe(true);

    await useBrowserStore.getState().traverse("forward", succeeds);
    expect(useBrowserStore.getState().cursor).toBe(1);
  });

  it("discards the forward branch after a new navigation", async () => {
    const store = useBrowserStore.getState();
    await store.navigate(address("first.zz"), succeeds);
    await useBrowserStore.getState().navigate(address("second.zz"), succeeds);
    await useBrowserStore.getState().navigate(address("third.zz"), succeeds);
    await useBrowserStore.getState().traverse("back", succeeds);

    await useBrowserStore
      .getState()
      .navigate(address("different.zz"), succeeds);

    expect(useBrowserStore.getState()).toMatchObject({
      entries: [
        address("first.zz"),
        address("second.zz"),
        address("different.zz"),
      ],
      cursor: 2,
    });
  });

  it("keeps every submitted search, including repeated queries", async () => {
    await useBrowserStore.getState().navigate(search("hidden gardens"), succeeds);
    await useBrowserStore.getState().navigate(search("night trains"), succeeds);
    await useBrowserStore.getState().navigate(search("night trains"), succeeds);

    expect(useBrowserStore.getState().entries).toEqual([
      search("hidden gardens"),
      search("night trains"),
      search("night trains"),
    ]);
  });

  it("keeps repeated address navigations as separate entries", async () => {
    await useBrowserStore.getState().navigate(address("first.zz"), succeeds);
    await useBrowserStore.getState().navigate(address("first.zz"), succeeds);

    expect(useBrowserStore.getState().entries).toEqual([
      address("first.zz"),
      address("first.zz"),
    ]);
  });

  it("does not change navigation when an operation fails", async () => {
    await useBrowserStore
      .getState()
      .navigate(address("first.zz"), succeeds);
    await useBrowserStore
      .getState()
      .navigate(address("second.zz"), succeeds);
    const beforeFailure = useBrowserStore.getState();
    const failure = new Error("Network unavailable");

    await expect(
      useBrowserStore
        .getState()
        .navigate(address("failed.zz"), async () => Promise.reject(failure)),
    ).rejects.toBe(failure);
    expect(useBrowserStore.getState()).toMatchObject({
      entries: beforeFailure.entries,
      cursor: beforeFailure.cursor,
    });

    await expect(
      useBrowserStore
        .getState()
        .traverse("back", async () => Promise.reject(failure)),
    ).rejects.toBe(failure);
    expect(useBrowserStore.getState()).toMatchObject({
      entries: beforeFailure.entries,
      cursor: beforeFailure.cursor,
    });
  });
});
