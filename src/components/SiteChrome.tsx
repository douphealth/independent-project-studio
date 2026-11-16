import { Link } from "@tanstack/react-router";
import { Sun } from "lucide-react";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const base = overlay ? "text-night-foreground" : "text-foreground";
  const linkCls = overlay
    ? "text-night-foreground/80 hover:text-night-foreground"
    : "text-muted-foreground hover:text-foreground";
  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 z-20" : "border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20"}`}>
      <div className={`mx-auto flex h-16 max-w-6xl items-center justify-between px-5 ${base}`}>
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-primary-foreground"><Sun className="h-4 w-4" /></span>
          SolarPayback
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium sm:gap-7">
          <Link to="/calculator" className={linkCls} activeProps={{ className: "!text-primary" }}>Calculator</Link>
          <Link to="/cities" className={linkCls} activeProps={{ className: "!text-primary" }}>Cities</Link>
          <Link to="/methodology" className={`hidden sm:inline ${linkCls}`} activeProps={{ className: "!text-primary" }}>Methodology</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-night text-night-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl">SolarPayback</p>
          <p className="mt-3 text-sm text-night-muted">Independent solar payback estimates built on EU JRC PVGIS irradiation data. No installer commissions, no lead selling.</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold">Explore</p>
          <ul className="space-y-2 text-night-muted">
            <li><Link to="/calculator" className="hover:text-night-foreground">Payback calculator</Link></li>
            <li><Link to="/cities" className="hover:text-night-foreground">City solar directory</Link></li>
            <li><Link to="/methodology" className="hover:text-night-foreground">Methodology & limits</Link></li>
          </ul>
        </div>
        <p className="text-xs leading-relaxed text-night-muted">Estimates only — not financial advice or an engineering survey. Solar data © European Union, PVGIS (JRC). Geocoding by Open-Meteo.</p>
      </div>
    </footer>
  );
}
