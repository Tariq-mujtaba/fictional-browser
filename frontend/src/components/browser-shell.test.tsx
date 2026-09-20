import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrowserApiError,
  browserApi,
  type BrowseResult,
  type SearchResult,
  type Site,
  type Visit,
} from "@/lib/browser-api";
import {
  BROWSER_SESSION_STORAGE_KEY,
  useBrowserStore,
} from "@/stores/browser-store";
import { BrowserShell } from "./browser-shell";

const people = [
  { id: "person-1", name: "Ari" },
  { id: "person-2", name: "Mina" },
];

function site(address: string, title: string): Site {
  return {
    id: `site-${address}`,
    address,
    title,
    html: `<h1>${title}</h1>`,
    author: people[0],
    publishedAt: "2026-01-01T00:00:00.000Z",
  };
}

function found(address: string, title: string): BrowseResult {
  return {
    outcome: "found",
    address,
    site: site(address, title),
  };
}

beforeEach(() => {
  useBrowserStore.setState({
    activePersonId: null,
    entries: [],
    cursor: -1,
  });
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BrowserShell", () => {
  it("restores and persists the active person", async () => {
    sessionStorage.setItem(
      BROWSER_SESSION_STORAGE_KEY,
      JSON.stringify({
        state: { activePersonId: "person-2", entries: [], cursor: -1 },
        version: 0,
      }),
    );
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);

    render(<BrowserShell />);

    const selector = (await screen.findByRole("combobox", {
      name: "Browse as",
    })) as HTMLSelectElement;
    await waitFor(() => expect(selector.value).toBe("person-2"));

    fireEvent.change(selector, { target: { value: "person-1" } });

    expect(useBrowserStore.getState().activePersonId).toBe("person-1");
    expect(sessionStorage.getItem(BROWSER_SESSION_STORAGE_KEY)).toContain(
      '"activePersonId":"person-1"',
    );
  });

  it("shows an actionable error and can retry", async () => {
    const getPeople = vi
      .spyOn(browserApi, "getPeople")
      .mockRejectedValueOnce(new Error("Connection refused."))
      .mockResolvedValueOnce(people);

    render(<BrowserShell />);

    expect(
      await screen.findByRole("heading", { name: "The network is out of reach" }),
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByText("A small web with strange corners."),
    ).toBeDefined();
    expect(getPeople).toHaveBeenCalledTimes(2);
  });

  it("normalizes a typed address and renders the resolved site", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockResolvedValue(found("lantern.zz", "Lantern Index"));

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");

    fireEvent.change(screen.getByLabelText("Fictional address"), {
      target: { value: "  Lantern.ZZ " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(await screen.findByTitle("Lantern Index")).toBeDefined();
    expect(browse).toHaveBeenCalledWith(
      {
        personId: "person-1",
        address: "lantern.zz",
        method: "typed",
      },
      expect.any(AbortSignal),
    );
    expect(useBrowserStore.getState()).toMatchObject({
      entries: [{ type: "address", address: "lantern.zz" }],
      cursor: 0,
    });
  });

  it("renders a missing address as a successful browsing outcome", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    vi.spyOn(browserApi, "browse").mockResolvedValue({
      outcome: "not_found",
      address: "nowhere.zz",
    });

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");

    fireEvent.change(screen.getByLabelText("Fictional address"), {
      target: { value: "nowhere.zz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(
      await screen.findByRole("heading", { name: "This path ends here" }),
    ).toBeDefined();
    expect(useBrowserStore.getState().cursor).toBe(0);
  });

  it("routes an authored link through normal fictional navigation", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockImplementation(({ address }) =>
        Promise.resolve(
          found(address, address === "lantern.zz" ? "Lantern Index" : "Moss Library"),
        ),
      );

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");

    fireEvent.change(screen.getByLabelText("Fictional address"), {
      target: { value: "lantern.zz" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    const frame = (await screen.findByTitle("Lantern Index")) as HTMLIFrameElement;

    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { type: "fictional-web:navigate", address: "moss.zz" },
      }),
    );

    expect(await screen.findByTitle("Moss Library")).toBeDefined();
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ address: "moss.zz", method: "link" }),
      expect.any(AbortSignal),
    );
  });

  it("resolves Back and Forward as recorded browse arrivals", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockImplementation(({ address }) =>
        Promise.resolve(found(address, address === "first.zz" ? "First" : "Second")),
      );

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");

    const addressInput = screen.getByLabelText("Fictional address");
    fireEvent.change(addressInput, { target: { value: "first.zz" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    await screen.findByTitle("First");

    fireEvent.change(addressInput, { target: { value: "second.zz" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    await screen.findByTitle("Second");

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    await screen.findByTitle("First");
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ address: "first.zz", method: "back" }),
      expect.any(AbortSignal),
    );

    fireEvent.click(screen.getByRole("button", { name: "Go forward" }));
    await screen.findByTitle("Second");
    expect(browse).toHaveBeenLastCalledWith(
      expect.objectContaining({ address: "second.zz", method: "forward" }),
      expect.any(AbortSignal),
    );
  });

  it("searches page content, opens a result, and restores the query on Back", async () => {
    const results: SearchResult[] = [
      {
        id: "site-lantern",
        address: "lantern.zz",
        title: "Lantern Index",
        author: people[0],
      },
    ];
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const search = vi.spyOn(browserApi, "search").mockResolvedValue(results);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockResolvedValue(found("lantern.zz", "Lantern Index"));

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");

    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.change(screen.getByLabelText("Search query"), {
      target: { value: "unfinished stories" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Search" }).at(-1)!);

    const result = await screen.findByRole("button", { name: /Lantern Index/ });
    fireEvent.click(result);
    await screen.findByTitle("Lantern Index");

    expect(browse).toHaveBeenCalledWith(
      expect.objectContaining({ address: "lantern.zz", method: "search" }),
      expect.any(AbortSignal),
    );
    expect(useBrowserStore.getState().entries).toEqual([
      { type: "search", query: "unfinished stories" },
      { type: "address", address: "lantern.zz" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("button", { name: /Lantern Index/ })).toBeDefined();
    expect(search).toHaveBeenCalledTimes(2);
    expect(useBrowserStore.getState().cursor).toBe(0);
  });

  it("shows a successful search with no results", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    vi.spyOn(browserApi, "search").mockResolvedValue([]);

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    fireEvent.change(screen.getByLabelText("Search query"), {
      target: { value: "impossible phrase" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Search" }).at(-1)!);

    expect(
      await screen.findByRole("heading", { name: "No pages mention that" }),
    ).toBeDefined();
    expect(useBrowserStore.getState().entries).toEqual([
      { type: "search", query: "impossible phrase" },
    ]);
  });

  it("loads person-scoped history and navigates from an entry", async () => {
    const visits: Visit[] = [
      {
        id: "visit-1",
        address: "lantern.zz",
        method: "link",
        outcome: "found",
        siteId: "site-lantern",
        visitedAt: "2026-01-01T10:00:00.000Z",
      },
    ];
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const getHistory = vi
      .spyOn(browserApi, "getHistory")
      .mockResolvedValue(visits);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockResolvedValue(found("lantern.zz", "Lantern Index"));

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");
    fireEvent.click(screen.getByRole("button", { name: "History" }));

    fireEvent.click(await screen.findByRole("button", { name: /lantern.zz/ }));
    await screen.findByTitle("Lantern Index");

    expect(getHistory).toHaveBeenCalledWith(
      "person-1",
      expect.any(AbortSignal),
    );
    expect(browse).toHaveBeenCalledWith(
      expect.objectContaining({ address: "lantern.zz", method: "history" }),
      expect.any(AbortSignal),
    );
  });

  it("publishes for the active person and browses the new site", async () => {
    const publishedSite = site("new-corner.zz", "new-corner.zz");
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    const publish = vi
      .spyOn(browserApi, "publish")
      .mockResolvedValue(publishedSite);
    const browse = vi
      .spyOn(browserApi, "browse")
      .mockResolvedValue({
        outcome: "found",
        address: publishedSite.address,
        site: publishedSite,
      });

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: " New-Corner.ZZ " },
    });
    fireEvent.change(screen.getByLabelText("HTML"), {
      target: { value: "<h1>A new corner</h1>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish site" }));

    await screen.findByTitle("new-corner.zz");
    expect(publish).toHaveBeenCalledWith(
      {
        authorId: "person-1",
        address: "new-corner.zz",
        title: undefined,
        html: "<h1>A new corner</h1>",
      },
      expect.any(AbortSignal),
    );
    expect(browse).toHaveBeenCalledWith(
      expect.objectContaining({ address: "new-corner.zz", method: "publish" }),
      expect.any(AbortSignal),
    );
  });

  it("shows duplicate publishing errors without changing navigation", async () => {
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);
    vi.spyOn(browserApi, "publish").mockRejectedValue(
      new BrowserApiError(409, "Address is already published"),
    );
    const browse = vi.spyOn(browserApi, "browse");

    render(<BrowserShell />);
    await screen.findByText("A small web with strange corners.");
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    fireEvent.change(screen.getByLabelText("Address"), {
      target: { value: "lantern.zz" },
    });
    fireEvent.change(screen.getByLabelText("HTML"), {
      target: { value: "<p>Duplicate</p>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish site" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Address is already published",
    );
    expect(useBrowserStore.getState()).toMatchObject({ entries: [], cursor: -1 });
    expect(browse).not.toHaveBeenCalled();
  });
});
