<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Stay fully independent: no Lovable Cloud, Lovable AI gateway, or Lovable-hosted services — the owner requires a self-contained app (external data only from free public APIs like PVGIS/Open-Meteo, called via server functions).
- Never hard-code solar yield or market prices per city; fetch PVGIS live so directory pages stay verifiable.
- Financial maths lives in `src/lib/solar.ts` as pure functions with tests in `solar.test.ts`; UI must not duplicate formulas.
- PVGIS/Open-Meteo access stays in server functions and `pvgis.server.ts`; browser code uses typed wrappers so upstream validation, timeouts, and caching remain centralized.
- Scenario persistence is browser-local in `storage.ts`; share payloads are validated in `scenarios.ts`; exports are generated on-device without a runtime storage service.
- Quote auditing rules live in `src/lib/audit.ts` (pure, tested); price checks compare only against user-entered quotes, never invented benchmarks.
