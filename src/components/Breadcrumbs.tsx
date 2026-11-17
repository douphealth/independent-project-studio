export function Breadcrumbs({ items, className = "" }: { items: readonly { name: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-muted-foreground ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <a href={item.href} className="hover:text-foreground">{item.name}</a> : <span className="text-foreground">{item.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbItems(crumbs: readonly { name: string; path: string }[]) {
  return crumbs.map((crumb, index) => (index < crumbs.length - 1 ? { name: crumb.name, href: crumb.path } : { name: crumb.name }));
}

export function RelatedLinks({ links }: { links: readonly { href: string; label: string }[] }) {
  if (!links.length) return null;
  return (
    <nav aria-label="Related pages" className="mt-12">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="font-medium text-primary underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
