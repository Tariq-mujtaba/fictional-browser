import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserApiError, browserApi } from "./browser-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browserApi", () => {
  it("calls the people endpoint with the supplied abort signal", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([{ id: "person-1", name: "Ari" }]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(browserApi.getPeople(signal)).resolves.toEqual([
      { id: "person-1", name: "Ari" },
    ]);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:3001/people");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ signal });
  });

  it("encodes search queries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([]));
    vi.stubGlobal("fetch", fetchMock);

    await browserApi.search("quiet gardens");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:3001/search?q=quiet+gardens",
    );
  });

  it("sends publish input as JSON", async () => {
    const request = {
      authorId: "person-1",
      address: "new-place.zz",
      html: "<p>Hello</p>",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ id: "site-1", ...request }, { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await browserApi.publish(request);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(request));
    expect(new Headers(init.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("exposes validation messages and status codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { message: ["address must be a .zz address", "html is required"] },
          { status: 400 },
        ),
      ),
    );

    const error = await browserApi
      .publish({ authorId: "bad", address: "bad", html: "" })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(BrowserApiError);
    expect(error).toMatchObject({
      status: 400,
      message: "address must be a .zz address html is required",
    });
  });
});
