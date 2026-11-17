import { createFileRoute } from "@tanstack/react-router";
import { llmsTxt, textResponse } from "@/lib/seo";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => textResponse(llmsTxt(), "text/plain; charset=utf-8"),
    },
  },
});
