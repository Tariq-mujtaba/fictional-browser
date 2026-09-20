import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browserApi } from "@/lib/browser-api";
import {
  ACTIVE_PERSON_STORAGE_KEY,
  BrowserShell,
} from "./browser-shell";

const people = [
  { id: "person-1", name: "Ari" },
  { id: "person-2", name: "Mina" },
];

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BrowserShell", () => {
  it("restores and persists the active person", async () => {
    sessionStorage.setItem(ACTIVE_PERSON_STORAGE_KEY, "person-2");
    vi.spyOn(browserApi, "getPeople").mockResolvedValue(people);

    render(<BrowserShell />);

    const selector = (await screen.findByRole("combobox", {
      name: "Browse as",
    })) as HTMLSelectElement;
    await waitFor(() => expect(selector.value).toBe("person-2"));

    fireEvent.change(selector, { target: { value: "person-1" } });

    expect(sessionStorage.getItem(ACTIVE_PERSON_STORAGE_KEY)).toBe("person-1");
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
