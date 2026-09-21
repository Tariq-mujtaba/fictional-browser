"use client";

import { useEffect, useMemo, useRef } from "react";
import { parseFictionalAddress } from "@/lib/fictional-address";

const BRIDGE_MESSAGE_TYPE = "fictional-web:navigate";
const BRIDGE_NONCE = "fictional-web-bridge";

const FRAME_STYLES = `
  :root { color-scheme: light; font-family: Charter, 'Bitstream Charter', Georgia, 'Times New Roman', serif; }
  * { box-sizing: border-box; }
  html { min-height: 100%; background: #ffffff; }
  body { max-width: 76ch; margin: 0 auto; padding: clamp(2rem, 7vw, 5.5rem) clamp(1.35rem, 6vw, 4.5rem); color: #252936; background: #ffffff; font-size: clamp(17px, 1.4vw, 19px); line-height: 1.76; text-rendering: optimizeLegibility; }
  article { animation: page-arrival 360ms cubic-bezier(.2,.75,.2,1) both; }
  h1, h2, h3, h4, h5, h6 { color: #171a21; line-height: 1.14; letter-spacing: -0.025em; text-wrap: balance; }
  h1 { margin: 0 0 1.5rem; font-size: clamp(2.35rem, 6vw, 4.25rem); font-weight: 600; letter-spacing: -0.045em; }
  h2 { margin-top: 2.5rem; font-size: 1.7rem; }
  p { margin: 0 0 1.25em; }
  a { color: #5146dc; font-weight: 600; text-decoration-color: #b7b1ff; text-decoration-thickness: 1.5px; text-underline-offset: 0.2em; cursor: pointer; transition: color 140ms ease, text-decoration-color 140ms ease; }
  a:hover { color: #3f35bd; text-decoration-color: currentColor; }
  a:focus-visible { outline: 3px solid rgba(103, 92, 245, .24); outline-offset: 4px; border-radius: 2px; }
  blockquote { margin: 2rem 0; padding: .35rem 0 .35rem 1.4rem; border-left: 2px solid #9c94ff; color: #565f70; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-family: 'Segoe UI', sans-serif; font-size: .9em; }
  th, td { padding: .7rem .8rem; border-bottom: 1px solid #dce1ea; text-align: left; }
  th { color: #697386; font-weight: 600; }
  pre { overflow-x: auto; border: 1px solid #dce1ea; border-radius: .75rem; padding: 1rem; background: #f7f8fb; }
  code { font-family: 'Cascadia Code', Consolas, monospace; font-size: .86em; }
  ::selection { color: #171a21; background: #d8d4ff; }
  @keyframes page-arrival { from { opacity: 0; transform: translateY(6px); } }
  @media (prefers-reduced-motion: reduce) { article { animation: none; } }
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
