export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  // Deliberately local: no telemetry provider or third-party error service.
  if (typeof window !== "undefined") console.error("SolarPayback render error", { error, route: window.location.pathname, ...context });
}
