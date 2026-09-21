"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { browserApi, type Person } from "@/lib/browser-api";
import { parseFictionalAddress } from "@/lib/fictional-address";
import { fieldControlClass, panelCopyClass, panelHeadingClass, primaryButtonClass } from "./ui-primitives";

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
  const [submitting, setSubmitting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAddress = parseFictionalAddress(address);

    if (!normalizedAddress) {
      toast.error("Address not recognized", {
        description: "Enter one name ending in .zz.",
      });
      return;
    }

    if (html.trim() === "") {
      toast.error("Write some HTML before publishing");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setSubmitting(true);

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
        toast.success("Site published", { description: site.address });
        onPublished(site.address);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        toast.error("The site was not published", {
          description: friendlyError(reason),
        });
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="h-full min-h-[32rem] w-full overflow-y-auto px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
      <form className="mx-auto w-full max-w-5xl" onSubmit={(event) => void submit(event)}>
        <h1 className={panelHeadingClass}>
          Publish a new corner
        </h1>
        <p className={`${panelCopyClass} mt-3`}>
          Publishing as <strong>{author.name}</strong>. Scripts, forms, embeds, and real-network resources will be removed.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Address
            <input value={address} onChange={(event) => setAddress(event.target.value)} disabled={submitting} placeholder="my-new-site.zz" className={`${fieldControlClass} px-4 py-3 font-normal`} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span>Title <span className="ml-1 font-normal text-[var(--muted)]">Optional</span></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} disabled={submitting} placeholder="Uses the address when blank" className={`${fieldControlClass} px-4 py-3 font-normal`} />
          </label>
        </div>

        <label className="mt-5 grid gap-2 text-sm font-semibold">
          HTML
          <textarea value={html} onChange={(event) => setHtml(event.target.value)} disabled={submitting} rows={12} spellCheck="false" placeholder={'<article>\n  <h1>Hello, fictional web</h1>\n  <p>Visit <a href="lantern.zz">the Lantern Index</a>.</p>\n</article>'} className={`${fieldControlClass} resize-y px-4 py-3 font-mono text-sm font-normal leading-6`} />
        </label>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={submitting} className={`${primaryButtonClass} px-7`}>
            {submitting ? "Publishing…" : "Publish site"}
          </button>
        </div>
      </form>
    </div>
  );
}
