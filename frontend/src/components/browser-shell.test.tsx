import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browserApi } from "@/lib/browser-api";
import {
  BROWSER_SESSION_STORAGE_KEY,
  useBrowserStore,
} from "@/stores/browser-store";
import { BrowserShell } from "./browser-shell";

const people = [
  { id: "person-1", name: "Ari" },
  { id: "person-2", name: "Mina" },
];

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
});
