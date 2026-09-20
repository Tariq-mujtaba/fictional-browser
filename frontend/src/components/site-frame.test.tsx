import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiteFrame } from "./site-frame";

afterEach(cleanup);

describe("SiteFrame", () => {
  it("renders content with an opaque sandbox and restrictive CSP", () => {
    render(
      <SiteFrame
        title="Lantern Index"
        html='<h1>Lantern</h1><a href="moss.zz">Moss</a>'
        onNavigate={vi.fn()}
      />,
    );

    const frame = screen.getByTitle("Lantern Index") as HTMLIFrameElement;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.srcdoc).toContain("default-src 'none'");
    expect(frame.srcdoc).toContain("form-action 'none'");
    expect(frame.srcdoc).toContain("script-src 'nonce-fictional-web-bridge'");
    expect(frame.srcdoc).toContain('<a href="moss.zz">Moss</a>');
  });

  it("accepts only valid navigation from its own frame", () => {
    const onNavigate = vi.fn();
    render(
      <SiteFrame title="Lantern Index" html="<p>Lantern</p>" onNavigate={onNavigate} />,
    );

    const frame = screen.getByTitle("Lantern Index") as HTMLIFrameElement;

    window.dispatchEvent(
      new MessageEvent("message", {
        source: window,
        data: { type: "fictional-web:navigate", address: "moss.zz" },
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { type: "fictional-web:navigate", address: "https://moss.zz" },
      }),
    );
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.contentWindow,
        data: { type: "fictional-web:navigate", address: "  Moss.ZZ " },
      }),
    );

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith("moss.zz");
  });
});
