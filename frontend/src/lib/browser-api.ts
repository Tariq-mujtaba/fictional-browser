const DEFAULT_API_URL = "http://localhost:3001";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(
  /\/+$/,
  "",
);

export const ARRIVAL_METHODS = [
  "typed",
  "link",
  "back",
  "forward",
  "history",
  "search",
  "publish",
] as const;

export type ArrivalMethod = (typeof ARRIVAL_METHODS)[number];

export type Person = {
  id: string;
  name: string;
};

export type Site = {
  id: string;
  address: string;
  title: string;
  html: string;
  author: Person;
  publishedAt: string;
};

export type BrowseRequest = {
  personId: string;
  address: string;
  method: ArrivalMethod;
};

export type BrowseResult =
  | { outcome: "found"; address: string; site: Site }
  | { outcome: "not_found"; address: string };

export type SearchResult = {
  id: string;
  address: string;
  title: string;
  author: Person;
};

export type Visit = {
  id: string;
  address: string;
  method: ArrivalMethod;
  outcome: "found" | "not_found";
  siteId: string | null;
  visitedAt: string;
};

export type PublishSiteRequest = {
  authorId: string;
  address: string;
  title?: string;
  html: string;
};

type ApiErrorBody = {
  message?: unknown;
};

export class BrowserApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BrowserApiError";
  }
}

function errorMessage(body: ApiErrorBody | null, status: number): string {
  if (Array.isArray(body?.message)) {
    return body.message.filter((item) => typeof item === "string").join(" ");
  }

  if (typeof body?.message === "string") {
    return body.message;
  }

  return `The API returned status ${status}.`;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new BrowserApiError(response.status, errorMessage(body, response.status));
  }

  return (await response.json()) as T;
}

export const browserApi = {
  getPeople(signal?: AbortSignal): Promise<Person[]> {
    return requestJson<Person[]>("/people", { signal });
  },

  browse(request: BrowseRequest, signal?: AbortSignal): Promise<BrowseResult> {
    return requestJson<BrowseResult>("/browse", {
      method: "POST",
      body: JSON.stringify(request),
      signal,
    });
  },

  getHistory(personId: string, signal?: AbortSignal): Promise<Visit[]> {
    return requestJson<Visit[]>(
      `/people/${encodeURIComponent(personId)}/history`,
      { signal },
    );
  },

  search(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
    const parameters = new URLSearchParams({ q: query });
    return requestJson<SearchResult[]>(`/search?${parameters}`, { signal });
  },

  publish(
    request: PublishSiteRequest,
    signal?: AbortSignal,
  ): Promise<Site> {
    return requestJson<Site>("/sites", {
      method: "POST",
      body: JSON.stringify(request),
      signal,
    });
  },
};
