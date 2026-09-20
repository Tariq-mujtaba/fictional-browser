"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseFictionalAddress } from "@/lib/fictional-address";

const BRIDGE_MESSAGE_TYPE = "fictional-web:navigate";
const BRIDGE_NONCE = "fictional-web-bridge";

const FRAME_STYLES = `
  :root { color-scheme: light; font-family: Georgia, 'Times New Roman', serif; }
  * { box-sizing: border-box; }
  body { max-width: 78ch; margin: 0 auto; padding: clamp(1.5rem, 5vw, 4rem); color: #18343a; background: #fffdf7; font-size: 18px; line-height: 1.7; }
  h1, h2, h3, h4, h5, h6 { line-height: 1.15; }
  a { color: #b43e2a; font-weight: bold; text-decoration-thickness: 2px; text-underline-offset: 0.16em; cursor: pointer; }
  a:focus-visible { outline: 3px solid #5d72d9; outline-offset: 3px; }
  blockquote { margin-inline: 0; padding-left: 1.25rem; border-left: 4px solid #f3cf57; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border: 1px solid #557078; text-align: left; }
  pre { overflow-x: auto; }
`;

const BRIDGE_SCRIPT = `
  for (const anchor of document.querySelectorAll('a[href]')) {
    anchor.dataset.fictionalAddress = anchor.getAttribute('href');
    anchor.setAttribute('href', '#');
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest('a[data-fictional-address]');
    if (!anchor) return;

    event.preventDefault();
    parent.postMessage({
      type: '${BRIDGE_MESSAGE_TYPE}',
      address: anchor.dataset.fictionalAddress,
    }, '*');
  });
`;

function createFrameDocument(html: string): string {
  const policy = [
    "default-src 'none'",
    "base-uri 'none'",
    "connect-src 'none'",
    "font-src 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "img-src 'none'",
    "media-src 'none'",
    `script-src 'nonce-${BRIDGE_NONCE}'`,
    "style-src 'unsafe-inline'",
  ].join("; ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="${policy}">
    <style>${FRAME_STYLES}</style>
  </head>
  <body>
    ${html}
    <script nonce="${BRIDGE_NONCE}">${BRIDGE_SCRIPT}</script>
  </body>
</html>`;
}

type SiteFrameProps = {
  title: string;
  html: string;
  onNavigate: (address: string) => void;
};

export function SiteFrame({ title, html, onNavigate }: SiteFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const document = useMemo(() => createFrameDocument(html), [html]);

  useEffect(() => {
    function receiveBridgeMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) {
        return;
      }

      const payload = event.data as unknown;
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("type" in payload) ||
        !("address" in payload) ||
        payload.type !== BRIDGE_MESSAGE_TYPE ||
        typeof payload.address !== "string"
      ) {
        return;
      }

      const address = parseFictionalAddress(payload.address);
      if (address) {
        onNavigate(address);
      }
    }

    window.addEventListener("message", receiveBridgeMessage);
    return () => window.removeEventListener("message", receiveBridgeMessage);
  }, [onNavigate]);

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={document}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      className="h-full min-h-[32rem] w-full border-0 bg-[var(--paper)]"
    />
  );
}
