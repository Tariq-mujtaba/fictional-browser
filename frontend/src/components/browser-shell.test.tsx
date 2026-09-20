import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browserApi, type BrowseResult, type Site } from "@/lib/browser-api";
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
});
