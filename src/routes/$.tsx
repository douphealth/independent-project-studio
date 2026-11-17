import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFoundComponent } from "./__root";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  head: ({ params }) => pageHead({
    title: "Page not found | SolarPayback",
    description: "This page does not exist on SolarPayback.",
    path: `/${params._splat}`,
    noindex: true,
  }),
  headers: () => ({ "X-Robots-Tag": "noindex" }),
  notFoundComponent: NotFoundComponent,
});
