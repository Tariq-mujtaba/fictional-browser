"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { browserApi, type Person } from "@/lib/browser-api";
import { parseFictionalAddress } from "@/lib/fictional-address";

type PublishPanelProps = {
  author: Person;
  onPublished: (address: string) => void;
};

function friendlyError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "The site could not be published.";
}

export function PublishPanel({ author, onPublished }: PublishPanelProps) {
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAddress = parseFictionalAddress(address);

    if (!normalizedAddress) {
      setError("Enter one name ending in .zz. Letters, numbers, and internal hyphens are allowed.");
      return;
    }

    if (html.trim() === "") {
      setError("Write some visible HTML before publishing.");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setSubmitting(true);
    setError(null);

    try {
      const site = await browserApi.publish(
        {
          authorId: author.id,
          address: normalizedAddress,
          title: title.trim() || undefined,
          html,
        },
        controller.signal,
      );

      if (!controller.signal.aborted) {
        onPublished(site.address);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(friendlyError(reason));
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="h-full min-h-[32rem] w-full overflow-y-auto px-5 py-8 sm:px-10 sm:py-12">
      <form className="mx-auto w-full max-w-4xl" onSubmit={(event) => void submit(event)}>
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-5xl">
          Publish a new corner
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
          Publishing as <strong>{author.name}</strong>. Scripts, forms, embeds, and real-network resources will be removed.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-black">
            Address
            <input value={address} onChange={(event) => setAddress(event.target.value)} disabled={submitting} placeholder="my-new-site.zz" className="rounded-xl border-2 border-[var(--ink)] bg-white px-4 py-3 font-normal outline-none focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:opacity-60" />
          </label>
          <label className="grid gap-2 text-sm font-black">
            Title <span className="font-normal text-[var(--muted)]">Optional</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={submitting} placeholder="Uses the address when blank" className="rounded-xl border-2 border-[var(--ink)] bg-white px-4 py-3 font-normal outline-none focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:opacity-60" />
          </label>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-black">
          HTML
          <textarea value={html} onChange={(event) => setHtml(event.target.value)} disabled={submitting} rows={12} spellCheck="false" placeholder={'<article>\n  <h1>Hello, fictional web</h1>\n  <p>Visit <a href="lantern.zz">the Lantern Index</a>.</p>\n</article>'} className="resize-y rounded-xl border-2 border-[var(--ink)] bg-white px-4 py-3 font-mono text-sm font-normal leading-6 outline-none focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:opacity-60" />
        </label>

        {error && (
          <div role="alert" className="mt-5 border-l-4 border-[var(--coral)] bg-red-50 px-5 py-4 text-sm">
            <p className="font-black">The site was not published</p>
            <p className="mt-1 text-[var(--muted)]">{error}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-full border-2 border-[var(--ink)] bg-[var(--coral)] px-7 py-3 font-black text-white shadow-[3px_3px_0_var(--ink)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:shadow-[0_0_0_3px_var(--focus)] disabled:cursor-wait disabled:opacity-60">
            {submitting ? "Publishing…" : "Publish site"}
          </button>
        </div>
      </form>
    </div>
  );
}
