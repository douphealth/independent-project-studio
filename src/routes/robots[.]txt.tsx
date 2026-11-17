import { createFileRoute } from "@tanstack/react-router";
import { robotsTxt, textResponse } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => textResponse(robotsTxt(), "text/plain; charset=utf-8"),
    },
  },
});
