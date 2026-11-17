import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { seoPreflight, seoRewrite } from "./lib/seo-edge";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
// Edge HTML cache for public, query-free pages. City/country pages are CPU-heavy to SSR and the
// Worker CPU limit was producing intermittent 503s (error 1102) for crawlers. Pages hold no
// per-user data (scenarios live in the browser), so a short shared cache is safe.
const HTML_CACHE_SECONDS = 6 * 60 * 60;
const CACHEABLE_PREFIXES = ["/cities", "/countries", "/compare", "/methodology", "/about", "/privacy", "/terms", "/contact"];
function edgeCache(): Cache | undefined {
  try { return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default; } catch { return undefined; }
}
function isCacheable(request: Request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.hostname === "solarpayback.shop" && !url.search && (url.pathname === "/" || CACHEABLE_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)));
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const redirect = seoPreflight(request);
    if (redirect) return redirect;
    const cache = isCacheable(request) ? edgeCache() : undefined;
    if (cache) {
      const hit = await cache.match(request.url).catch(() => undefined);
      if (hit) return hit;
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const final = seoRewrite(request, await normalizeCatastrophicSsrResponse(response));
      if (cache && final.status === 200 && (final.headers.get("content-type") ?? "").includes("text/html") && !final.headers.has("set-cookie")) {
        const stored = new Response(final.clone().body, final);
        stored.headers.set("cache-control", `public, max-age=${HTML_CACHE_SECONDS}`);
        const put = cache.put(request.url, stored).catch(() => undefined);
        (ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined)?.waitUntil?.(put);
      }
      return final;
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
