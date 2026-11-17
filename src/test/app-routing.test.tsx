import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

const PUBLIC_ROUTES = ["/", "/cities", "/cities/athens", "/countries/greece", "/compare", "/calculator", "/scenarios", "/about", "/privacy", "/terms", "/contact", "/methodology", "/sitemap.xml", "/robots.txt", "/llms.txt"];

describe("App routing", () => {
  it.each(PUBLIC_ROUTES)("matches %s instead of falling back to not found", (path) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(path);
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});
